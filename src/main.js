import './style.css';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game constants
const HALF_WIDTH = canvas.width / 2;
const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 30;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 40;
const BULLET_WIDTH = 12;
const BULLET_HEIGHT = 20;

// Player class
class Player {
  constructor(isLeft) {
    this.isLeft = isLeft;
    this.x = isLeft ? HALF_WIDTH / 2 - PLAYER_WIDTH / 2 : HALF_WIDTH + HALF_WIDTH / 2 - PLAYER_WIDTH / 2;
    this.y = canvas.height - 50;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.speed = 5;
    this.health = 100;
    this.score = 0;
    this.bullets = [];
    this.velocityX = 0;
    this.acceleration = 0.35; // How quickly the player accelerates
    this.maxSpeed = 6; // Maximum speed
    this.friction = 0.85; // Friction when not moving (0-1, lower = more friction)
    this.shootCooldown = 300; // milliseconds between shots
    this.lastShotTime = 0;
    
    // Power-up effects
    this.fireRateBoosted = false;
    this.fireRateBoostedTime = 0;
    this.bulletSizeBoosted = false;
    this.bulletSizeBoostedTime = 0;
    this.multiShotMode = false;
    this.multiShotTime = 0;
    
    // Movement tracking for progressive acceleration
    this.leftHoldTime = 0;
    this.rightHoldTime = 0;
  }

  draw() {
    ctx.fillStyle = this.isLeft ? '#00FF00' : '#FF0000';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    // Draw a triangle on top for direction
    ctx.fillStyle = this.isLeft ? '#00AA00' : '#AA0000';
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y - 5);
    ctx.lineTo(this.x, this.y);
    ctx.lineTo(this.x + this.width, this.y);
    ctx.fill();
  }

  update() {
    // Apply friction/deceleration
    this.velocityX *= this.friction;
    
    // Apply velocity to position
    this.x += this.velocityX;
    const minX = this.isLeft ? 10 : HALF_WIDTH + 10;
    const maxX = this.isLeft ? HALF_WIDTH - this.width - 10 : canvas.width - this.width - 10;
    this.x = Math.max(minX, Math.min(maxX, this.x));
  }

  shoot() {
    const now = Date.now();
    let cooldown = this.shootCooldown;
    if (this.fireRateBoosted) {
      cooldown = this.shootCooldown / 1.5; // 1.5x fire rate
    }
    
    if (now - this.lastShotTime >= cooldown) {
      const bulletSize = this.bulletSizeBoosted ? BULLET_WIDTH * 1.5 : BULLET_WIDTH;
      const bulletHeight = this.bulletSizeBoosted ? BULLET_HEIGHT * 1.5 : BULLET_HEIGHT;
      
      if (this.multiShotMode) {
        // Center bullet (straight up)
        this.bullets.push(new Bullet(this.x + this.width / 2 - bulletSize / 2, this.y, true, false, bulletSize, bulletHeight, 0, -7));
        // Left diagonal bullet
        this.bullets.push(new Bullet(this.x + 5, this.y, true, false, bulletSize, bulletHeight, -5, -5));
        // Right diagonal bullet
        this.bullets.push(new Bullet(this.x + this.width - 5 - bulletSize, this.y, true, false, bulletSize, bulletHeight, 5, -5));
      } else {
        // Normal single bullet
        this.bullets.push(new Bullet(this.x + this.width / 2 - bulletSize / 2, this.y, true, false, bulletSize, bulletHeight, 0, -7));
      }
      this.lastShotTime = now;
    }
  }
}

// Enemy class
class Enemy {
  constructor(x, y, minX, maxX) {
    this.x = x;
    this.y = y;
    this.width = ENEMY_WIDTH;
    this.height = ENEMY_HEIGHT;
    this.speedX = Math.random() * 2 - 1;
    this.speedY = 0.5;
    this.minX = minX;
    this.maxX = maxX;
  }

  draw() {
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    
    // Bounce off walls
    if (this.x < this.minX || this.x + this.width > this.maxX) {
      this.speedX *= -1;
      this.x = Math.max(this.minX, Math.min(this.maxX - this.width, this.x));
    }
  }
}

// Bullet class
class Bullet {
  constructor(x, y, isPlayerBullet, autoAim = false, customWidth = BULLET_WIDTH, customHeight = BULLET_HEIGHT, velocityX = 0, velocityY = -7) {
    this.x = x;
    this.y = y;
    this.width = customWidth;
    this.height = customHeight;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.isPlayerBullet = isPlayerBullet;
    this.autoAim = autoAim;
    this.targetEnemy = null;
  }

  draw() {
    ctx.fillStyle = this.isPlayerBullet ? '#FFFF00' : '#FF4444';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  update() {
    if (this.autoAim) {
      // Auto-aim: find target if we don't have one
      if (!this.targetEnemy || this.targetEnemy.y > canvas.height) {
        this.targetEnemy = null;
        // Find closest enemy
        let closestEnemy = null;
        let closestDistance = Infinity;
        for (const enemy of game.enemies) {
          const dx = enemy.x + enemy.width / 2 - (this.x + this.width / 2);
          const dy = enemy.y + enemy.height / 2 - (this.y + this.height / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestEnemy = enemy;
          }
        }
        this.targetEnemy = closestEnemy;
      }

      if (this.targetEnemy) {
        // Move towards target enemy
        const dx = this.targetEnemy.x + this.targetEnemy.width / 2 - (this.x + this.width / 2);
        const dy = this.targetEnemy.y + this.targetEnemy.height / 2 - (this.y + this.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const speed = 7;
          const moveX = (dx / distance) * speed;
          const moveY = (dy / distance) * speed;
          this.x += moveX;
          this.y += moveY;
        }
      } else {
        // No target, just go straight
        this.x += this.velocityX;
        this.y += this.velocityY;
      }
    } else {
      // Normal movement with velocity
      this.x += this.velocityX;
      this.y += this.velocityY;
    }
  }
}

// PowerUp class
class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.width = 45;
    this.height = 45;
    this.type = type; // 0: fire rate, 1: bullet size, 2: multi-shot
  }

  draw() {
    if (this.type === 0) {
      // Fire rate boost - blue
      ctx.fillStyle = '#00FFFF';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = '#0088FF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', this.x + this.width / 2, this.y + this.height / 2 + 5);
    } else if (this.type === 1) {
      // Bullet size boost - green
      ctx.fillStyle = '#00FF88';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = '#00AA44';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('●', this.x + this.width / 2, this.y + this.height / 2 + 5);
    } else if (this.type === 2) {
      // Multi-shot boost - orange
      ctx.fillStyle = '#FF8800';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = '#FF4400';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('▲', this.x + this.width / 2, this.y + this.height / 2 + 5);
    }
  }

  update() {
    // Power-ups are stationary
  }
}

// Game state
const game = {
  player1: new Player(true),
  player2: new Player(false),
  enemies: [],
  powerups: [],
  keys: {},
  gameRunning: true,
  enemySpawnCounter: 0,
  enemySpawnRate: 90, // Start slow: 90 frames between spawns
  minSpawnRate: 36, // Minimum: 36 frames (max safe rate for player to handle)
  gameStartTime: Date.now(),
  powerupSpawnCounter: 0,
  powerupSpawnRate: 360, // Spawn a power-up roughly every 6 seconds
  maxPowerups: 6, // Maximum number of power-ups on screen at once
};

// Collision detection
function isColliding(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

// Spawn enemies for both sides (1 enemy per side)
function spawnEnemiesForSide(isLeftSide) {
  if (isLeftSide) {
    const x = 50 + Math.random() * (HALF_WIDTH - 100);
    game.enemies.push(new Enemy(x, 20, 10, HALF_WIDTH - 10));
  } else {
    const x = HALF_WIDTH + 50 + Math.random() * (HALF_WIDTH - 100);
    game.enemies.push(new Enemy(x, 20, HALF_WIDTH + 10, canvas.width - 10));
  }
}

// Spawn power-ups for both sides
function spawnPowerUpsForSide(isLeftSide) {
  // Don't spawn if we've reached max power-ups
  if (game.powerups.length >= game.maxPowerups) {
    return;
  }
  
  const type = Math.floor(Math.random() * 3); // Random type: 0, 1, or 2
  let x, y;
  let validSpawn = false;
  let attempts = 0;
  
  // Try to find a spawn location far from existing power-ups
  while (!validSpawn && attempts < 10) {
    if (isLeftSide) {
      x = 20 + Math.random() * (HALF_WIDTH - 40); // Full width with margins
      y = canvas.height / 2 + Math.random() * (canvas.height / 2 - 100); // Below middle, above player
    } else {
      x = HALF_WIDTH + 20 + Math.random() * (HALF_WIDTH - 40);
      y = canvas.height / 2 + Math.random() * (canvas.height / 2 - 100);
    }
    
    // Check distance from existing power-ups on this side
    validSpawn = true;
    for (const powerup of game.powerups) {
      const isExistingOnLeftSide = powerup.x < HALF_WIDTH;
      const isNewOnLeftSide = isLeftSide;
      
      // Only check distance against power-ups on the same side
      if (isExistingOnLeftSide === isNewOnLeftSide) {
        const dx = powerup.x - x;
        const dy = powerup.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Minimum distance of 150 pixels
        if (distance < 150) {
          validSpawn = false;
          break;
        }
      }
    }
    
    attempts++;
  }
  
  // Spawn even if we couldn't find ideal location after 10 tries
  game.powerups.push(new PowerUp(x, y, type));
}

// Update game state
function update() {
  // Player 1 controls (A/D to move, W to shoot)
  if (game.keys['a'] || game.keys['A']) {
    game.player1.leftHoldTime += 16; // Roughly 60fps
    const accelerationMultiplier = Math.min(1 + (game.player1.leftHoldTime / 1200), 1.8); // Max 1.8x acceleration after 1.2s
    const adjustedAcceleration = game.player1.acceleration * accelerationMultiplier;
    game.player1.velocityX = Math.max(game.player1.velocityX - adjustedAcceleration, -game.player1.maxSpeed);
  } else {
    game.player1.leftHoldTime = 0;
  }
  
  if (game.keys['d'] || game.keys['D']) {
    game.player1.rightHoldTime += 16;
    const accelerationMultiplier = Math.min(1 + (game.player1.rightHoldTime / 1200), 1.8);
    const adjustedAcceleration = game.player1.acceleration * accelerationMultiplier;
    game.player1.velocityX = Math.min(game.player1.velocityX + adjustedAcceleration, game.player1.maxSpeed);
  } else {
    game.player1.rightHoldTime = 0;
  }
  
  if (game.keys['w'] || game.keys['W']) game.player1.shoot();

  // Player 2 controls (Arrow Left/Right to move, Up arrow to shoot)
  if (game.keys['ArrowLeft']) {
    game.player2.leftHoldTime += 16;
    const accelerationMultiplier = Math.min(1 + (game.player2.leftHoldTime / 1200), 1.8);
    const adjustedAcceleration = game.player2.acceleration * accelerationMultiplier;
    game.player2.velocityX = Math.max(game.player2.velocityX - adjustedAcceleration, -game.player2.maxSpeed);
  } else {
    game.player2.leftHoldTime = 0;
  }
  
  if (game.keys['ArrowRight']) {
    game.player2.rightHoldTime += 16;
    const accelerationMultiplier = Math.min(1 + (game.player2.rightHoldTime / 1200), 1.8);
    const adjustedAcceleration = game.player2.acceleration * accelerationMultiplier;
    game.player2.velocityX = Math.min(game.player2.velocityX + adjustedAcceleration, game.player2.maxSpeed);
  } else {
    game.player2.rightHoldTime = 0;
  }
  
  if (game.keys['ArrowUp']) game.player2.shoot();

  game.player1.update();
  game.player2.update();

  // Spawn enemies after 1 second has passed with progressive difficulty
  const timeSinceStart = Date.now() - game.gameStartTime;
  if (timeSinceStart >= 1000) {
    // Progressive difficulty: decrease spawn rate (faster spawning) over time
    // Decreases by 1 frame every 5 seconds, down to minSpawnRate
    const difficulty = Math.floor((timeSinceStart - 1000) / 5000);
    game.enemySpawnRate = Math.max(game.minSpawnRate, 90 - difficulty);
    
    game.enemySpawnCounter++;
    if (game.enemySpawnCounter >= game.enemySpawnRate) {
      spawnEnemiesForSide(true);
      spawnEnemiesForSide(false);
      game.enemySpawnCounter = 0;
    }

    // Spawn power-ups
    game.powerupSpawnCounter++;
    if (game.powerupSpawnCounter >= game.powerupSpawnRate) {
      spawnPowerUpsForSide(true);
      spawnPowerUpsForSide(false);
      game.powerupSpawnCounter = 0;
    }
  }

  // Update power-up timers
  if (game.player1.fireRateBoosted && Date.now() - game.player1.fireRateBoostedTime > 10000) {
    game.player1.fireRateBoosted = false;
  }
  if (game.player1.bulletSizeBoosted && Date.now() - game.player1.bulletSizeBoostedTime > 10000) {
    game.player1.bulletSizeBoosted = false;
  }
  if (game.player1.multiShotMode && Date.now() - game.player1.multiShotTime > 10000) {
    game.player1.multiShotMode = false;
  }
  
  if (game.player2.fireRateBoosted && Date.now() - game.player2.fireRateBoostedTime > 10000) {
    game.player2.fireRateBoosted = false;
  }
  if (game.player2.bulletSizeBoosted && Date.now() - game.player2.bulletSizeBoostedTime > 10000) {
    game.player2.bulletSizeBoosted = false;
  }
  if (game.player2.multiShotMode && Date.now() - game.player2.multiShotTime > 10000) {
    game.player2.multiShotMode = false;
  }

  // Update and check enemies
  for (let i = game.enemies.length - 1; i >= 0; i--) {
    const enemy = game.enemies[i];
    enemy.update();

    // Check if enemy is in left or right side
    const isEnemyLeft = enemy.x < HALF_WIDTH;
    const player = isEnemyLeft ? game.player1 : game.player2;

    // Remove enemy if out of bounds or reached the defense line
    if (enemy.y > canvas.height || 
        (isEnemyLeft && (enemy.x < 0 || enemy.x > HALF_WIDTH)) ||
        (!isEnemyLeft && (enemy.x < HALF_WIDTH || enemy.x > canvas.width))) {
      // Enemy reached bottom - just remove it (disabled ending game for now)
      game.enemies.splice(i, 1);
      continue;
    }

    // Check collision with player
    if (isColliding(enemy, player)) {
      player.health -= 5;
      game.enemies.splice(i, 1);
      continue;
    }
  }

  // Update and check bullets for player 1
  for (let i = game.player1.bullets.length - 1; i >= 0; i--) {
    const bullet = game.player1.bullets[i];
    bullet.update();

    if (bullet.y < 0 || bullet.x > HALF_WIDTH) {
      game.player1.bullets.splice(i, 1);
      continue;
    }

    // Check collision with enemies on left side
    for (let j = game.enemies.length - 1; j >= 0; j--) {
      if (game.enemies[j].x < HALF_WIDTH && isColliding(bullet, game.enemies[j])) {
        game.player1.score += 10;
        game.enemies.splice(j, 1);
        game.player1.bullets.splice(i, 1);
        break;
      }
    }
  }

  // Update and check bullets for player 2
  for (let i = game.player2.bullets.length - 1; i >= 0; i--) {
    const bullet = game.player2.bullets[i];
    bullet.update();

    if (bullet.y < 0 || bullet.x < HALF_WIDTH) {
      game.player2.bullets.splice(i, 1);
      continue;
    }

    // Check collision with enemies on right side
    for (let j = game.enemies.length - 1; j >= 0; j--) {
      if (game.enemies[j].x >= HALF_WIDTH && isColliding(bullet, game.enemies[j])) {
        game.player2.score += 10;
        game.enemies.splice(j, 1);
        game.player2.bullets.splice(i, 1);
        break;
      }
    }
  }

  // Check power-up collisions with bullets
  for (let i = game.powerups.length - 1; i >= 0; i--) {
    const powerup = game.powerups[i];
    let hitByPlayer = null;

    // Check player 1 bullets
    for (let j = game.player1.bullets.length - 1; j >= 0; j--) {
      if (powerup.x < HALF_WIDTH && isColliding(game.player1.bullets[j], powerup)) {
        hitByPlayer = game.player1;
        game.player1.bullets.splice(j, 1);
        break;
      }
    }

    // Check player 2 bullets
    if (!hitByPlayer) {
      for (let j = game.player2.bullets.length - 1; j >= 0; j--) {
        if (powerup.x >= HALF_WIDTH && isColliding(game.player2.bullets[j], powerup)) {
          hitByPlayer = game.player2;
          game.player2.bullets.splice(j, 1);
          break;
        }
      }
    }

    // Apply power-up effect
    if (hitByPlayer) {
      const now = Date.now();
      if (powerup.type === 0) {
        // Fire rate boost
        hitByPlayer.fireRateBoosted = true;
        hitByPlayer.fireRateBoostedTime = now;
      } else if (powerup.type === 1) {
        // Bullet size boost
        hitByPlayer.bulletSizeBoosted = true;
        hitByPlayer.bulletSizeBoostedTime = now;
      } else if (powerup.type === 2) {
        // Multi-shot mode
        hitByPlayer.multiShotMode = true;
        hitByPlayer.multiShotTime = now;
      }
      game.powerups.splice(i, 1);
    }
  }

  // Check if any player died
  if (game.player1.health <= 0 || game.player2.health <= 0) {
    game.gameRunning = false;
  }
}

// Draw game
function draw() {
  // Clear canvas
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw divider line
  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(HALF_WIDTH, 0);
  ctx.lineTo(HALF_WIDTH, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw left half background
  ctx.fillStyle = 'rgba(0, 255, 0, 0.05)';
  ctx.fillRect(0, 0, HALF_WIDTH, canvas.height);

  // Draw right half background
  ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
  ctx.fillRect(HALF_WIDTH, 0, HALF_WIDTH, canvas.height);

  // Draw players
  game.player1.draw();
  game.player2.draw();

  // Draw enemies
  game.enemies.forEach(enemy => enemy.draw());

  // Draw power-ups
  game.powerups.forEach(powerup => powerup.draw());

  // Draw bullets
  game.player1.bullets.forEach(bullet => bullet.draw());
  game.player2.bullets.forEach(bullet => bullet.draw());

  // Game over screen
  if (!game.gameRunning) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    if (game.player1.health <= 0 && game.player2.health <= 0) {
      ctx.fillText('TIE GAME!', canvas.width / 2, canvas.height / 2);
    } else if (game.player1.health > game.player2.health) {
      ctx.fillText('Player 1 Wins!', canvas.width / 2, canvas.height / 2);
    } else {
      ctx.fillText('Player 2 Wins!', canvas.width / 2, canvas.height / 2);
    }
    ctx.font = '24px Arial';
    ctx.fillText(`P1: ${game.player1.score} | P2: ${game.player2.score}`, canvas.width / 2, canvas.height / 2 + 50);
    ctx.fillText('Refresh to play again', canvas.width / 2, canvas.height / 2 + 100);
  }
}

// Update UI
function updateUI() {
  document.getElementById('p1Score').textContent = game.player1.score;
  document.getElementById('p1Health').textContent = Math.max(0, game.player1.health);
  document.getElementById('p2Score').textContent = game.player2.score;
  document.getElementById('p2Health').textContent = Math.max(0, game.player2.health);
}

// Event listeners
window.addEventListener('keydown', (e) => {
  game.keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
  game.keys[e.key] = false;
});

// Handle window resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Disable space bar scrolling
window.addEventListener('keydown', (e) => {
  if (e.key === ' ') e.preventDefault();
});

// Game loop
function gameLoop() {
  if (game.gameRunning) {
    update();
  }
  draw();
  updateUI();
  requestAnimationFrame(gameLoop);
}

gameLoop();
