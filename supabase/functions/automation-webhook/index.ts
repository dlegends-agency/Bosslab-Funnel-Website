import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
          .in("status", ["completed", "running"]);
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

        const { data: steps } = await admin
          .from("automation_steps")
          .select("*")
          .eq("automation_id", automation.id)
          .order("position", { ascending: true });

        const { data: contactRow } = await admin
          .from("contacts")
          .select("*")
          .eq("id", contactId)
          .single();

        let failed = false;
        let index = 0;
        const stepList = steps ?? [];
        const visited = new Set<number>();

        while (index < stepList.length) {
          if (visited.has(index)) {
            failed = true;
            await admin.from("automation_run_logs").insert({
              run_id: run.id,
              step_id: stepList[index]?.id ?? null,
              status: "failed",
              message: "Jump loop detected",
            });
            break;
          }
          visited.add(index);
          const step = stepList[index] as {
            id: string;
            step_type: string;
            action_type: string | null;
            config: Record<string, unknown>;
          };

          try {
            let message = "Step completed";
            let exit = false;
            let jumpTo: number | null = null;

            if (step.step_type === "delay") {
              const amount = Number(step.config.delay_amount ?? step.config.delay_days ?? 1);
              const unit = asString(step.config.delay_unit) || "days";
              message = `Delay recorded (${amount} ${unit})`;
            } else if (step.step_type === "exit") {
              message = asString(step.config.exit_reason) || "Exited automation";
              exit = true;
            } else if (step.step_type === "goal") {
              message = `Goal reached: ${asString(step.config.goal_name) || "Goal"}`;
              exit = true;
            } else if (step.step_type === "jump") {
              jumpTo = Number(step.config.jump_to_position ?? 0);
              message = `Jumping to step ${jumpTo + 1}`;
            } else if (step.step_type === "split_path") {
              const percent = Math.min(100, Math.max(0, Number(step.config.split_percent ?? 50)));
              const path = Math.random() * 100 < percent ? "A" : "B";
              message = `Split path ${path} selected (${percent}% / ${100 - percent}%)`;
            } else if (step.step_type === "condition") {
              const categories = Array.isArray(step.config.condition_categories)
                ? (step.config.condition_categories as string[])
                : asString(step.config.condition_category)
                  ? [asString(step.config.condition_category)]
                  : [];
              const contact = contactRow as Record<string, unknown> | null;
              const passed = categories.some((category) => {
                if (category === "Contact Details") return Boolean(asString(contact?.email));
                if (category === "User" || category === "Segments") {
                  return asString(contact?.status) === "subscribed";
                }
                if (category === "WooCommerce" || category === "Engagement") {
                  return Boolean(asString(contact?.order_plan));
                }
                if (category === "Geography") return Boolean(asString(contact?.address));
                return true;
              });
              message = passed
                ? `Condition passed (${categories.join(" OR ")})`
                : `Condition failed (${categories.join(" OR ")}) — exiting`;
              exit = !passed;
            } else if (step.action_type === "send_email") {
              message = `Email queued: ${asString(step.config.email_subject) || "Untitled"}`;
            } else if (step.action_type === "add_to_list" && asString(step.config.list_id)) {
              await admin.from("contact_lists").upsert(
                { contact_id: contactId, list_id: asString(step.config.list_id) },
                { onConflict: "contact_id,list_id", ignoreDuplicates: true },
              );
              message = `Added to list ${asString(step.config.list_id)}`;
            } else if (step.action_type === "remove_from_list" && asString(step.config.list_id)) {
              await admin
                .from("contact_lists")
                .delete()
                .eq("contact_id", contactId)
                .eq("list_id", asString(step.config.list_id));
              message = `Removed from list ${asString(step.config.list_id)}`;
            } else if (step.action_type === "add_tag" && asString(step.config.tag_id)) {
              await admin.from("contact_tags").upsert(
                { contact_id: contactId, tag_id: asString(step.config.tag_id) },
                { onConflict: "contact_id,tag_id", ignoreDuplicates: true },
              );
              message = `Added tag ${asString(step.config.tag_id)}`;
            } else if (step.action_type === "remove_tag" && asString(step.config.tag_id)) {
              await admin
                .from("contact_tags")
                .delete()
                .eq("contact_id", contactId)
                .eq("tag_id", asString(step.config.tag_id));
              message = `Removed tag ${asString(step.config.tag_id)}`;
            } else if (step.action_type === "zapier_webhook" && asString(step.config.webhook_url)) {
              await fetch(asString(step.config.webhook_url), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: contactId,
                  source: "bosslab_automation_webhook",
                }),
              });
              message = "Zapier webhook sent";
            } else {
              message = `Step ${step.step_type} completed`;
            }

            await admin.from("automation_run_logs").insert({
              run_id: run.id,
              step_id: step.id,
              status: "success",
              message,
            });
            await admin
              .from("automation_runs")
              .update({ current_step: index + 1 })
              .eq("id", run.id);

            if (exit) break;
            if (jumpTo != null && jumpTo >= 0 && jumpTo < stepList.length) {
              index = jumpTo;
              continue;
            }
            index += 1;
          } catch (stepErr) {
            failed = true;
            await admin.from("automation_run_logs").insert({
              run_id: run.id,
              step_id: step.id,
              status: "failed",
              message: stepErr instanceof Error ? stepErr.message : "Step failed",
            });
            break;
          }
        }

        await admin
          .from("automation_runs")
          .update({
            status: failed ? "failed" : "completed",
            finished_at: new Date().toISOString(),
          })
          .eq("id", run.id);
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
