-- Drop any existing policies with these names (from previous partial migrations)
DROP POLICY IF EXISTS "Users can upload customer documents in their client" ON storage.objects;
DROP POLICY IF EXISTS "Users can view customer documents in their client" ON storage.objects;
DROP POLICY IF EXISTS "Users can update customer documents in their client" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete customer documents in their client" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload loan documents in their client" ON storage.objects;
DROP POLICY IF EXISTS "Users can view loan documents in their client" ON storage.objects;
DROP POLICY IF EXISTS "Users can update loan documents in their client" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete loan documents in their client" ON storage.objects;

-- Create new secure policies for customer-documents bucket
-- Policy: Users can only upload to their own client folder
CREATE POLICY "Users can upload customer documents in their client"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'customer-documents' AND
  (storage.foldername(name))[1] = public.get_user_client_id(auth.uid())::text
);

-- Policy: Users can only view files from their own client folder
CREATE POLICY "Users can view customer documents in their client"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'customer-documents' AND
  (storage.foldername(name))[1] = public.get_user_client_id(auth.uid())::text
);

-- Policy: Users can only update files in their own client folder
CREATE POLICY "Users can update customer documents in their client"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'customer-documents' AND
  (storage.foldername(name))[1] = public.get_user_client_id(auth.uid())::text
)
WITH CHECK (
  bucket_id = 'customer-documents' AND
  (storage.foldername(name))[1] = public.get_user_client_id(auth.uid())::text
);

-- Policy: Users can only delete files in their own client folder
CREATE POLICY "Users can delete customer documents in their client"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'customer-documents' AND
  (storage.foldername(name))[1] = public.get_user_client_id(auth.uid())::text
);

-- Create new secure policies for loan-documents bucket
-- Policy: Users can only upload to their own client folder
CREATE POLICY "Users can upload loan documents in their client"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'loan-documents' AND
  (storage.foldername(name))[1] = public.get_user_client_id(auth.uid())::text
);

-- Policy: Users can only view files from their own client folder
CREATE POLICY "Users can view loan documents in their client"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'loan-documents' AND
  (storage.foldername(name))[1] = public.get_user_client_id(auth.uid())::text
);

-- Policy: Users can only update files in their own client folder
CREATE POLICY "Users can update loan documents in their client"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'loan-documents' AND
  (storage.foldername(name))[1] = public.get_user_client_id(auth.uid())::text
)
WITH CHECK (
  bucket_id = 'loan-documents' AND
  (storage.foldername(name))[1] = public.get_user_client_id(auth.uid())::text
);

-- Policy: Users can only delete files in their own client folder
CREATE POLICY "Users can delete loan documents in their client"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'loan-documents' AND
  (storage.foldername(name))[1] = public.get_user_client_id(auth.uid())::text
);