import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type JsonRecord = Record<string, unknown>;

export type ConditionRule = {
  field: string;
  operator: string;
  value?: string;
};

export type AutomationStepRow = {
  id: string;
  step_type: string;
  action_type: string | null;
  config: JsonRecord;
};

export type RunAutomationStepsArgs = {
  admin: SupabaseClient;
  runId: string;
  automationId: string;
  contactId: string;
  startIndex: number;
};

export type RunAutomationStepsResult = {
  status: "completed" | "failed" | "waiting";
  resumeAt?: string;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function applyMergeFields(text: string, contact: JsonRecord) {
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (match, key: string) => {
    const value = contact[key.toLowerCase()];
    return typeof value === "string" && value ? value : match;
  });
}

const UNIT_MS: Record<string, number> = {
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
  weeks: 604_800_000,
};

function rollForwardToTimeOfDay(date: Date, timeValue: string) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return date;
  const next = new Date(date);
  next.setHours(hours, minutes, 0, 0);
  if (next.getTime() < date.getTime()) next.setDate(next.getDate() + 1);
  return next;
}

function rollForwardToWeekday(date: Date, weekdays: number[]) {
  if (!weekdays.length) return date;
  const next = new Date(date);
  for (let i = 0; i < 7; i += 1) {
    if (weekdays.includes(next.getDay())) return next;
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
  }
  return next;
}

function computeResumeAt(step: AutomationStepRow, contact: JsonRecord): Date {
  const mode = asString(step.config.delay_mode) || "period";

  if (mode === "datetime") {
    const raw = asString(step.config.delay_datetime);
    const configured = raw ? new Date(raw) : new Date();
    return configured.getTime() > Date.now() ? configured : new Date();
  }

  if (mode === "custom_field") {
    const field = asString(step.config.delay_custom_field);
    const raw = field ? contact[field] : undefined;
    const parsed = typeof raw === "string" ? new Date(raw) : null;
    if (parsed && !Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now()) {
      return parsed;
    }
    return new Date();
  }

  const amount = Number(step.config.delay_amount ?? step.config.delay_days ?? 1);
  const unit = asString(step.config.delay_unit) || "days";
  let resumeAt = new Date(Date.now() + amount * (UNIT_MS[unit] ?? UNIT_MS.days));

  const untilTimeValue = asString(step.config.delay_until_time_value);
  if (step.config.delay_until_time && untilTimeValue) {
    resumeAt = rollForwardToTimeOfDay(resumeAt, untilTimeValue);
  }
  const untilWeekdays = Array.isArray(step.config.delay_until_weekdays)
    ? (step.config.delay_until_weekdays as number[])
    : [];
  if (step.config.delay_until_weekday && untilWeekdays.length) {
    resumeAt = rollForwardToWeekday(resumeAt, untilWeekdays);
  }

  return resumeAt;
}

function coerceRuleValue(field: string, contact: JsonRecord): string | number | null {
  switch (field) {
    case "total_revenue":
      return Number(contact.total_revenue ?? 0);
    case "email":
    case "first_name":
    case "last_name":
    case "phone":
    case "company":
    case "status":
    case "business_niche":
    case "order_plan":
    case "onboarded_at": {
      const value = contact[field];
      return typeof value === "string" && value ? value : null;
    }
    default:
      return null;
  }
}

function evaluateRule(
  rule: ConditionRule,
  contact: JsonRecord,
  tagIds: string[],
  listIds: string[],
) {
  if (rule.field === "has_tag") {
    const has = Boolean(rule.value) && tagIds.includes(rule.value!);
    return rule.operator === "not_has" ? !has : has;
  }
  if (rule.field === "has_list") {
    const has = Boolean(rule.value) && listIds.includes(rule.value!);
    return rule.operator === "not_has" ? !has : has;
  }

  const actual = coerceRuleValue(rule.field, contact);

  switch (rule.operator) {
    case "is_set":
      return actual !== null && actual !== "";
    case "is_empty":
      return actual === null || actual === "";
    case "equals":
      return String(actual ?? "").toLowerCase() === (rule.value ?? "").toLowerCase();
    case "not_equals":
      return String(actual ?? "").toLowerCase() !== (rule.value ?? "").toLowerCase();
    case "contains":
      return String(actual ?? "").toLowerCase().includes((rule.value ?? "").toLowerCase());
    case "not_contains":
      return !String(actual ?? "").toLowerCase().includes((rule.value ?? "").toLowerCase());
    case "greater_than":
      return Number(actual ?? 0) > Number(rule.value ?? 0);
    case "less_than":
      return Number(actual ?? 0) < Number(rule.value ?? 0);
    default:
      return false;
  }
}

function evaluateLegacyCategory(category: string, contact: JsonRecord) {
  switch (category) {
    case "Contact Details":
      return Boolean(asString(contact.email as string));
    case "User":
    case "Segments":
      return contact.status === "subscribed";
    case "WooCommerce":
    case "Engagement":
      return Boolean(asString(contact.order_plan as string));
    case "Geography":
      return Boolean(asString(contact.address as string));
    default:
      return true;
  }
}

async function sendAutomationEmail(
  admin: SupabaseClient,
  contact: JsonRecord,
  subject: string,
  body: string,
) {
  const to = asString(contact.email as string);
  if (!to) throw new Error("Contact has no email address");
  const { data, error } = await admin.functions.invoke("send-email", {
    body: {
      to,
      subject: applyMergeFields(subject, contact),
      body: applyMergeFields(body, contact),
    },
  });
  if (error) throw new Error(error.message || "Failed to send email");
  const payload = data as { error?: string } | null;
  if (payload?.error) throw new Error(payload.error);
}

export async function runAutomationSteps({
  admin,
  runId,
  automationId,
  contactId,
  startIndex,
}: RunAutomationStepsArgs): Promise<RunAutomationStepsResult> {
  const { data: steps } = await admin
    .from("automation_steps")
    .select("*")
    .eq("automation_id", automationId)
    .order("position", { ascending: true });

  const { data: contactRow } = await admin
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .single();

  const contact = (contactRow ?? {}) as JsonRecord;
  const stepList = (steps ?? []) as AutomationStepRow[];

  let failed = false;
  let index = startIndex;
  const visited = new Set<number>();
  let tagIds: string[] | null = null;
  let listIds: string[] | null = null;

  const loadTagsAndLists = async () => {
    if (tagIds && listIds) return { tagIds, listIds };
    const [{ data: tagRows }, { data: listRows }] = await Promise.all([
      admin.from("contact_tags").select("tag_id").eq("contact_id", contactId),
      admin.from("contact_lists").select("list_id").eq("contact_id", contactId),
    ]);
    tagIds = (tagRows ?? []).map((row: { tag_id: string }) => row.tag_id);
    listIds = (listRows ?? []).map((row: { list_id: string }) => row.list_id);
    return { tagIds, listIds };
  };

  while (index < stepList.length) {
    if (visited.has(index)) {
      failed = true;
      await admin.from("automation_run_logs").insert({
        run_id: runId,
        step_id: stepList[index]?.id ?? null,
        status: "failed",
        message: "Jump loop detected",
      });
      break;
    }
    visited.add(index);
    const step = stepList[index];

    try {
      let message = "Step completed";
      let exit = false;
      let jumpTo: number | null = null;
      let pauseUntil: Date | null = null;

      if (step.step_type === "delay") {
        pauseUntil = computeResumeAt(step, contact);
        message = `Delay started — resumes ${pauseUntil.toLocaleString()}`;
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
        const rules = Array.isArray(step.config.condition_rules)
          ? (step.config.condition_rules as ConditionRule[])
          : [];
        if (rules.length) {
          const { tagIds: tags, listIds: lists } = await loadTagsAndLists();
          const matchMode = asString(step.config.condition_match) || "all";
          const passed =
            matchMode === "any"
              ? rules.some((rule) => evaluateRule(rule, contact, tags, lists))
              : rules.every((rule) => evaluateRule(rule, contact, tags, lists));
          message = passed
            ? `Condition passed (${rules.length} rule${rules.length === 1 ? "" : "s"}, match ${matchMode})`
            : "Condition failed — exiting";
          exit = !passed;
        } else {
          const categories = Array.isArray(step.config.condition_categories)
            ? (step.config.condition_categories as string[])
            : asString(step.config.condition_category)
              ? [asString(step.config.condition_category)]
              : [];
          if (!categories.length) {
            message = "Condition skipped (not configured)";
          } else {
            const passed = categories.some((category) => evaluateLegacyCategory(category, contact));
            message = passed
              ? `Condition passed (${categories.join(" OR ")})`
              : `Condition failed (${categories.join(" OR ")}) — exiting`;
            exit = !passed;
          }
        }
      } else if (step.action_type === "send_email") {
        const subject = asString(step.config.email_subject) || "(no subject)";
        const body = asString(step.config.email_body);
        await sendAutomationEmail(admin, contact, subject, body);
        message = `Email sent: "${subject}" → ${asString(contact.email as string)}`;
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
        run_id: runId,
        step_id: step.id,
        status: "success",
        message,
      });

      if (pauseUntil) {
        await admin
          .from("automation_runs")
          .update({
            status: "waiting",
            current_step: index + 1,
            resume_at: pauseUntil.toISOString(),
          })
          .eq("id", runId);
        return { status: "waiting", resumeAt: pauseUntil.toISOString() };
      }

      await admin
        .from("automation_runs")
        .update({ current_step: index + 1 })
        .eq("id", runId);

      if (exit) break;
      if (jumpTo != null && jumpTo >= 0 && jumpTo < stepList.length) {
        index = jumpTo;
        continue;
      }
      index += 1;
    } catch (stepErr) {
      failed = true;
      await admin.from("automation_run_logs").insert({
        run_id: runId,
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
    .eq("id", runId);

  return { status: failed ? "failed" : "completed" };
}
