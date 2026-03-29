-- Add NON-DESTRUCTIVE fields for blockchain anchoring
ALTER TABLE public.cases
ADD COLUMN IF NOT EXISTS case_hash text,
ADD COLUMN IF NOT EXISTS blockchain_tx_hash text,
ADD COLUMN IF NOT EXISTS blockchain_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS integrity_status text DEFAULT 'valid';
