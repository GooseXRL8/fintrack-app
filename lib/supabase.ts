import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  full_name: string
  email: string
  salary: number
  extra_income: number
}

export type Transaction = {
  id: string
  user_id: string
  category_id: string | null
  title: string
  amount: number
  type: 'income' | 'expense'
  date: string
  notes?: string
  created_at: string
  categories?: { name: string; emoji: string; color: string }
}

export type Category = {
  id: string
  name: string
  emoji: string
  color: string
  budget_limit: number
  is_default: boolean
}

export type SavingsGoal = {
  id: string
  name: string
  emoji: string
  target_amount: number
  current_amount: number
  deadline?: string
}
