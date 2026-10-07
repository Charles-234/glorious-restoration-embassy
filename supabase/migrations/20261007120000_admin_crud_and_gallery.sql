/*
  Glorious Restoration Embassy admin CRUD and gallery

  Adds (when missing):
    - sermons.audio_url, sermons.sort_order, sermons.scripture_refs (as text[]),
      sermons.published
    - events.is_announcement, events.image_url, events.published
    - public.gallery_items and its sort-order index
  Verifies, without re-adding:
    - posts.title, slug, content, excerpt, cover_image_url, published
    - prayer_requests.name, email, request, is_private, created_at
  Creates:
    - Public-read and admin-write RLS policies for gallery_items
    - Public-read and admin-write policies for the media Storage bucket
    - The public media bucket and gallery_items.updated_at trigger
  Safe for a live database: yes. Operations are additive, preserve existing
  rows, and conditionally skip columns, tables, policies, and bucket creation
  that already exist. If the verified posts/prayer_requests columns are absent,
  the verification blocks stop the migration instead of changing those tables.
*/

DO $$
BEGIN
  ALTER TABLE public.sermons ADD COLUMN audio_url text;
EXCEPTION WHEN duplicate_column THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE public.sermons ADD COLUMN sort_order integer DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE public.sermons ADD COLUMN scripture_refs text[];
EXCEPTION WHEN duplicate_column THEN NULL;
END;
$$;

DO $$
DECLARE
  refs_type text;
BEGIN
  SELECT data_type
    INTO refs_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sermons'
      AND column_name = 'scripture_refs';

  IF refs_type = 'text' THEN
    ALTER TABLE public.sermons
      ALTER COLUMN scripture_refs TYPE text[]
      USING CASE
        WHEN scripture_refs IS NULL OR btrim(scripture_refs) = '' THEN ARRAY[]::text[]
        ELSE ARRAY[scripture_refs]
      END;
  END IF;
END;
$$;

DO $$
BEGIN
  ALTER TABLE public.sermons ADD COLUMN published boolean DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE public.events ADD COLUMN is_announcement boolean DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE public.events ADD COLUMN image_url text;
EXCEPTION WHEN duplicate_column THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER TABLE public.events ADD COLUMN published boolean DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END;
$$;

COMMENT ON COLUMN public.sermons.audio_url IS
  'Optional audio-only recording URL for a sermon.';
COMMENT ON COLUMN public.sermons.sort_order IS
  'Optional ordering value for displaying sermons.';
COMMENT ON COLUMN public.sermons.scripture_refs IS
  'Scripture references associated with the sermon, stored as text array values.';
COMMENT ON COLUMN public.sermons.published IS
  'Whether the sermon is approved for public display.';
COMMENT ON COLUMN public.events.is_announcement IS
  'Whether the event should also be presented as an announcement.';
COMMENT ON COLUMN public.events.image_url IS
  'Optional image URL associated with the event.';
COMMENT ON COLUMN public.events.published IS
  'Whether the event is approved for public display.';

DO $$
DECLARE
  missing_columns text;
BEGIN
  SELECT string_agg(required.column_name, ', ' ORDER BY required.column_name)
    INTO missing_columns
    FROM (VALUES
      ('title'),
      ('slug'),
      ('content'),
      ('excerpt'),
      ('cover_image_url'),
      ('published')
    ) AS required(column_name)
    WHERE NOT EXISTS (
      SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'posts'
          AND column_name = required.column_name
    );

  IF missing_columns IS NOT NULL THEN
    RAISE EXCEPTION 'Expected public.posts columns are missing: %', missing_columns;
  END IF;
END;
$$;

DO $$
DECLARE
  missing_columns text;
BEGIN
  SELECT string_agg(required.column_name, ', ' ORDER BY required.column_name)
    INTO missing_columns
    FROM (VALUES
      ('name'),
      ('email'),
      ('request'),
      ('is_private'),
      ('created_at')
    ) AS required(column_name)
    WHERE NOT EXISTS (
      SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'prayer_requests'
          AND column_name = required.column_name
    );

  IF missing_columns IS NOT NULL THEN
    RAISE EXCEPTION 'Expected public.prayer_requests columns are missing: %', missing_columns;
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video', 'youtube', 'vimeo', 'facebook')),
  title text,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gallery_items_sort_idx
  ON public.gallery_items (sort_order);

COMMENT ON TABLE public.gallery_items IS
  'Media entries displayed and ordered in the public gallery.';
COMMENT ON COLUMN public.gallery_items.id IS
  'Unique identifier for the gallery media entry.';
COMMENT ON COLUMN public.gallery_items.media_url IS
  'Public media URL or supported video embed URL.';
COMMENT ON COLUMN public.gallery_items.media_type IS
  'Media provider/type: image, video, YouTube, Vimeo, or Facebook.';
COMMENT ON COLUMN public.gallery_items.title IS
  'Optional title shown with the gallery media.';
COMMENT ON COLUMN public.gallery_items.caption IS
  'Optional descriptive caption shown with the gallery media.';
COMMENT ON COLUMN public.gallery_items.sort_order IS
  'Ordering position used to arrange gallery media.';
COMMENT ON COLUMN public.gallery_items.created_by IS
  'Auth user who created the gallery entry, when known.';
COMMENT ON COLUMN public.gallery_items.created_at IS
  'Timestamp when the gallery entry was created.';
COMMENT ON COLUMN public.gallery_items.updated_at IS
  'Timestamp when the gallery entry was last updated.';

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gallery_items'
      AND policyname = 'Public can read gallery items'
  ) THEN
    CREATE POLICY "Public can read gallery items"
      ON public.gallery_items FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END;
$$;
COMMENT ON POLICY "Public can read gallery items" ON public.gallery_items IS
  'Allows visitors to read gallery entries.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gallery_items'
      AND policyname = 'Admins can insert gallery items'
  ) THEN
    CREATE POLICY "Admins can insert gallery items"
      ON public.gallery_items FOR INSERT
      TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
  END IF;
END;
$$;
COMMENT ON POLICY "Admins can insert gallery items" ON public.gallery_items IS
  'Allows authenticated administrators to add gallery entries.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gallery_items'
      AND policyname = 'Admins can update gallery items'
  ) THEN
    CREATE POLICY "Admins can update gallery items"
      ON public.gallery_items FOR UPDATE
      TO authenticated
      USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
  END IF;
END;
$$;
COMMENT ON POLICY "Admins can update gallery items" ON public.gallery_items IS
  'Allows authenticated administrators to update gallery entries.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'gallery_items'
      AND policyname = 'Admins can delete gallery items'
  ) THEN
    CREATE POLICY "Admins can delete gallery items"
      ON public.gallery_items FOR DELETE
      TO authenticated
      USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
  END IF;
END;
$$;
COMMENT ON POLICY "Admins can delete gallery items" ON public.gallery_items IS
  'Allows authenticated administrators to delete gallery entries.';

GRANT SELECT ON public.gallery_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public can read media'
  ) THEN
    CREATE POLICY "Public can read media"
      ON storage.objects FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'media');
  END IF;
END;
$$;
COMMENT ON POLICY "Public can read media" ON storage.objects IS
  'Allows public reads from the media Storage bucket.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can upload media'
  ) THEN
    CREATE POLICY "Admins can upload media"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'media'
        AND EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
      );
  END IF;
END;
$$;
COMMENT ON POLICY "Admins can upload media" ON storage.objects IS
  'Allows authenticated administrators to upload media objects.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can update media'
  ) THEN
    CREATE POLICY "Admins can update media"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'media'
        AND EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
      );
  END IF;
END;
$$;
COMMENT ON POLICY "Admins can update media" ON storage.objects IS
  'Allows authenticated administrators to update media objects.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can delete media'
  ) THEN
    CREATE POLICY "Admins can delete media"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'media'
        AND EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid())
      );
  END IF;
END;
$$;
COMMENT ON POLICY "Admins can delete media" ON storage.objects IS
  'Allows authenticated administrators to delete media objects.';

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gallery_items_set_updated_at ON public.gallery_items;
CREATE TRIGGER gallery_items_set_updated_at
  BEFORE UPDATE ON public.gallery_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMENT ON FUNCTION public.set_updated_at() IS
  'Sets updated_at to the current timestamp before a row update.';
