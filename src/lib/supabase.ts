import { createClient } from '@supabase/supabase-js'

//const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
//const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

//if (!supabaseUrl || !supabaseAnonKey) {
  // throw new Error('Missing Supabase environment variables')
//}

export const supabase = createClient('https://qzmnzqnvexeactohsdxr.supabase.co', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bW56cW52ZXhlYWN0b2hzZHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk5MzQ5MDMsImV4cCI6MjA0NTUxMDkwM30.xy-541UaF8wKUSwFr4AUVBUqwAULllYIKS6-H1Vmz4A")