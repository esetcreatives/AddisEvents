import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    // During build or if env vars are missing, we return a mock or a client that will fail gracefully
    // when called, rather than crashing the build.
    // However, @supabase/ssr requires these. So we return a proxy or just empty strings 
    // but the library itself throws. 
    // Best is to provide placeholders if we are in build mode.
    return createBrowserClient(
      url || 'https://placeholder.supabase.co',
      key || 'placeholder'
    )
  }

  return createBrowserClient(url, key)
}
