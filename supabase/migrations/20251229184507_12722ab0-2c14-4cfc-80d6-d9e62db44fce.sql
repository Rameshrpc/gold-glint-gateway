-- Drop the existing restrictive check constraint
ALTER TABLE public.print_content_blocks 
DROP CONSTRAINT IF EXISTS print_content_blocks_block_type_check;

-- Add updated check constraint with Bill of Sale block types
ALTER TABLE public.print_content_blocks 
ADD CONSTRAINT print_content_blocks_block_type_check 
CHECK (block_type IN (
  -- Existing block types
  'gold_declaration',
  'terms_header',
  'acknowledgment',
  'warning',
  'signature_labels',
  -- Bill of Sale block types
  'bill_of_sale_title',
  'bill_of_sale_legal_ref',
  'bill_of_sale_seller_title',
  'bill_of_sale_buyer_title',
  'bill_of_sale_goods_title',
  'bill_of_sale_goods_intro',
  'bill_of_sale_consideration_title',
  'bill_of_sale_consideration_intro',
  'bill_of_sale_spot_price_label',
  'bill_of_sale_repurchase_title',
  'bill_of_sale_repurchase_intro',
  'bill_of_sale_expiry_note',
  'bill_of_sale_declarations_title',
  'bill_of_sale_declaration',
  'bill_of_sale_signature_seller',
  'bill_of_sale_signature_seller_note',
  'bill_of_sale_signature_buyer',
  'bill_of_sale_signature_buyer_note',
  'bill_of_sale_strike_period_header',
  'bill_of_sale_strike_price_header',
  'bill_of_sale_strike_status_header',
  'bill_of_sale_strike_period'
));