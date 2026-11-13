// Copy to config.js for local development.
// These are public browser settings; never put a Supabase service-role key or OpenAI key here.
window.SAFETY_QUEST_CONFIG = {
  supabaseUrl: "https://SAFETY-QUEST.supabase.co",
  supabaseAnonKey: "SAFETY_QUEST_SUPABASE_ANON_KEY",
  aiEnabled: true,
  chatEndpoint: "/api/chat"
};
