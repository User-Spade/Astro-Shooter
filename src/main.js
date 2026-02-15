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

// Handle Enter key to start game
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    startGame();
  }
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
