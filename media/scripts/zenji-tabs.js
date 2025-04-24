/**
 * Zenjispace Tab Navigation
 * Handles switching between different tabs and content areas
 */

document.addEventListener('DOMContentLoaded', () => {
    // Main tab navigation
    const mainTabs = document.querySelectorAll('.main-tab');
    const tabContents = document.querySelectorAll('main > .tab-content');
    
    mainTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            mainTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding content
            const tabName = tab.getAttribute('data-main-tab');
            document.getElementById(tabName + '-tab').classList.add('active');
            
            // Save active tab to state
            updateState('activeTab', tabName);
        });
    });
    
    // Journal tabs
    const journalTabs = document.querySelectorAll('.tabs .tab');
    const journalContents = document.querySelectorAll('#journal-tab .tab-content');
    
    journalTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            journalTabs.forEach(t => t.classList.remove('active'));
            journalContents.forEach(t => t.classList.remove('active'));
            
            tab.classList.add('active');
            const tabName = tab.getAttribute('data-tab');
            document.getElementById(tabName + '-content-tab').classList.add('active');
            
            // Save active journal tab to state
            updateState('activeJournalTab', tabName);
        });
    });
    
    // Restore active tabs from state
    const state = loadState();
    if (state.activeTab) {
        mainTabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(t => t.classList.remove('active'));
        
        document.querySelector(`.main-tab[data-main-tab="${state.activeTab}"]`)?.classList.add('active');
        document.getElementById(state.activeTab + '-tab')?.classList.add('active');
    }
    
    if (state.activeJournalTab) {
        journalTabs.forEach(t => t.classList.remove('active'));
        journalContents.forEach(t => t.classList.remove('active'));
        
        document.querySelector(`.tab[data-tab="${state.activeJournalTab}"]`)?.classList.add('active');
        document.getElementById(state.activeJournalTab + '-content-tab')?.classList.add('active');
    }
});
