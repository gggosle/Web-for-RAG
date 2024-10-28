const messageInput = document.getElementById("message-input");
const chatMessages = document.getElementById("chat-messages");
const sendButton = document.getElementById("send-button");
const stopButton = document.getElementById("stop-button");
const chatItems = document.getElementById("chat-items");
const newChatButton = document.getElementById("new-chat-button");

let isGenerating = false;
let chatCounter = 1;
let activeChatId = "chat-1";  // Default chat when the page loads

const chats = {
    "chat-1": chatMessages.innerHTML  // Initial chat content
};

// Function to add messages
function addMessage(text, sender) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", `${sender}-message`);
    messageElement.textContent = "";
    chatMessages.appendChild(messageElement);

    if (sender === "bot") {
    isGenerating = true;
    let charIndex = 0;
    const intervalId = setInterval(() => {
        if (charIndex < text.length && isGenerating) {
        messageElement.textContent += text[charIndex];
        charIndex++;
        } else {
        clearInterval(intervalId);
        isGenerating = false;
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 50);
    } else {
    messageElement.textContent = text;
    chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Save chat state
function saveChatState() {
    if (activeChatId) {
    chats[activeChatId] = chatMessages.innerHTML;
    }
}

// Load chat state
function loadChatState(chatId) {
    chatMessages.innerHTML = chats[chatId] || "";
}

// Create a new chat
newChatButton.addEventListener("click", () => {
    chatCounter++;
    const chatId = `chat-${chatCounter}`;

    // Save current chat state
    saveChatState();

    // Create new chat item and append at the bottom
    const chatItem = document.createElement("div");
    chatItem.classList.add("chat-item");
    chatItem.textContent = `Chat ${chatCounter}`;
    chatItem.dataset.chatId = chatId;
    chatItems.appendChild(chatItem);

    // Switch to new chat
    activeChatId = chatId;
    chatMessages.innerHTML = "";
    chats[chatId] = "";

    chatItem.addEventListener("click", () => {
    saveChatState();
    activeChatId = chatId;
    loadChatState(chatId);
    });
});


sendButton.addEventListener("click", () => {
    const userMessage = messageInput.value.trim();
    if (userMessage) {
        addMessage(userMessage, "user"); 
        messageInput.value = "";

        fetch('/api/chat_response/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),  
            },
            body: JSON.stringify({ message: userMessage })  
        })
        .then(response => response.json())
        .then(data => {
            if (data.response.content) {
                let formattedMessage = data.response.content;
                // let sources = data.response.sources
                // formattedMessage += " Sources: " + sources.join(', ');
                addMessage(formattedMessage, "bot");  
            }
            else {
                addMessage(data.response, "bot")
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
});

// Function to get CSRF token (if using CSRF protection)
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Check if this cookie string begins with the name we want
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


// Stop bot from generating text
stopButton.addEventListener("click", () => {
    isGenerating = false;
});

// Send message on Enter key press
messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendButton.click();
});

// Initialize first chat item for default chat
const initialChatItem = document.createElement("div");
initialChatItem.classList.add("chat-item");
initialChatItem.textContent = "Chat 1";
initialChatItem.dataset.chatId = "chat-1";
chatItems.appendChild(initialChatItem);

initialChatItem.addEventListener("click", () => {
    saveChatState();
    activeChatId = "chat-1";
    loadChatState("chat-1");
});
