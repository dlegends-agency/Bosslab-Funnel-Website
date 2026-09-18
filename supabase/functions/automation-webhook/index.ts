import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { runAutomationSteps } from "../_shared/automationRunner.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type JsonRecord = Record<string, unknown>;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function pickEmail(payload: JsonRecord) {
  return (
    asString(payload.email) ||
    asString(payload.Email) ||
    asString(payload.contact_email) ||
    asString((payload.contact as JsonRecord | undefined)?.email)
  );
}

function pickName(payload: JsonRecord) {
  return (
    asString(payload.first_name) ||
    asString(payload.firstName) ||
    asString(payload.name) ||
    asString((payload.contact as JsonRecord | undefined)?.first_name) ||
    "Webhook"
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const url = new URL(req.url);
    const automationId =
      url.searchParams.get("automation_id") ||
      url.searchParams.get("id") ||
      "";
    const key =
      url.searchParams.get("key") ||
      url.searchParams.get("webhook_key") ||
      "";

    if (!automationId || !key) {
      return json({ error: "Missing automation_id or key" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return json({ error: "Server misconfigured" }, 500);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: automation, error } = await admin
      .from("automations")
      .select("id, name, status, trigger_type, trigger_config")
      .eq("id", automationId)
      .maybeSingle();

    if (error || !automation) {
      return json({ error: "Automation not found" }, 404);
    }

    const config = (automation.trigger_config ?? {}) as JsonRecord;
    if (asString(config.webhook_key) !== key) {
      return json({ error: "Invalid webhook key" }, 401);
    }

    if (automation.trigger_type !== "webhook_received") {
      return json({ error: "Automation is not a webhook trigger" }, 400);
    }

    let payload: JsonRecord = {};
    if (req.method === "POST") {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        payload = (await req.json().catch(() => ({}))) as JsonRecord;
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const form = await req.formData();
        form.forEach((value, formKey) => {
          payload[formKey] = typeof value === "string" ? value : value.name;
        });
      } else {
        const text = await req.text();
        if (text) {
          try {
            payload = JSON.parse(text) as JsonRecord;
          } catch {
            payload = { raw: text };
          }
        }
      }
    } else {
      payload = { method: "GET", ping: true };
    }

    const receivedAt = new Date().toISOString();
    const nextConfig = {
      ...config,
      webhook_key: key,
      last_received_at: receivedAt,
      last_payload: payload,
    };

    await admin
      .from("automations")
      .update({
        trigger_config: nextConfig,
        updated_at: receivedAt,
      })
      .eq("id", automation.id);

    const email = pickEmail(payload).toLowerCase();
    let contactId: string | null = null;
    let runId: string | null = null;

    if (email) {
      const { data: existing } = await admin
        .from("contacts")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (existing) {
        contactId = existing.id as string;
      } else {
        const { data: created, error: createError } = await admin
          .from("contacts")
          .insert({
            first_name: pickName(payload),
            last_name: asString(payload.last_name) || asString(payload.lastName),
            email,
            phone: asString(payload.phone),
            status: "subscribed",
            notes: "Created from automation webhook",
          })
          .select("id")
          .single();
        if (!createError && created) contactId = created.id as string;
      }
    }

    if (automation.status === "active" && contactId) {
      const frequency = asString(config.run_frequency) || "once";
      if (frequency === "once") {
        const { count } = await admin
          .from("automation_runs")
          .select("id", { count: "exact", head: true })
          .eq("automation_id", automation.id)
          .eq("contact_id", contactId)
          .in("status", ["completed", "running", "waiting"]);
        if ((count ?? 0) > 0) {
          return json({
            ok: true,
            received_at: receivedAt,
            skipped: "already_ran_once",
            contact_id: contactId,
          });
        }
      }

      const { data: run } = await admin
        .from("automation_runs")
        .insert({
          automation_id: automation.id,
          contact_id: contactId,
          status: "running",
          current_step: 0,
        })
        .select("id")
        .single();

      if (run) {
        runId = run.id as string;
        await admin.from("automation_run_logs").insert({
          run_id: run.id,
          step_id: null,
          status: "success",
          message: "Webhook received",
        });

        await runAutomationSteps({
          admin,
          runId: run.id as string,
          automationId: automation.id as string,
          contactId,
          startIndex: 0,
        });
      }
    }

    return json({
      ok: true,
      received_at: receivedAt,
      contact_id: contactId,
      run_id: runId,
      message: "Webhook received",
    });
  } catch (err) {
    return json(
      {
        error: err instanceof Error ? err.message : "Webhook failed",
      },
      500,
    );
  }
});
