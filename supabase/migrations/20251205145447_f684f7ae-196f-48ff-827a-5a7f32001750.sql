-- Add 18KT rate to schemes table
ALTER TABLE schemes ADD COLUMN rate_18kt DECIMAL DEFAULT NULL;

-- Add image fields to loans table for jewel photo and appraiser sheet
ALTER TABLE loans ADD COLUMN jewel_photo_url TEXT DEFAULT NULL;
ALTER TABLE loans ADD COLUMN appraiser_sheet_url TEXT DEFAULT NULL;

-- Create storage bucket for loan documents if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('loan-documents', 'loan-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for loan documents
CREATE POLICY "Users can upload loan documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'loan-documents' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view loan documents in their client"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'loan-documents'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update loan documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'loan-documents'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete loan documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'loan-documents'
  AND auth.uid() IS NOT NULL
);