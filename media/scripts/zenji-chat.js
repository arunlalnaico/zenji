/**
 * Zenjispace Chat Interface
 * Handles user chat interaction with Zenji AI assistant
 */

document.addEventListener('DOMContentLoaded', () => {
    // Chat UI elements
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChat');
    const chatMessages = document.getElementById('chatMessages');
    const typingIndicator = document.getElementById('typingIndicator');
    
    // Load previous chat history
    const state = loadState();
    if (state.chatHistory) {
        state.chatHistory.forEach(message => {
            addMessage(message.text, message.isUser);
        });
    }
    
    // Add message to chat
    function addMessage(message, isUser = false) {
        const messageEl = document.createElement('div');
        messageEl.className = isUser ? 'user-message' : 'ai-message';
        messageEl.innerHTML = `<p>${message}</p>`;
        chatMessages.appendChild(messageEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Save to chat history
        const chatHistory = state.chatHistory || [];
        chatHistory.push({ text: message, isUser, timestamp: new Date().toISOString() });
        
        // Keep chat history limited to last 50 messages
        if (chatHistory.length > 50) {
            chatHistory.shift();
        }
        
        updateState('chatHistory', chatHistory);
    }
    
    // Generate AI response based on user input
    function generateResponse(userMessage) {
        // Simple keyword-based responses
        // In a real implementation, this would call the OpenAI API or another AI service
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('overwhelmed') || lowerMessage.includes('stressed')) {
            return "It sounds like you're feeling overwhelmed. Consider taking a short break, even just 5 minutes of deep breathing can help reset your mind. Remember that progress is still progress, no matter how small.";
        } 
        else if (lowerMessage.includes('breathe') || lowerMessage.includes('breathing')) {
            return "Let's practice a simple breathing exercise: Breathe in for 4 seconds, hold for 2 seconds, then exhale for 6 seconds. Repeat this 5 times. Try it now with the breathing circle in the Focus Tools section.";
        } 
        else if (lowerMessage.includes('boost') || lowerMessage.includes('motivation')) {
            return "You've got this! Remember why you started this project. Each line of code you write is progress. Break your task into smaller steps and celebrate each win, no matter how small.";
        } 
        else if (lowerMessage.includes('tired') || lowerMessage.includes('fatigue')) {
            return "Coding fatigue is common, especially after long sessions. Try the Pomodoro technique: 25 minutes of focused work followed by a 5-minute break. Also, stepping away from your screen briefly can refresh your mind.";
        }
        else if (lowerMessage.includes('stuck') || lowerMessage.includes('problem')) {
            return "When you're stuck, try explaining the problem out loud or writing it down step by step. Often, the solution becomes clearer when you articulate the issue. You might also try taking a short walk to let your subconscious work on it.";
        }
        else if (lowerMessage.includes('thank')) {
            return "You're welcome! I'm here to help your coding journey be more mindful and productive. Is there anything else I can assist you with today?";
        }
        else {
            return "I'm here to support your mindful coding journey. You can ask me about breathing exercises, taking breaks, staying motivated, or just share how you're feeling. What's on your mind today?";
        }
    }
    
    // Send chat message
    function sendChat() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        addMessage(message, true);
        chatInput.value = '';
        
        // Show typing indicator
        typingIndicator.style.display = 'flex';
        
        // Simulate AI response after a short delay
        setTimeout(() => {
            typingIndicator.style.display = 'none';
            const response = generateResponse(message);
            addMessage(response);
        }, 1500);
    }
    
    // Send button click
    sendChatBtn.addEventListener('click', sendChat);
    
    // Enter key press
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            sendChat();
        }
    });
});
