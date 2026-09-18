import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { runAutomationSteps } from "../_shared/automationRunner.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return json({ error: "Server misconfigured" }, 500);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: dueRuns, error } = await admin
      .from("automation_runs")
      .select("id, automation_id, contact_id, current_step")
      .eq("status", "waiting")
      .lte("resume_at", new Date().toISOString())
      .limit(100);

    if (error) {
      return json({ error: error.message }, 500);
    }

    const results: Array<{ run_id: string; status: string }> = [];

    for (const run of dueRuns ?? []) {
      const result = await runAutomationSteps({
        admin,
        runId: run.id as string,
        automationId: run.automation_id as string,
        contactId: run.contact_id as string,
        startIndex: (run.current_step as number) ?? 0,
      });
      results.push({ run_id: run.id as string, status: result.status });
    }

    return json({ ok: true, resumed: results.length, results });
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Resume failed" },
      500,
    );
  }
});
