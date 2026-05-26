-- Property management — Phase 6: dispatch pipeline metadata
-- Adds a per-message error column so the worker can record failure reasons,
-- and a sent_at column so the dashboard can show delivery time.

ALTER TABLE pm_messages
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS error text,
  ADD COLUMN IF NOT EXISTS attempt_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempted_at timestamptz;

-- An index that the worker uses to pick up queued messages.
CREATE INDEX IF NOT EXISTS idx_pm_messages_queued
  ON pm_messages (status, "createdAt")
  WHERE status = 'queued';

-- Index reminders by remind_at for the scheduler.
CREATE INDEX IF NOT EXISTS idx_pm_reminders_due
  ON pm_reminders (status, remind_at)
  WHERE status = 'scheduled';

-- Helper: enqueue a reminder as a pm_messages row when its remind_at is due.
CREATE OR REPLACE FUNCTION public.pm_dispatch_due_reminders()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  enqueued int := 0;
  r record;
  recipient_email text;
BEGIN
  FOR r IN
    SELECT pmr.*, pmt.email AS tenant_email
    FROM pm_reminders pmr
    LEFT JOIN pm_tenants pmt ON pmt.id = pmr."tenantId"
    WHERE pmr.status = 'scheduled'
      AND pmr.remind_at <= now()
  LOOP
    recipient_email := COALESCE(r.tenant_email, '');
    IF r.channel = 'email' AND recipient_email = '' THEN
      UPDATE pm_reminders
      SET status = 'failed', "updatedAt" = now()
      WHERE id = r.id;
      CONTINUE;
    END IF;

    INSERT INTO pm_messages (
      "ownerId", "tenantId", "invoiceId",
      kind, channel, recipient, subject, body, status
    ) VALUES (
      r."ownerId", r."tenantId", r."invoiceId",
      'reminder', r.channel, recipient_email,
      r.title, COALESCE(r.message, r.title), 'queued'
    );

    UPDATE pm_reminders
    SET status = 'sent', sent_at = now(), "updatedAt" = now()
    WHERE id = r.id;

    enqueued := enqueued + 1;
  END LOOP;
  RETURN enqueued;
END;
$$;

REVOKE ALL ON FUNCTION public.pm_dispatch_due_reminders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pm_dispatch_due_reminders() TO service_role;
GRANT EXECUTE ON FUNCTION public.pm_dispatch_due_reminders() TO authenticated;
