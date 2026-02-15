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

// Resume audio context on first user interaction (browser security requirement)
document.addEventListener('click', () => {
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}, { once: true });

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

sfxSlider.addEventListener('change', playHoverSound);

// Music Volume slider
const musicSlider = document.getElementById('music-volume');
const musicValue = document.getElementById('music-value');

musicSlider.addEventListener('input', (e) => {
  const value = e.target.value;
  gameSettings.musicVolume = value / 100;
  musicValue.textContent = `${value}%`;
  // Your brothers can use gameSettings.musicVolume for their music volume
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
