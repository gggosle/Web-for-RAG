const messageInput = document.getElementById("message-input");
const chatMessages = document.getElementById("chat-messages");
const sendButton = document.getElementById("send-button");
const stopButton = document.getElementById("stop-button");
const chatItems = document.getElementById("chat-items");
const newChatButton = document.getElementById("new-chat-button");

let isGenerating = false;
let chatCounter = 0;
let activeChatId = "chat-1"; 

const chats = {
    "chat-1": { user: [], bot: [] }  
};

function addMessage(text, sender) {
    const messageElement = createMessageElement(sender)

    if (sender === "bot") {
        chats[activeChatId].bot.push(text);
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
        }, 50);
    } else {
        messageElement.textContent = text;
        chats[activeChatId].user.push(text);
    }

    scrollContainerToBottom();
}

function addStaticMessage(text, sender) {
    const messageElement = createMessageElement(sender);

    messageElement.textContent = text;
    scrollContainerToBottom();
}

function createMessageElement(sender) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", `${sender}-message`);
    messageElement.textContent = "";
    chatMessages.appendChild(messageElement);

    return messageElement;
}

function scrollContainerToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function saveChatState() {
    if (activeChatId) {
        localStorage.setItem(activeChatId, JSON.stringify(chats[activeChatId]));
    }
}

function loadChatState(chatId) {
    const chatData = JSON.parse(localStorage.getItem(chatId)) || { user: [], bot: [] };
    if (!chatData || typeof chatData !== 'object') {
        chatData = { user: [], bot: [] };
    }
    chatMessages.innerHTML = ""; 

    const maxLength = Math.max(chatData.user.length, chatData.bot.length);
    for (let i = 0; i < maxLength; i++) {
        if (i < chatData.user.length) {
            const text = chatData.user[i];
            addStaticMessage(text, "user");
            chats[activeChatId].user.push(text);
        }
        if (i < chatData.bot.length) {
            const text = chatData.bot[i];
            chats[activeChatId].bot.push(text);
            addStaticMessage(text, "bot");
        }
    }
}

newChatButton.addEventListener("click", () => {
    addNewChat();
});

function addNewChat() {
    chatCounter++;
    const chatId = `chat-${chatCounter}`;
    
    const chatItem = document.createElement("div");
    chatItem.classList.add("chat-item");
    chatItem.textContent = `Chat ${chatCounter}`;
    chatItem.dataset.chatId = chatId;
    chatItems.appendChild(chatItem);

    chats[chatId] = { user: [], bot: [] };  
    chatItem.addEventListener("click", () => {
        activeChatId = chatId;
        loadChatState(chatId);
    });
}


sendButton.addEventListener("click", () => {
    const userMessage = messageInput.value.trim();
    if (userMessage) {
        addMessage(userMessage, "user"); 
        saveChatState();
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
            let botResponse = data.response.content || data.response;
            addMessage(botResponse, "bot");  
            saveChatState();
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
});

window.onload = function() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith("chat-")) {
            addNewChat();
            loadChatState(key);
        }
    });
    activeChatId = "chat-1";
};

// Function to get CSRF token (if using CSRF protection)
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


stopButton.addEventListener("click", () => {
    isGenerating = false;
});

messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendButton.click();
});

initialChatItem.addEventListener("click", () => {
    activeChatId = "chat-1";
    loadChatState("chat-1");
});
