/**
 * Zenjispace Ambient Sounds
 * Manages sound playback for concentration and relaxation
 */

document.addEventListener('DOMContentLoaded', () => {
    const audioPlayer = document.getElementById('audioPlayer');
    const soundsContainer = document.getElementById('soundsContainer');
    
    // Available sound sources
    const sounds = [
        { id: 'rain', name: 'Rain', description: 'Gentle rainfall', icon: '🌧️' },
        { id: 'forest', name: 'Forest', description: 'Birds and nature', icon: '🌳' },
        { id: 'waves', name: 'Ocean', description: 'Calm waves', icon: '🌊' },
        { id: 'cafe', name: 'Café', description: 'Coffee shop ambience', icon: '☕' },
        { id: 'whitenoise', name: 'White Noise', description: 'Background noise', icon: '📻' },
        { id: 'lofi', name: 'Lo-Fi', description: 'Lo-fi beats', icon: '🎵' }
    ];
    
    let currentActiveSound = null;
    
    // Load sound preferences from state
    const state = loadState();
    if (state.sound) {
        currentActiveSound = state.sound;
    }
    
    // Create sound cards
    function createSoundCards() {
        soundsContainer.innerHTML = '';
        
        sounds.forEach(sound => {
            const soundCard = document.createElement('div');
            soundCard.className = 'sound-card';
            if (sound.id === currentActiveSound) {
                soundCard.classList.add('active');
            }
            soundCard.setAttribute('data-sound', sound.id);
            
            soundCard.innerHTML = `
                <div class="sound-icon">${sound.icon}</div>
                <div class="sound-name">${sound.name}</div>
                <div class="sound-description">${sound.description}</div>
            `;
            
            soundCard.addEventListener('click', () => toggleSound(sound.id, soundCard));
            
            soundsContainer.appendChild(soundCard);
        });
    }
    
    // Toggle sound playback
    function toggleSound(soundId, card) {
        if (currentActiveSound === soundId) {
            // Stop the current sound
            audioPlayer.pause();
            card.classList.remove('active');
            currentActiveSound = null;
            updateState('sound', null);
        } else {
            // Stop any playing sound
            const allCards = document.querySelectorAll('.sound-card');
            allCards.forEach(c => c.classList.remove('active'));
            
            // Play the new sound
            audioPlayer.src = `assets/sounds/rain.wav`;
            audioPlayer.play().catch(err => {
                console.error('Failed to play sound:', err);
                showNotification('Unable to play sound. Sound files may be missing.');
            });
            
            card.classList.add('active');
            currentActiveSound = soundId;
            updateState('sound', soundId);
        }
    }
    
    // Initialize sound cards
    createSoundCards();
    
    // If there was a previously active sound, try to resume it
    if (currentActiveSound) {
        const activeCard = document.querySelector(`.sound-card[data-sound="${currentActiveSound}"]`);
        if (activeCard) {
            audioPlayer.src = `assets/sounds/${currentActiveSound}.mp3`;
            audioPlayer.play().catch(err => {
                console.error('Failed to resume sound:', err);
                currentActiveSound = null;
                activeCard.classList.remove('active');
                updateState('sound', null);
            });
        }
    }
});
