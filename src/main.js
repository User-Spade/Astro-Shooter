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

// UFO will be created later in the file
let ufo;

// Animation loop
function animate() {
  ctx.fillStyle = 'rgba(0, 1, 17, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  stars.forEach(star => {
    star.update();
    star.draw();
  });
  
  // UFO animation (if created)
  if (ufo) {
    ufo.activate();
    ufo.update();
    ufo.draw();
  }
  
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

// High Score System
function getHighScore() {
  const saved = localStorage.getItem('astroShooterHighScore');
  return saved ? parseInt(saved) : 0;
}

function setHighScore(score) {
  const current = getHighScore();
  if (score > current) {
    localStorage.setItem('astroShooterHighScore', score.toString());
    return true; // New high score!
  }
  return false;
}

// Display high score on load
const highScoreDisplay = document.getElementById('high-score');
if (highScoreDisplay) {
  highScoreDisplay.textContent = `HI-SCORE: ${getHighScore().toString().padStart(6, '0')}`;
}

// Background music variables
let musicOscillator = null;
let musicOscillator2 = null;
let musicGainNode = null;
let isMusicPlaying = false;
let musicInterval = null;
let firstInteraction = true; // Track if this is the first user interaction

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
  if (isMusicPlaying) {
    console.log('Music already playing, skipping...');
    return;
  }
  
  // Set flag immediately to prevent multiple instances
  isMusicPlaying = true;
  
  try {
    // Resume audio context
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    // Reset note position
    currentNote = 0;
    
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
    isMusicPlaying = false; // Reset flag on error
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
    console.log('Attempting to start music...');
    startBackgroundMusic();
  } else {
    console.log('Music already playing, not starting again.');
  }
}

// Function to play hover sound
function playHoverSound() {
  // Start music on first button hover (but skip the beep sound)
  if (firstInteraction) {
    firstInteraction = false;
    tryStartMusic();
    return; // Don't play hover sound on first interaction
  }
  
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

// Function to play click sound
function playClickSound() {
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Deeper click sound
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
  
  gainNode.gain.setValueAtTime(0.1 * gameSettings.sfxVolume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01 * gameSettings.sfxVolume, audioContext.currentTime + 0.15);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.15);
}

// Function to play volume change feedback
function playVolumeSound(pitch = 600) {
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(pitch, audioContext.currentTime);
  
  gainNode.gain.setValueAtTime(0.1 * gameSettings.sfxVolume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01 * gameSettings.sfxVolume, audioContext.currentTime + 0.08);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.08);
}

// Handle Start button hover and click
const startButton = document.getElementById('start-button');
startButton.addEventListener('mouseenter', playHoverSound);
startButton.addEventListener('click', () => {
  playClickSound();
  startGame();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    const titleScreen = document.getElementById('title-screen');
    const rulesScreen = document.getElementById('rules-screen');
    const settingsScreen = document.getElementById('settings-screen');
    
    // If on title screen, start game
    if (titleScreen.style.display !== 'none' && 
        rulesScreen.style.display === 'none' && 
        settingsScreen.style.display === 'none') {
      e.preventDefault();
      playClickSound();
      startGame();
    }
  }
  
  // ESC to close screens
  if (e.key === 'Escape') {
    const rulesScreen = document.getElementById('rules-screen');
    const settingsScreen = document.getElementById('settings-screen');
    
    if (rulesScreen.style.display === 'flex') {
      playClickSound();
      rulesScreen.style.display = 'none';
    }
    if (settingsScreen.style.display === 'flex') {
      playClickSound();
      settingsScreen.style.display = 'none';
    }
  }
});

// Handle Rules button
const rulesButton = document.getElementById('rules-button');
const rulesScreen = document.getElementById('rules-screen');
const backButton = document.getElementById('back-button');

rulesButton.addEventListener('mouseenter', playHoverSound);
rulesButton.addEventListener('click', () => {
  playClickSound();
  rulesScreen.style.display = 'flex';
});

backButton.addEventListener('mouseenter', playHoverSound);
backButton.addEventListener('click', () => {
  playClickSound();
  rulesScreen.style.display = 'none';
});

// Handle Settings button
const settingsButton = document.getElementById('settings-button');
const settingsScreen = document.getElementById('settings-screen');
const settingsBackButton = document.getElementById('settings-back-button');

settingsButton.addEventListener('mouseenter', playHoverSound);
settingsButton.addEventListener('click', () => {
  playClickSound();
  settingsScreen.style.display = 'flex';
});

settingsBackButton.addEventListener('mouseenter', playHoverSound);
settingsBackButton.addEventListener('click', () => {
  playClickSound();
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

sfxSlider.addEventListener('change', () => {
  playVolumeSound(800);
});

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

musicSlider.addEventListener('change', () => {
  playVolumeSound(600);
});

// Difficulty buttons
const difficultyButtons = document.querySelectorAll('.difficulty-btn');

difficultyButtons.forEach(btn => {
  btn.addEventListener('mouseenter', playHoverSound);
  btn.addEventListener('click', () => {
    playClickSound();
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
  playClickSound();
  console.log('Visual effects:', gameSettings.visualEffects);
});

// Start game function (placeholder for your brothers to implement)
function startGame() {
  playClickSound();
  console.log('Game Starting...');
  
  // Show GET READY screen
  const getReadyScreen = document.getElementById('get-ready-screen');
  const titleScreen = document.getElementById('title-screen');
  
  titleScreen.style.transition = 'opacity 0.5s';
  titleScreen.style.opacity = '0';
  
  setTimeout(() => {
    titleScreen.style.display = 'none';
    getReadyScreen.style.display = 'flex';
    
    // Countdown
    let count = 3;
    const countdownEl = document.getElementById('countdown');
    
    const countInterval = setInterval(() => {
      playVolumeSound(1000 + (count * 100));
      count--;
      
      if (count === 0) {
        countdownEl.textContent = 'GO!';
        playVolumeSound(1500);
        
        setTimeout(() => {
          clearInterval(countInterval);
          getReadyScreen.style.opacity = '0';
          
          setTimeout(() => {
            getReadyScreen.style.display = 'none';
            canvas.style.display = 'none';
            
            // Stop background music
            stopBackgroundMusic();
            
            // Start the actual game
            initGame();
          }, 500);
        }, 500);
      } else if (count > 0) {
        countdownEl.textContent = count;
      }
    }, 1000);
  }, 500);
}

// Function to show game over screen (for brothers to call)
function showGameOver(finalScore) {
  const gameOverScreen = document.getElementById('game-over-screen');
  const finalScoreEl = document.getElementById('final-score');
  const newHighScoreEl = document.getElementById('new-high-score-msg');
  
  finalScoreEl.textContent = finalScore.toString().padStart(6, '0');
  
  // Check if new high score
  if (setHighScore(finalScore)) {
    newHighScoreEl.style.display = 'block';
    const highScoreDisplay = document.getElementById('high-score');
    if (highScoreDisplay) {
      highScoreDisplay.textContent = `HI-SCORE: ${finalScore.toString().padStart(6, '0')}`;
    }
  } else {
    newHighScoreEl.style.display = 'none';
  }
  
  gameOverScreen.style.display = 'flex';
  playVolumeSound(200); // Low game over sound
}

// Restart game from game over screen
const restartButton = document.getElementById('restart-button');
if (restartButton) {
  restartButton.addEventListener('mouseenter', playHoverSound);
  restartButton.addEventListener('click', () => {
    playClickSound();
    const gameOverScreen = document.getElementById('game-over-screen');
    const titleScreen = document.getElementById('title-screen');
    const gameCanvas = document.getElementById('game-canvas');
    const gameHUD = document.getElementById('game-hud');
    
    // Hide game elements
    gameOverScreen.style.display = 'none';
    gameCanvas.style.display = 'none';
    gameHUD.style.display = 'none';
    
    // Show title screen
    titleScreen.style.display = 'block';
    titleScreen.style.opacity = '1';
    canvas.style.display = 'block';
    
    // Reset music flag so it can be started again
    firstInteraction = true;
    
    // Reset game
    if (game) {
      game.gameRunning = false;
      game = null;
    }
  });
}

// UFO Animation
class UFO {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.active = false;
    this.x = -100;
    this.y = 50 + Math.random() * 100;
    this.speed = 2 + Math.random();
    this.size = 30;
  }
  
  activate() {
    if (!this.active && Math.random() < 0.001) { // Random chance to spawn
      this.active = true;
      this.reset();
    }
  }
  
  update() {
    if (this.active) {
      this.x += this.speed;
      if (this.x > canvas.width + 100) {
        this.active = false;
      }
    }
  }
  
  draw() {
    if (!this.active) return;
    
    ctx.save();
    
    // UFO body
    ctx.fillStyle = '#ff0066';
    ctx.shadowColor = '#ff0066';
    ctx.shadowBlur = 15;
    
    // Dome
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI, true);
    ctx.fill();
    
    // Base
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, this.size, this.size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Lights
    const lightCount = 5;
    for (let i = 0; i < lightCount; i++) {
      const angle = (Math.PI / lightCount) * i + Math.PI;
      const lx = this.x + Math.cos(angle) * this.size * 0.7;
      const ly = this.y + Math.sin(angle) * this.size * 0.2;
      
      ctx.fillStyle = Math.random() > 0.5 ? '#00ffff' : '#ffff00';
      ctx.beginPath();
      ctx.arc(lx, ly, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

ufo = new UFO();

// ======================
// GAME IMPLEMENTATION
// ======================

let game = null;

// Game State
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    this.player1 = new Player(this.canvas.width * 0.33, this.canvas.height - 80, 1);
    this.player2 = new Player(this.canvas.width * 0.67, this.canvas.height - 80, 2);
    this.aliens = [];
    this.bullets = [];
    this.score = 0;
    this.wave = 1;
    this.gameRunning = true;
    
    this.keys = {};
    this.alienSpeed = 1;
    this.alienDirection = 1;
    this.alienDescendSpeed = 0.3; // Constant downward movement
    
    // Difficulty modifiers
    const difficultySettings = {
      easy: { alienRows: 3, alienSpeed: 0.5, descendSpeed: 0.2, lives: 5 },
      normal: { alienRows: 4, alienSpeed: 1, descendSpeed: 0.3, lives: 3 },
      hard: { alienRows: 5, alienSpeed: 1.5, descendSpeed: 0.5, lives: 2 }
    };
    
    const settings = difficultySettings[gameSettings.difficulty];
    this.player1.lives = settings.lives;
    this.player2.lives = settings.lives;
    this.alienSpeed = settings.alienSpeed;
    this.alienDescendSpeed = settings.descendSpeed;
    this.alienRows = settings.alienRows;
    
    this.createAliens();
    this.setupControls();
    this.updateHUD();
  }
  
  createAliens() {
    this.aliens = [];
    const cols = 5; // 5 aliens per side
    const spacing = 60;
    const midPoint = this.canvas.width / 2;
    const startY = 80;
    
    // Left side aliens (P1 side)
    const leftStartX = 40;
    for (let row = 0; row < this.alienRows; row++) {
      for (let col = 0; col < cols; col++) {
        let alien = new Alien(
          leftStartX + col * spacing,
          startY + row * spacing,
          row
        );
        alien.side = 1; // Left side
        alien.minX = 20;
        alien.maxX = midPoint - 10;
        this.aliens.push(alien);
      }
    }
    
    // Right side aliens (P2 side)
    const rightStartX = midPoint + 40;
    for (let row = 0; row < this.alienRows; row++) {
      for (let col = 0; col < cols; col++) {
        let alien = new Alien(
          rightStartX + col * spacing,
          startY + row * spacing,
          row
        );
        alien.side = 2; // Right side
        alien.minX = midPoint + 10;
        alien.maxX = this.canvas.width - 20;
        this.aliens.push(alien);
      }
    }
  }
  
  setupControls() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      
      // Player 1 shoot
      if (e.key === ' ' && this.player1.lives > 0) {
        e.preventDefault();
        this.player1.shoot(this);
      }
      
      // Player 2 shoot
      if (e.key === 'Control' && this.player2.lives > 0) {
        e.preventDefault();
        this.player2.shoot(this);
      }
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }
  
  updateHUD() {
    document.getElementById('game-score').textContent = this.score.toString().padStart(6, '0');
    document.getElementById('p1-lives').textContent = '❤'.repeat(Math.max(0, this.player1.lives));
    document.getElementById('p2-lives').textContent = '❤'.repeat(Math.max(0, this.player2.lives));
    document.getElementById('game-wave').textContent = this.wave;
  }
  
  update() {
    if (!this.gameRunning) return;
    
    // Update players
    if (this.player1.lives > 0) {
      // Player 1 controls (A/D for horizontal, W/S for vertical)
      if (this.keys['a']) this.player1.x -= this.player1.speed;
      if (this.keys['d']) this.player1.x += this.player1.speed;
      if (this.keys['w']) this.player1.y -= this.player1.speed;
      if (this.keys['s']) this.player1.y += this.player1.speed;
      this.player1.update(this.canvas);
    }
    
    if (this.player2.lives > 0) {
      // Player 2 controls (Arrow keys for horizontal, Up/Down for vertical)
      if (this.keys['arrowleft']) this.player2.x -= this.player2.speed;
      if (this.keys['arrowright']) this.player2.x += this.player2.speed;
      if (this.keys['arrowup']) this.player2.y -= this.player2.speed;
      if (this.keys['arrowdown']) this.player2.y += this.player2.speed;
      this.player2.update(this.canvas);
    }
    
    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      this.bullets[i].update();
      
      if (this.bullets[i].y < 0 || this.bullets[i].y > this.canvas.height) {
        this.bullets.splice(i, 1);
      }
    }
    
    // Update aliens
    let hitEdgeLeft = false, hitEdgeRight = false;
    for (let alien of this.aliens) {
      // Horizontal movement (bounded to their side)
      alien.x += this.alienSpeed * this.alienDirection;
      
      // Keep aliens within their zone boundaries
      if (alien.x < alien.minX) {
        alien.x = alien.minX;
        hitEdgeLeft = true;
      }
      if (alien.x > alien.maxX) {
        alien.x = alien.maxX;
        hitEdgeRight = true;
      }
      
      // Constant downward descent
      alien.y += this.alienDescendSpeed;
      
      // Check if aliens reached the planet
      if (alien.y > this.canvas.height - 150) {
        this.gameOver();
        return;
      }
    }
    
    // Reverse direction when either side hits their edge
    if (hitEdgeLeft || hitEdgeRight) {
      this.alienDirection *= -1;
    }
    
    // Check collisions
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      for (let j = this.aliens.length - 1; j >= 0; j--) {
        if (this.checkCollision(this.bullets[i], this.aliens[j])) {
          this.aliens.splice(j, 1);
          this.bullets.splice(i, 1);
          this.score += 100;
          this.updateHUD();
          playVolumeSound(1200);
          break;
        }
      }
    }
    
    // Check player-alien collisions
    for (let j = this.aliens.length - 1; j >= 0; j--) {
      // Check Player 1 collision
      if (this.player1.lives > 0) {
        if (this.checkPlayerCollision(this.player1, this.aliens[j])) {
          this.player1.lives--;
          this.aliens.splice(j, 1);
          this.updateHUD();
          playClickSound();
          continue;
        }
      }
      
      // Check Player 2 collision
      if (this.player2.lives > 0) {
        if (this.checkPlayerCollision(this.player2, this.aliens[j])) {
          this.player2.lives--;
          this.aliens.splice(j, 1);
          this.updateHUD();
          playClickSound();
          continue;
        }
      }
    }
    
    // Check if wave is complete
    if (this.aliens.length === 0) {
      this.nextWave();
    }
    
    // Check game over
    if (this.player1.lives <= 0 && this.player2.lives <= 0) {
      this.gameOver();
    }
  }
  				
  checkCollision(bullet, alien) {
    const dist = Math.hypot(bullet.x - alien.x, bullet.y - alien.y);
    return dist < alien.size + bullet.size;
  }
  
  checkPlayerCollision(player, alien) {
    const dist = Math.hypot(player.x - alien.x, player.y - alien.y);
    return dist < 30 + alien.size; // Player collision radius ~30, alien size ~15
  }
  
  nextWave() {
    this.wave++;
    this.alienSpeed += 0.3;
    this.alienDescendSpeed += 0.1; // Aliens descend faster each wave
    this.updateHUD();
    this.createAliens();
    playVolumeSound(1500);
  }
  
  gameOver() {
    this.gameRunning = false;
    setTimeout(() => {
      document.getElementById('game-canvas').style.display = 'none';
      document.getElementById('game-hud').style.display = 'none';
      showGameOver(this.score);
    }, 1000);
  }
  
  draw() {
    this.ctx.fillStyle = '#000011';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw stars background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      this.ctx.fillRect(x, y, 1, 1);
    }
    
    // Draw dividing line
    const midPoint = this.canvas.width / 2;
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 204, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([10, 10]);
    this.ctx.beginPath();
    this.ctx.moveTo(midPoint, 0);
    this.ctx.lineTo(midPoint, this.canvas.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]); // Reset dash
    
    // Draw side labels
    this.ctx.font = '20px "Press Start 2P"';
    this.ctx.fillStyle = 'rgba(0, 204, 255, 0.5)';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('P1 ZONE', midPoint / 2, 30);
    
    this.ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
    this.ctx.fillText('P2 ZONE', midPoint + midPoint / 2, 30);
    this.ctx.restore();
    
    // Draw Earth/Planet at the bottom
    this.drawPlanet();
    
    // Draw players
    if (this.player1.lives > 0) this.player1.draw(this.ctx);
    if (this.player2.lives > 0) this.player2.draw(this.ctx);
    
    // Draw bullets
    for (let bullet of this.bullets) {
      bullet.draw(this.ctx);
    }
    
    // Draw aliens
    for (let alien of this.aliens) {
      alien.draw(this.ctx);
    }
  }
  
  drawPlanet() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height + 100; // Bottom of screen
    const radius = 250;
    
    this.ctx.save();
    
    // Planet glow
    const gradient = this.ctx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, radius * 1.2);
    gradient.addColorStop(0, 'rgba(0, 100, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius * 1.2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Planet sphere
    const planetGradient = this.ctx.createRadialGradient(
      centerX - 50, centerY - 50, 50,
      centerX, centerY, radius
    );
    planetGradient.addColorStop(0, '#4499ff');
    planetGradient.addColorStop(0.5, '#0066cc');
    planetGradient.addColorStop(1, '#001133');
    
    this.ctx.fillStyle = planetGradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Add some continents/landmasses
    this.ctx.fillStyle = 'rgba(34, 139, 34, 0.4)';
    this.ctx.beginPath();
    this.ctx.arc(centerX - 80, centerY - 120, 40, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.arc(centerX + 60, centerY - 100, 50, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.arc(centerX - 30, centerY - 80, 35, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Clouds
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.beginPath();
    this.ctx.arc(centerX + 20, centerY - 110, 30, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.beginPath();
    this.ctx.arc(centerX - 100, centerY - 90, 25, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Atmosphere rim
    this.ctx.strokeStyle = 'rgba(100, 180, 255, 0.3)';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    this.ctx.restore();
  }
  
  loop() {
    if (!this.gameRunning) return;
    
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}

// Player Class
class Player {
  constructor(x, y, playerNum) {
    this.x = x;
    this.y = y;
    this.playerNum = playerNum;
    this.width = 40;
    this.height = 30;
    this.speed = 5;
    this.lives = 3;
    this.shootCooldown = 0;
    this.color = playerNum === 1 ? '#00ccff' : '#00ff00';
  }
  
  update(canvas) {
    const midPoint = canvas.width / 2;
    
    // X boundary enforcement (zone restriction)
    if (this.playerNum === 1) {
      if (this.x < 20) this.x = 20;
      if (this.x > midPoint - 10) this.x = midPoint - 10; // Can't cross center
    } else {
      if (this.x < midPoint + 10) this.x = midPoint + 10; // Can't cross center
      if (this.x > canvas.width - 20) this.x = canvas.width - 20;
    }
    
    // Y boundary enforcement (keep in bounds)
    const minY = 30;
    const maxY = canvas.height - 80;
    if (this.y < minY) this.y = minY;
    if (this.y > maxY) this.y = maxY;
    
    if (this.shootCooldown > 0) this.shootCooldown--;
  }
  
  shoot(game) {
    if (this.shootCooldown <= 0) {
      game.bullets.push(new Bullet(this.x, this.y - 20, -8, this.color));
      this.shootCooldown = 20;
      playVolumeSound(800);
    }
  }
  
  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;
    
    // Ship body
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - 15);
    ctx.lineTo(this.x - 20, this.y + 15);
    ctx.lineTo(this.x + 20, this.y + 15);
    ctx.closePath();
    ctx.fill();
    
    // Cockpit
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

// Alien Class
class Alien {
  constructor(x, y, row) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.size = 20;
    this.colors = ['#ff0066', '#ff6600', '#ffff00', '#00ff00', '#0066ff'];
    this.color = this.colors[row % this.colors.length];
  }
  
  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    
    // Classic space invader shape
    ctx.fillRect(this.x - 15, this.y - 10, 30, 20);
    ctx.fillRect(this.x - 10, this.y - 15, 5, 10);
    ctx.fillRect(this.x + 5, this.y - 15, 5, 10);
    ctx.fillRect(this.x - 20, this.y + 10, 10, 5);
    ctx.fillRect(this.x + 10, this.y + 10, 10, 5);
    
    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x - 8, this.y - 5, 5, 5);
    ctx.fillRect(this.x + 3, this.y - 5, 5, 5);
    
    ctx.restore();
  }
}

// Bullet Class
class Bullet {
  constructor(x, y, speedY, color) {
    this.x = x;
    this.y = y;
    this.speedY = speedY;
    this.size = 3;
    this.color = color;
  }
  
  update() {
    this.y += this.speedY;
  }
  
  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    
    ctx.fillRect(this.x - 2, this.y - 8, 4, 16);
    
    ctx.restore();
  }
}

// Initialize game
function initGame() {
  const gameCanvas = document.getElementById('game-canvas');
  const gameHUD = document.getElementById('game-hud');
  
  gameCanvas.style.display = 'block';
  gameHUD.style.display = 'flex';
  
  game = new Game();
  game.loop();
}
