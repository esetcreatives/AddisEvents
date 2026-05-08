-- Platform settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial settings
INSERT INTO platform_settings (key, value) VALUES
('signup_enabled', 'true'::jsonb),
('client_portal_enabled', 'true'::jsonb),
('staff_pins_required', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;
