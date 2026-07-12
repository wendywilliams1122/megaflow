
DROP POLICY IF EXISTS "Public can view forum uploads" ON storage.objects;

CREATE POLICY "Owner or staff can view forum uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'forum-uploads'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
  )
);
