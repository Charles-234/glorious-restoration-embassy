-- Normalize legacy CMS kinds and record explicit consent on contact submissions.
DO $$
DECLARE
  constraint_row record;
  kind_attribute smallint;
BEGIN
  SELECT attnum
    INTO kind_attribute
    FROM pg_attribute
    WHERE attrelid = 'public.site_content'::regclass
      AND attname = 'kind'
      AND NOT attisdropped;

  FOR constraint_row IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.site_content'::regclass
      AND contype = 'c'
      AND conkey @> ARRAY[kind_attribute]::smallint[]
  LOOP
    EXECUTE format(
      'ALTER TABLE public.site_content DROP CONSTRAINT %I',
      constraint_row.conname
    );
  END LOOP;
END;
$$;

ALTER TABLE public.site_content
  ALTER COLUMN kind TYPE text
  USING kind::text;

ALTER TABLE public.site_content
  ADD CONSTRAINT site_content_kind_check
  CHECK (kind IN ('sermon', 'event', 'announcement', 'gallery', 'setting'))
  NOT VALID;

ALTER TABLE public.prayer_requests
  ADD COLUMN IF NOT EXISTS privacy_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS privacy_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS privacy_notice_version text NOT NULL DEFAULT '2026-10-07';

DROP POLICY IF EXISTS "Require recorded privacy consent on inbox submissions"
  ON public.prayer_requests;

CREATE POLICY "Require recorded privacy consent on inbox submissions"
  ON public.prayer_requests
  AS RESTRICTIVE
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (privacy_consent = true AND privacy_consent_at IS NOT NULL);
