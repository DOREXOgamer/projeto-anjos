import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://izkkgarmlvgregktdids.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_fG_E34djPcx2VZHT7YvNDw_6EOmHQCo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
