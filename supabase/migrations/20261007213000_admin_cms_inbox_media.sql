-- Canonical editorial content, private prayer/enquiry inbox, and shared media access.

CREATE TABLE IF NOT EXISTS public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('sermon', 'event', 'announcement', 'gallery', 'setting')),
  slug text NOT NULL,
  title text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  published boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, slug)
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.site_content FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.site_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.site_content TO authenticated;

DROP POLICY IF EXISTS "Public can read published site content" ON public.site_content;
CREATE POLICY "Public can read published site content"
  ON public.site_content
  FOR SELECT
  TO anon, authenticated
  USING (published = true);

DROP POLICY IF EXISTS "CMS editors can manage site content" ON public.site_content;
CREATE POLICY "CMS editors can manage site content"
  ON public.site_content
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.cms_admins WHERE user_id = (SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = (SELECT auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.cms_admins WHERE user_id = (SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.admin_users WHERE id = (SELECT auth.uid()))
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can read media" ON storage.objects;
CREATE POLICY "Public can read media"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Admins can upload media" ON storage.objects;
CREATE POLICY "Admins can upload media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (
      EXISTS (SELECT 1 FROM public.admin_users WHERE id = (SELECT auth.uid()))
      OR EXISTS (SELECT 1 FROM public.cms_admins WHERE user_id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Admins can update media" ON storage.objects;
CREATE POLICY "Admins can update media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'media'
    AND (
      EXISTS (SELECT 1 FROM public.admin_users WHERE id = (SELECT auth.uid()))
      OR EXISTS (SELECT 1 FROM public.cms_admins WHERE user_id = (SELECT auth.uid()))
    )
  )
  WITH CHECK (
    bucket_id = 'media'
    AND (
      EXISTS (SELECT 1 FROM public.admin_users WHERE id = (SELECT auth.uid()))
      OR EXISTS (SELECT 1 FROM public.cms_admins WHERE user_id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Admins can delete media" ON storage.objects;
CREATE POLICY "Admins can delete media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'media'
    AND (
      EXISTS (SELECT 1 FROM public.admin_users WHERE id = (SELECT auth.uid()))
      OR EXISTS (SELECT 1 FROM public.cms_admins WHERE user_id = (SELECT auth.uid()))
    )
  );

ALTER TABLE public.prayer_requests
  ADD COLUMN IF NOT EXISTS admin_request_id uuid,
  ADD COLUMN IF NOT EXISTS request_type text NOT NULL DEFAULT 'prayer',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

UPDATE public.prayer_requests
SET admin_request_id = gen_random_uuid()
WHERE admin_request_id IS NULL;

ALTER TABLE public.prayer_requests
  ALTER COLUMN admin_request_id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN admin_request_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS prayer_requests_admin_request_id_idx
  ON public.prayer_requests (admin_request_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.prayer_requests'::regclass
      AND conname = 'prayer_requests_request_type_check'
  ) THEN
    ALTER TABLE public.prayer_requests
      ADD CONSTRAINT prayer_requests_request_type_check
      CHECK (request_type IN ('prayer', 'enquiry'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.prayer_requests'::regclass
      AND conname = 'prayer_requests_status_check'
  ) THEN
    ALTER TABLE public.prayer_requests
      ADD CONSTRAINT prayer_requests_status_check
      CHECK (status IN ('new', 'contacted', 'closed'));
  END IF;
END;
$$;

ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.prayer_requests FROM PUBLIC, anon, authenticated;
GRANT INSERT ON TABLE public.prayer_requests TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.prayer_requests TO authenticated;

DROP POLICY IF EXISTS "Visitors can submit private prayer requests" ON public.prayer_requests;
CREATE POLICY "Visitors can submit private prayer requests"
  ON public.prayer_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    is_private = true
    AND request_type IN ('prayer', 'enquiry')
    AND status = 'new'
  );

DROP POLICY IF EXISTS "Admins can manage prayer request inbox" ON public.prayer_requests;
CREATE POLICY "Admins can manage prayer request inbox"
  ON public.prayer_requests
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Only admins can read prayer request inbox" ON public.prayer_requests;
CREATE POLICY "Only admins can read prayer request inbox"
  ON public.prayer_requests
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Only admins can update prayer request inbox" ON public.prayer_requests;
CREATE POLICY "Only admins can update prayer request inbox"
  ON public.prayer_requests
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Only admins can delete prayer request inbox" ON public.prayer_requests;
CREATE POLICY "Only admins can delete prayer request inbox"
  ON public.prayer_requests
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = (SELECT auth.uid())));
