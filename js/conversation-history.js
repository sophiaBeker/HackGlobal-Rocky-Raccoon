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

    const requestUserId = user.id;
    const generation = conversationGeneration;

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

    if (
        generation !== conversationGeneration ||
        user?.id !== requestUserId
    ) {
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

    const input = document.getElementById("chatInput");
    const send = document.getElementById("chatSubmit");

    if (input) input.disabled = false;
    if (send) send.disabled = false;
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

    const input = document.getElementById("chatInput");
    const send = document.getElementById("chatSubmit");
   
    if (input) input.disabled = false;
    if (send) send.disabled = false;
}  
  

async function renderConversationHistory() {
    const container = document.getElementById("conversationHistory");
    if (!container) return;

    container.replaceChildren();

    if (!user) {
        container.textContent = "Sign in to view your previous conversations.";
        return;
    }

    const requestUserId = user.id;
    const generation = conversationGeneration;
    const conversations = await loadConversations();


    // Rename older conversations using their first question.
    for (const conversation of conversations) {
        if (conversation.title !== "New Conversation") continue;

        const { data: messages, error: messageError } = await supabaseClient
            .from("conversation_messages")
            .select("content")
            .eq("conversation_id", conversation.id)
            .eq("role", "user")
            .order("created_at", { ascending: true })
            .limit(1);

        if (messageError || !messages?.length) continue;

        const newTitle = messages[0].content.trim().slice(0, 60);
        if (!newTitle) continue;

        // Don't update if the user or active chat changed.
        if (
            requestUserId !== user?.id ||
            generation !== conversationGeneration
        ) {
            return;
        }

        const { error: updateError } = await supabaseClient
            .from("conversations")
            .update({ title: newTitle })
            .eq("id", conversation.id)
            .eq("user_id", requestUserId);

        if (updateError) {
            console.error("Could not rename conversation:", updateError);
        } else {
            conversation.title = newTitle;
        }
    }

    // Ignore results if the account or chat changed.
    if (
        requestUserId !== user?.id ||
        generation !== conversationGeneration
    ) {
        return;
    }

    if (conversations.length === 0) {
        container.textContent = "No previous conversations yet.";
        return;
    }

    const heading = document.createElement("h3");
    heading.textContent = "Previous Conversations";
    container.appendChild(heading);

    conversations.forEach(conversation => {
        // A row to hold the conversation and its delete button.
        const row = document.createElement("div");
        row.className = "conversation-history-row";

        // Button to reopen the saved conversation.
        const button = document.createElement("button");
        button.type = "button";
        button.className = "conversation-history-item";
        button.textContent = conversation.title;
        button.dataset.conversationId = conversation.id;

        button.addEventListener("click", () => {
            openConversation(conversation.id);
        });

        // Button to delete the saved conversation.
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "conversation-delete-btn";
        deleteButton.textContent = "🗑️";
        deleteButton.setAttribute(
            "aria-label",
            `Delete conversation: ${conversation.title}`
        );
        deleteButton.title = "Delete conversation";

        deleteButton.addEventListener("click", () => {
            deleteConversation(conversation.id);
        });

        row.appendChild(button);
        row.appendChild(deleteButton);
        container.appendChild(row);
    });


}


async function openConversation(conversationId) {
    if (!user || !supabaseClient || !conversationId) return;

    // Cancel any pending response from the previous chat.
    conversationGeneration++;

    const generation = conversationGeneration;
    const requestUserId = user.id;

    const thread = document.getElementById("chatThread");
    const input = document.getElementById("chatInput");
    const send = document.getElementById("chatSubmit");

    if (thread) thread.textContent = "Loading conversation...";
    if (input) input.disabled = true;
    if (send) send.disabled = true;

    try {
        const messages = await loadConversationMessages(conversationId);

        // Ignore results if the account or conversation changed.
        if (
            generation !== conversationGeneration ||
            requestUserId !== user?.id
        ) {
            return;
        }

        activeConversationId = conversationId;
        chatHistory = [];

        if (thread) {
            thread.replaceChildren();

            messages.forEach(message => {
                const element = document.createElement("div");
                element.className = message.role === "user"
                    ? "chat-msg user"
                    : "chat-msg";

                if (message.role === "assistant") {
                    renderRockyMessage(element, message.content);
                } else {
                    element.textContent = message.content;
                }

                thread.appendChild(element);
                chatHistory.push({
                    role: message.role,
                    content: message.content
                });
            });

            thread.scrollTop = thread.scrollHeight;
        }

        // Keep only the latest messages for Rocky's context.
        chatHistory = chatHistory.slice(-12);

    } finally {
        if (
            generation === conversationGeneration &&
            requestUserId === user?.id
        ) {
            if (input) input.disabled = false;
            if (send) send.disabled = false;
        }
    }
}


async function deleteConversation(conversationId) {
    if (!user || !supabaseClient || !conversationId) return;

    const confirmed = window.confirm(
        "Are you sure you want to delete this conversation? This cannot be undone."
    );

    if (!confirmed) return;

    const requestUserId = user.id;

    const { error } = await supabaseClient
        .from("conversations")
        .delete()
        .eq("id", conversationId)
        .eq("user_id", requestUserId);

    if (error) {
        console.error("Could not delete conversation:", error);
        alert("Could not delete the conversation. Please try again.");
        return;
    }

    if (user?.id !== requestUserId) return;

    if (activeConversationId === conversationId) {
        startNewConversation();
    }

    await renderConversationHistory();
}

