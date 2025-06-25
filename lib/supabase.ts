// Simple re-export to avoid build errors
// This file exists to handle legacy imports that might reference lib/supabase
export { createClient } from './supabase-client'
export { createServerComponentClient, createMiddlewareClient } from './supabase-server'