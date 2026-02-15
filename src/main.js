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

let gameStarted = false;

// Handle Enter key to start game
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    startGame();
  }
});

// Start game function (placeholder for your brothers to implement)
function startGame() {
  if (gameStarted) return;
  gameStarted = true;

  console.log('Game Starting...');
  // Hide title screen with fade out
  const titleScreen = document.getElementById('title-screen');
  titleScreen.style.transition = 'opacity 1s';
  titleScreen.style.opacity = '0';

  setTimeout(() => {
    titleScreen.style.display = 'none';
    canvas.style.display = 'none';
    initGame();
  }, 1000);
}

function initGame() {
  const app = document.getElementById('app');
  const gameCanvas = document.createElement('canvas');
  const gameCtx = gameCanvas.getContext('2d');
  gameCanvas.id = 'game-canvas';
  gameCanvas.width = window.innerWidth;
  gameCanvas.height = window.innerHeight;
  app.appendChild(gameCanvas);

  const keys = new Set();
  const ship = {
    size: 30,
    speed: 320,
    x: gameCanvas.width / 2 - 15,
    y: gameCanvas.height - 90
  };

  const onKeyDown = (e) => {
    const key = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
      keys.add(key);
      e.preventDefault();
    }
  };

  const onKeyUp = (e) => {
    const key = e.key.toLowerCase();
    keys.delete(key);
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  const resizeGame = () => {
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
  };

  window.addEventListener('resize', resizeGame);

  let lastTime = performance.now();

  function update(deltaSeconds) {
    let dx = 0;
    let dy = 0;

    if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
    if (keys.has('arrowright') || keys.has('d')) dx += 1;
    if (keys.has('arrowup') || keys.has('w')) dy -= 1;
    if (keys.has('arrowdown') || keys.has('s')) dy += 1;

    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy) || 1;
      ship.x += (dx / length) * ship.speed * deltaSeconds;
      ship.y += (dy / length) * ship.speed * deltaSeconds;
    }

    ship.x = Math.min(Math.max(ship.x, 0), gameCanvas.width - ship.size);
    ship.y = Math.min(Math.max(ship.y, 0), gameCanvas.height - ship.size);
  }

  function draw() {
    gameCtx.fillStyle = '#000000';
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    gameCtx.fillStyle = '#00ccff';
    gameCtx.fillRect(ship.x, ship.y, ship.size, ship.size);
  }

  function loop(now) {
    const deltaSeconds = (now - lastTime) / 1000;
    lastTime = now;
    update(deltaSeconds);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}
