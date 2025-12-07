-- Change gold_items.item_type from enum to varchar to allow custom item names from Items master
ALTER TABLE gold_items 
  ALTER COLUMN item_type TYPE VARCHAR(100) USING item_type::text;