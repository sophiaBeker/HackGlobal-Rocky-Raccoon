// Public browser configuration for Safety Quest.
// Keep private API keys (especially OPENAI_API_KEY) in the server-side .env file.
window.SAFETY_QUEST_CONFIG = {
  supabaseUrl: "https://SAFETY-QUEST.supabase.co",
  supabaseAnonKey: "SAFETY_QUEST_SUPABASE_ANON_KEY",
  aiEnabled: true,
  chatEndpoint: "/api/chat"
};
