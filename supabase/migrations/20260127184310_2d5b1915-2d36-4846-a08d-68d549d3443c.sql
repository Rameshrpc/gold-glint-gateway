-- Add feature flags to hide Reloan module and Differential Interest details
ALTER TABLE clients 
ADD COLUMN show_reloan_module boolean NOT NULL DEFAULT false,
ADD COLUMN show_differential_details boolean NOT NULL DEFAULT false;