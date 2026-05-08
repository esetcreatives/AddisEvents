-- Add phone column to contact_submissions
ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS phone TEXT;
