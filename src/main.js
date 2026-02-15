import './style.css'

// Starry background canvas
const canvas = document.getElementById('stars');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Star class
class Star {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2;
    this.speedY = Math.random() * 0.5 + 0.1;
    this.opacity = Math.random();
    this.twinkleSpeed = Math.random() * 0.02 + 0.01;
  }

  update() {
    this.y += this.speedY;
    
    // Reset star when it goes off screen
    if (this.y > canvas.height) {
      this.y = 0;
      this.x = Math.random() * canvas.width;
    }
    
    // Twinkling effect
    this.opacity += this.twinkleSpeed;
    if (this.opacity > 1 || this.opacity < 0.3) {
      this.twinkleSpeed = -this.twinkleSpeed;
    }
  }

  draw() {
    ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Add blue glow for some stars
    if (this.size > 1.5) {
      ctx.fillStyle = `rgba(0, 204, 255, ${this.opacity * 0.3})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Create stars
const stars = [];
const starCount = 200;

for (let i = 0; i < starCount; i++) {
  stars.push(new Star());
}

// Animation loop
function animate() {
  ctx.fillStyle = 'rgba(0, 1, 17, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  stars.forEach(star => {
    star.update();
    star.draw();
  });
  
  requestAnimationFrame(animate);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

//  Create audio context for sound effects
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Game settings
const gameSettings = {
  sfxVolume: 0.6,
  musicVolume: 0.5,
  difficulty: 'normal',
  visualEffects: true
};

// Background music variables
let musicOscillator = null;
let musicOscillator2 = null;
let musicGainNode = null;
let isMusicPlaying = false;
let musicInterval = null;

// Multiple melody patterns for variation
const melodyPatterns = [
  // Pattern 1 - Opening hook (catchy start)
  [
    { note: 783.99, duration: 0.15 },  // G5
    { note: 659.25, duration: 0.15 },  // E5
    { note: 1046.50, duration: 0.2 },  // C6
    { note: 783.99, duration: 0.25 },  // G5
  ],
  // Pattern 2 - Descending
  [
    { note: 1046.50, duration: 0.2 }, // C6
    { note: 783.99, duration: 0.2 },  // G5
    { note: 659.25, duration: 0.2 },  // E5
    { note: 523.25, duration: 0.4 },  // C5
  ],
  // Pattern 3 - Jump pattern
  [
    { note: 523.25, duration: 0.15 }, // C5
    { note: 783.99, duration: 0.15 }, // G5
    { note: 659.25, duration: 0.15 }, // E5
    { note: 1046.50, duration: 0.15 },// C6
    { note: 587.33, duration: 0.2 },  // D5
    { note: 659.25, duration: 0.2 },  // E5
  ],
  // Pattern 4 - Dramatic
  [
    { note: 440.00, duration: 0.3 },  // A4
    { note: 493.88, duration: 0.15 }, // B4
    { note: 523.25, duration: 0.15 }, // C5
    { note: 659.25, duration: 0.4 },  // E5
  ],
  // Pattern 5 - Energetic
  [
    { note: 659.25, duration: 0.1 },  // E5
    { note: 659.25, duration: 0.1 },  // E5
    { note: 783.99, duration: 0.2 },  // G5
    { note: 659.25, duration: 0.1 },  // E5
    { note: 523.25, duration: 0.3 },  // C5
    { note: 587.33, duration: 0.2 },  // D5
  ]
];

// Phonk drop pattern (heavy bass, aggressive rhythm)
const phonkPattern = [
  { note: 87.31, duration: 0.3, type: 'bass' },     // F2 - heavy bass
  { note: 87.31, duration: 0.15, type: 'bass' },    // F2
  { note: 130.81, duration: 0.15, type: 'bass' },   // C3
  { note: 87.31, duration: 0.3, type: 'bass' },     // F2
  { note: 164.81, duration: 0.1, type: 'accent' },  // E3 - accent
  { note: 87.31, duration: 0.3, type: 'bass' },     // F2
  { note: 87.31, duration: 0.15, type: 'bass' },    // F2
  { note: 130.81, duration: 0.15, type: 'bass' },   // C3
  { note: 110.00, duration: 0.3, type: 'bass' },    // A2
  { note: 196.00, duration: 0.1, type: 'accent' }   // G3 - accent
];

let currentNote = 0;
let currentPattern = 0;
let patternPlayCount = 0;
let totalPatternsPlayed = 0;
let isDropMode = false;
let lastPattern = -1;

// Function to play a single note
function playNote(frequency, duration, noteType = 'normal') {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  // Different waveforms for different note types
  if (noteType === 'bass') {
    osc.type = 'sawtooth'; // Heavy bass sound
    gain.gain.setValueAtTime(0.15 * gameSettings.musicVolume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01 * gameSettings.musicVolume, audioContext.currentTime + duration);
  } else if (noteType === 'accent') {
    osc.type = 'square';
    gain.gain.setValueAtTime(0.12 * gameSettings.musicVolume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01 * gameSettings.musicVolume, audioContext.currentTime + duration * 0.5);
  } else {
    osc.type = 'square'; // Retro square wave sound
    gain.gain.setValueAtTime(0.08 * gameSettings.musicVolume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01 * gameSettings.musicVolume, audioContext.currentTime + duration);
  }
  
  osc.frequency.setValueAtTime(frequency, audioContext.currentTime);
  
  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + duration);
}

// Function to create retro background music
function startBackgroundMusic() {
  if (isMusicPlaying) return;
  
  try {
    // Resume audio context
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    isMusicPlaying = true;
    
    // Play the phonk bass pattern
    function playMelody() {
      if (!isMusicPlaying) return;
      
      const activePattern = phonkPattern;
      const note = activePattern[currentNote];
      playNote(note.note, note.duration, note.type);
      
      currentNote++;
      
      // Pattern completed, loop back
      if (currentNote >= activePattern.length) {
        currentNote = 0;
      }
      
      // Schedule next note
      musicInterval = setTimeout(playMelody, note.duration * 1000);
    }
    
    playMelody();
    console.log('🎸 Phonk bass music started!');
  } catch (error) {
    console.log('Music not available:', error);
  }
}

function stopBackgroundMusic() {
  if (isMusicPlaying) {
    try {
      isMusicPlaying = false;
      if (musicInterval) {
        clearTimeout(musicInterval);
        musicInterval = null;
      }
      currentNote = 0;
      melodyLoopCount = 0;
      isDropMode = false;
      console.log('Retro music stopped');
    } catch (error) {
      console.log('Could not stop music:', error);
    }
  }
}

// Start music on any user interaction (browser requires this)
function tryStartMusic() {
  if (!isMusicPlaying) {
    startBackgroundMusic();
    // Remove listeners after music starts
    if (isMusicPlaying) {
      document.removeEventListener('click', tryStartMusic);
      document.removeEventListener('keydown', tryStartMusic);
      document.removeEventListener('touchstart', tryStartMusic);
      document.removeEventListener('mousemove', tryStartMusic);
    }
  }
}

// Listen for any interaction to start music
document.addEventListener('click', tryStartMusic);
document.addEventListener('keydown', tryStartMusic);
document.addEventListener('touchstart', tryStartMusic);
document.addEventListener('mousemove', tryStartMusic, { once: true });

// Function to play hover sound
function playHoverSound() {
  // Resume audio context if needed
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Retro arcade blip sound
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  
  // Quick fade out with volume from settings
  gainNode.gain.setValueAtTime(0.18 * gameSettings.sfxVolume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01 * gameSettings.sfxVolume, audioContext.currentTime + 0.1);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.1);
}

// Handle Start button hover and click
const startButton = document.getElementById('start-button');
startButton.addEventListener('mouseenter', playHoverSound);
startButton.addEventListener('click', startGame);

// Handle Rules button
const rulesButton = document.getElementById('rules-button');
const rulesScreen = document.getElementById('rules-screen');
const backButton = document.getElementById('back-button');

rulesButton.addEventListener('mouseenter', playHoverSound);
rulesButton.addEventListener('click', () => {
  rulesScreen.style.display = 'flex';
});

backButton.addEventListener('mouseenter', playHoverSound);
backButton.addEventListener('click', () => {
  rulesScreen.style.display = 'none';
});

// Handle Settings button
const settingsButton = document.getElementById('settings-button');
const settingsScreen = document.getElementById('settings-screen');
const settingsBackButton = document.getElementById('settings-back-button');

settingsButton.addEventListener('mouseenter', playHoverSound);
settingsButton.addEventListener('click', () => {
  settingsScreen.style.display = 'flex';
});

settingsBackButton.addEventListener('mouseenter', playHoverSound);
settingsBackButton.addEventListener('click', () => {
  settingsScreen.style.display = 'none';
});

// SFX Volume slider
const sfxSlider = document.getElementById('sfx-volume');
const sfxValue = document.getElementById('sfx-value');

sfxSlider.addEventListener('input', (e) => {
  const value = e.target.value;
  gameSettings.sfxVolume = value / 100;
  sfxValue.textContent = `${value}%`;
});

sfxSlider.addEventListener('change', pla1HoverSound);

// Music Volume slider
const musicSlider = document.getElementById('music-volume');
const musicValue = document.getElementById('music-value');

musicSlider.addEventListener('input', (e) => {
  const value = e.target.value;
  gameSettings.musicVolume = value / 100;
  musicValue.textContent = `${value}%`;
  // Update music volume in real-time
  if (musicGainNode && isMusicPlaying) {
    musicGainNode.gain.setValueAtTime(0.05 * gameSettings.musicVolume, audioContext.currentTime);
  }
});

// Difficulty buttons
const difficultyButtons = document.querySelectorAll('.difficulty-btn');

difficultyButtons.forEach(btn => {
  btn.addEventListener('mouseenter', playHoverSound);
  btn.addEventListener('click', () => {
    difficultyButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    gameSettings.difficulty = btn.dataset.difficulty;
    console.log('Difficulty set to:', gameSettings.difficulty);
  });
});

// Visual Effects toggle
const visualEffectsToggle = document.getElementById('visual-effects');
const toggleStatus = document.querySelector('.toggle-status');

visualEffectsToggle.addEventListener('change', (e) => {
  gameSettings.visualEffects = e.target.checked;
  toggleStatus.textContent = e.target.checked ? 'ON' : 'OFF';
  playHoverSound();
  console.log('Visual effects:', gameSettings.visualEffects);
});

// Start game function (placeholder for your brothers to implement)
function startGame() {
  console.log('Game Starting...');
  // Hide title screen with fade out
  const titleScreen = document.getElementById('title-screen');
  titleScreen.style.transition = 'opacity 1s';
  titleScreen.style.opacity = '0';
  
  setTimeout(() => {
    // Clear everything - blank screen for your brother to work with
    titleScreen.style.display = 'none';
    canvas.style.display = 'none'; // Hide the starry background too
    
    // Your brother can add the game code here
    console.log('Blank screen ready - your brother can implement the game here!');
  }, 1000);
}
