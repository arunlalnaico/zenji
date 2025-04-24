/**
 * Zenjispace Journal & Insights
 * Manages journal entries and provides insights on writing patterns
 */

document.addEventListener('DOMContentLoaded', () => {
    // Journal UI elements
    const journalEntry = document.getElementById('journalEntry');
    const saveJournalBtn = document.getElementById('saveJournal');
    const journalEntriesList = document.getElementById('journalEntriesList');
    
    // Daily prompts for journaling
    const journalPrompts = [
        "What went well in your coding today?",
        "What challenge did you overcome in your work?",
        "What are you grateful for in your coding journey?",
        "How did you practice mindfulness while coding today?",
        "What's one thing you learned today?",
        "What made you feel proud in your work today?",
        "What would make tomorrow's coding session better?",
        "Did you take enough breaks today? How did they help?",
        "What distracted you today and how might you avoid it tomorrow?",
        "What's your intention for your next coding session?"
    ];
    
    // Set a random prompt
    const promptElement = document.querySelector('.journal-prompt p');
    if (promptElement) {
        const randomPrompt = journalPrompts[Math.floor(Math.random() * journalPrompts.length)];
        promptElement.textContent = `Today's prompt: ${randomPrompt}`;
    }
    
    // Function to retrieve journal entries from storage
    function getJournalEntries() {
        const state = loadState();
        return state.journalEntries || [];
    }
    
    // Function to save a journal entry
    function saveJournalEntry(text) {
        const state = loadState();
        const entries = state.journalEntries || [];
        
        const newEntry = {
            id: Date.now(),
            text: text,
            date: new Date().toISOString()
        };
        
        entries.unshift(newEntry);
        updateState('journalEntries', entries);
        
        renderJournalEntries();
        generateInsights();
    }
    
    // Function to render journal entries
    function renderJournalEntries() {
        const entries = getJournalEntries();
        journalEntriesList.innerHTML = '';
        
        if (entries.length === 0) {
            journalEntriesList.innerHTML = '<p>No entries yet. Start journaling today!</p>';
            return;
        }
        
        entries.forEach(entry => {
            const date = new Date(entry.date);
            const formattedDate = `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            
            const entryElement = document.createElement('div');
            entryElement.className = 'journal-entry';
            entryElement.innerHTML = `
                <div class="entry-date">${formattedDate}</div>
                <div class="entry-text">${entry.text}</div>
            `;
            
            journalEntriesList.appendChild(entryElement);
        });
    }
    
    // Generate insights from journal entries
    function generateInsights() {
        const entries = getJournalEntries();
        const insightsTab = document.getElementById('insights-content-tab');
        
        if (!insightsTab || entries.length < 3) {
            return;
        }
        
        // Simple insights for now - in a real app, this could use AI or more sophisticated analysis
        const weeklyEntryCount = entries.filter(entry => {
            const entryDate = new Date(entry.date);
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return entryDate >= oneWeekAgo;
        }).length;
        
        const totalWordCount = entries.reduce((total, entry) => {
            return total + entry.text.split(/\s+/).length;
        }, 0);
        
        const averageWordsPerEntry = Math.round(totalWordCount / entries.length);
        
        insightsTab.innerHTML = `
            <h3>Your Journal Insights</h3>
            <div class="insights-container">
                <div class="insight-card">
                    <div class="insight-value">${entries.length}</div>
                    <div class="insight-label">Total Entries</div>
                </div>
                <div class="insight-card">
                    <div class="insight-value">${weeklyEntryCount}</div>
                    <div class="insight-label">Entries This Week</div>
                </div>
                <div class="insight-card">
                    <div class="insight-value">${averageWordsPerEntry}</div>
                    <div class="insight-label">Avg Words Per Entry</div>
                </div>
            </div>
            <div class="insight-reflection">
                <h4>Reflection</h4>
                <p>Regular journaling helps improve mindfulness and coding clarity. 
                   Keep writing to track your progress and emotional well-being.</p>
            </div>
        `;
    }
    
    // Save journal entry
    saveJournalBtn.addEventListener('click', () => {
        const text = journalEntry.value.trim();
        if (!text) return;
        
        saveJournalEntry(text);
        journalEntry.value = '';
        
        showNotification('Journal entry saved!');
    });
    
    // Initialize journal entries and insights
    renderJournalEntries();
    generateInsights();
});
