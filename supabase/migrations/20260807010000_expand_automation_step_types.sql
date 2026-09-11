alter table public.automation_steps
  drop constraint if exists automation_steps_step_type_check;

alter table public.automation_steps
  add constraint automation_steps_step_type_check
  check (
    step_type = any (
      array[
        'action'::text,
        'delay'::text,
        'condition'::text,
        'split_path'::text,
        'goal'::text,
        'jump'::text,
        'exit'::text
      ]
    )
  );
