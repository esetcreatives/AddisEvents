-- Contact form submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  event_type TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Allow the service role to manage all rows (no RLS needed since only admin API uses this)
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Super admins can read all submissions (via service role key, RLS is bypassed)
-- Public inserts are handled via the API route which uses the service role key
-- No public-facing RLS policies needed since all access goes through server API routes
