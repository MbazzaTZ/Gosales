const SUPABASE_URL = 'https://yvxlcjuklurwvxhareyn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2eGxjanVrbHVyd3Z4aGFyZXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjA3MTQsImV4cCI6MjA3NDk5NjcxNH0.xoUzkcLWs-OmZOZpk7UDlNSNSG9NJIMzeqr7Rk4xD_w';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.supabaseClient = supabaseClient;
