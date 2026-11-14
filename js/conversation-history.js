/**
 * Safety Quest - Conversation History
 *
 * Saves and retrieves Rocky's conversations
 * for authenticated users.
 */

let activeConversationId = null;
let conversationGeneration = 0;

// Creates a new conversation for the signed-in user.
async function createConversation(title = "New Conversation") {
    if (!user || !supabaseClient) {
        console.warn("Sign in to save conversations.");
        return null;
    }

    const { data, error } = await supabaseClient
        .from("conversations")
        .insert({
            user_id: user.id,
            title: title
        })
        .select("id")
        .single();

    if (error) {
        console.error("Could not create conversation:", error);
        return null;
    }

    activeConversationId = data.id;
    return data.id;
}

/**
 * Saves a message to the active conversation
 *
 * role: "user" or "assistant"
 * content: message text
 */

async function saveConversationMessage(role, content) {
    if (!user || !supabaseClient) {
        return false;
    }

    if (!["user", "assistant"].includes(role)) {
        console.error("Invalid message role.");
        return false;
    }

    if (
        typeof content !== "string" ||
        !content.trim() ||
        content.length > 4000
    ) {
        console.error("Invalid message content.");
        return false;
    }

    // Creates a conversation if one does not exist.
    if (!activeConversationId) {
        const conversationId = await createConversation();

        if (!conversationId) {
            return false;
        }
    }

    const { error } = await supabaseClient
        .from("conversation_messages")
        .insert({
             conversation_id: activeConversationId,
             role: role,
             content: content
        });


    if (error) {
        console.error("Could not save message:", error);
        return false;
    }

    return true;
}

/**
 * Loads all the conversations belonging to
 *  the currently signed-in user.
 */

async function loadConversations() {
    if (!user || !supabaseClient) {
        return [];
    }

    const { data, error } = await supabaseClient
        .from("conversations")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Could not load conversations:", error);
        return [];
    }

    return data || [];

}

/**
 * Loads all messages from a selected conversation.
 *
 * conversationId: ID of the one conversation to load.
 */

async function loadConversationMessages(conversationId) {
    if (!user || !supabaseClient || !conversationId) {
        return [];
    }

    const { data, error } = await supabaseClient
        .from("conversation_messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Could not load messages:", error);
        return [];
    }
             
    return data || [];
     
}       


/**
 * Starts a new conversation with Rocky.
 * The conversation is created in Supabase
 * when the first message is saved.
 */

function startNewConversation() {
    conversationGeneration++;

    activeConversationId = null;
    chatHistory = [];

    const thread = document.getElementById("chatThread");

    if (thread) {
        thread.innerHTML = "";
    }
}


/**          
 * Resets conversation history when the
 * signed-in account changes.
 */ 

function resetConversationHistory() {
    conversationGeneration++;

    activeConversationId = null;
    chatHistory = [];

    const thread = document.getElementById("chatThread");

    if (thread) {
        thread.innerHTML = "";
    }
}  
  
