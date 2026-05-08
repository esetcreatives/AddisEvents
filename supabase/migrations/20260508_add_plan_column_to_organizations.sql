-- Add missing 'plan' column to organizations table
-- This column was defined in the schema but not applied to the live database

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'professional',
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Optionally add a CHECK constraint (safe to do after column exists)
-- Using DO block to avoid error if constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organizations_plan_check'
  ) THEN
    ALTER TABLE public.organizations
      ADD CONSTRAINT organizations_plan_check
      CHECK (plan IN ('starter', 'professional', 'enterprise'));
  END IF;
END $$;
