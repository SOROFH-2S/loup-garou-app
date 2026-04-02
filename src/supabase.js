import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gxccnbwxotcywftwoenr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4Y2NuYnd4b3RjeXdmdHdvZW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NzM3NDMsImV4cCI6MjA4OTE0OTc0M30.PJf0YM32dzpUEmID8_vVajoR5cAnnHow9f6BbQTS-Lo'

export const supabase = createClient(supabaseUrl, supabaseKey)