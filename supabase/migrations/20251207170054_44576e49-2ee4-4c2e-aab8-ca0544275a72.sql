-- Add reloan tracking columns to loans table
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS is_reloan BOOLEAN DEFAULT false;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS previous_loan_id UUID REFERENCES public.loans(id);

-- Add reloan tracking columns to redemptions table
ALTER TABLE public.redemptions ADD COLUMN IF NOT EXISTS is_reloan_redemption BOOLEAN DEFAULT false;
ALTER TABLE public.redemptions ADD COLUMN IF NOT EXISTS new_loan_id UUID REFERENCES public.loans(id);

-- Add 'reloaned' to closure_type enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'reloaned' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'closure_type')) THEN
    ALTER TYPE closure_type ADD VALUE 'reloaned';
  END IF;
END $$;

-- Create index for reloan queries
CREATE INDEX IF NOT EXISTS idx_loans_previous_loan_id ON public.loans(previous_loan_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_new_loan_id ON public.redemptions(new_loan_id);