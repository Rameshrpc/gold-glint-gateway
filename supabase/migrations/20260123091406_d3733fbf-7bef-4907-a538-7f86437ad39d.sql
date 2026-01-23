-- Add item_count and remarks columns to gold_items table
ALTER TABLE gold_items 
ADD COLUMN item_count INTEGER NOT NULL DEFAULT 1,
ADD COLUMN remarks TEXT DEFAULT NULL;