-- Add logo_url column to print_settings table
ALTER TABLE print_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create print-assets storage bucket for logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('print-assets', 'print-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for print-assets bucket
CREATE POLICY "Print assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'print-assets');

CREATE POLICY "Authenticated users can upload print assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'print-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update print assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'print-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete print assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'print-assets' AND auth.role() = 'authenticated');