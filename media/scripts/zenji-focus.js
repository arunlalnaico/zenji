/**
 * Zenjispace Focus Tools
 * Manages focus timer, breaks, and statistics
 */

document.addEventListener('DOMContentLoaded', () => {
    // Focus timer variables
    let focusInterval;
    let breakInterval;
    let focusTime = 25 * 60; // 25 minutes in seconds
    let breakTime = 5 * 60; // 5 minutes in seconds
    
    // UI Elements
    const startFocusBtn = document.getElementById('startFocus');
    const startBreakBtn = document.getElementById('startBreak');
    const breathingCircle = document.querySelector('.breathing-circle');
    
    // Stat counters
    let focusCount = 0;
    let breakCount = 0;
    let totalFocusMinutes = 0;
    
    // Initialize stats from state
    const state = loadState();
    if (state.focusStats) {
        focusCount = state.focusStats.focusCount || 0;
        breakCount = state.focusStats.breakCount || 0;
        totalFocusMinutes = state.focusStats.totalFocusMinutes || 0;
        
        document.getElementById('focusCount').textContent = focusCount;
        document.getElementById('focusMinutes').textContent = totalFocusMinutes;
        document.getElementById('breakCount').textContent = breakCount;
    }
    
    // Breathing circle control
    breathingCircle.addEventListener('click', () => {
        if (breathingCircle.style.animationPlayState === 'paused') {
            breathingCircle.style.animationPlayState = 'running';
        } else {
            breathingCircle.style.animationPlayState = 'paused';
        }
    });
    
    // Focus timer
    startFocusBtn.addEventListener('click', () => {
        clearInterval(focusInterval);
        clearInterval(breakInterval);
        
        // Reset timer to 25 minutes if it's not already running
        if (!startFocusBtn.disabled) {
            focusTime = 25 * 60;
        }
        
        startFocusBtn.textContent = `Focus: ${Math.floor(focusTime / 60)}:${(focusTime % 60).toString().padStart(2, '0')}`;
        startFocusBtn.disabled = true;
        
        focusInterval = setInterval(() => {
            focusTime--;
            startFocusBtn.textContent = `Focus: ${Math.floor(focusTime / 60)}:${(focusTime % 60).toString().padStart(2, '0')}`;
            
            if (focusTime <= 0) {
                completePomodoro();
            }
        }, 1000);
    });
    
    // Break timer
    startBreakBtn.addEventListener('click', () => {
        clearInterval(focusInterval);
        clearInterval(breakInterval);
        
        // Reset timer to 5 minutes if it's not already running
        if (!startBreakBtn.disabled) {
            breakTime = 5 * 60;
        }
        
        startBreakBtn.textContent = `Break: ${Math.floor(breakTime / 60)}:${(breakTime % 60).toString().padStart(2, '0')}`;
        startBreakBtn.disabled = true;
        
        breakInterval = setInterval(() => {
            breakTime--;
            startBreakBtn.textContent = `Break: ${Math.floor(breakTime / 60)}:${(breakTime % 60).toString().padStart(2, '0')}`;
            
            if (breakTime <= 0) {
                completeBreak();
            }
        }, 1000);
    });
    
    // Focus session completed
    function completePomodoro() {
        clearInterval(focusInterval);
        startFocusBtn.textContent = 'Start 25min Focus Session';
        startFocusBtn.disabled = false;
        focusTime = 25 * 60;
        
        // Update stats
        focusCount++;
        totalFocusMinutes += 25;
        document.getElementById('focusCount').textContent = focusCount;
        document.getElementById('focusMinutes').textContent = totalFocusMinutes;
        
        // Save stats to state
        updateState('focusStats', {
            focusCount,
            breakCount,
            totalFocusMinutes
        });
        
        // Show notification
        showNotification('Focus session completed! Time for a break.');
    }
    
    // Break completed
    function completeBreak() {
        clearInterval(breakInterval);
        startBreakBtn.textContent = 'Take a 5min Break';
        startBreakBtn.disabled = false;
        breakTime = 5 * 60;
        
        // Update stats
        breakCount++;
        document.getElementById('breakCount').textContent = breakCount;
        
        // Save stats to state
        updateState('focusStats', {
            focusCount,
            breakCount,
            totalFocusMinutes
        });
        
        // Show notification
        showNotification('Break completed! Ready to focus again?');
    }
});
