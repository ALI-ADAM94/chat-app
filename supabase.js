import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jznvulgfyacrqgyzbjrx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bnZ1bGdmeWFjcnFneXpianJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMDMyOTIsImV4cCI6MjA2MDU3OTI5Mn0.mF5_9mPsECpaGckzCSTOo6y2DEV7WobB_wCj4dgUL-A'

export const supabase = createClient(supabaseUrl, supabaseKey)
