
-- Public read + authenticated write for forum-uploads bucket
CREATE POLICY "Public can view forum uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'forum-uploads');

CREATE POLICY "Authenticated can upload forum uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'forum-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own forum uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'forum-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
