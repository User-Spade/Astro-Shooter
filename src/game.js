// Dedicated game logic module
let canvas, ctx;

// Game constants
const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 30;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 40;
const BULLET_WIDTH = 12;
const BULLET_HEIGHT = 20;

// Module-scoped game state
let game = null;
let animationId = null;

class Player {
  constructor(isLeft) {
    this.isLeft = isLeft;
    this.x = 0;
    this.y = 0;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.speed = 5;
    this.health = 100;
    this.score = 0;
    this.bullets = [];
    this.velocityX = 0;
    this.acceleration = 0.35;
    this.maxSpeed = 6;
    this.friction = 0.85;
    this.shootCooldown = 300;
    this.lastShotTime = 0;

    this.fireRateBoosted = false;
    this.fireRateBoostedTime = 0;
    this.bulletSizeBoosted = false;
    this.bulletSizeBoostedTime = 0;
    this.multiShotMode = false;
    this.multiShotTime = 0;

    this.leftHoldTime = 0;
    this.rightHoldTime = 0;
  }

  draw() {
    ctx.fillStyle = this.isLeft ? '#00FF00' : '#FF0000';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = this.isLeft ? '#00AA00' : '#AA0000';
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y - 5);
    ctx.lineTo(this.x, this.y);
    ctx.lineTo(this.x + this.width, this.y);
    ctx.fill();
  }

  update() {
    this.velocityX *= this.friction;
    this.x += this.velocityX;
    const HALF_WIDTH = canvas.width / 2;
    const minX = this.isLeft ? 10 : HALF_WIDTH + 10;
    const maxX = this.isLeft ? HALF_WIDTH - this.width - 10 : canvas.width - this.width - 10;
    this.x = Math.max(minX, Math.min(maxX, this.x));
  }

  shoot() {
    const now = Date.now();
    let cooldown = this.shootCooldown;
    if (this.fireRateBoosted) cooldown = this.shootCooldown / 1.5;
    if (now - this.lastShotTime >= cooldown) {
      const bulletSize = this.bulletSizeBoosted ? BULLET_WIDTH * 1.5 : BULLET_WIDTH;
      const bulletHeight = this.bulletSizeBoosted ? BULLET_HEIGHT * 1.5 : BULLET_HEIGHT;
      if (this.multiShotMode) {
        this.bullets.push(new Bullet(this.x + this.width / 2 - bulletSize / 2, this.y, true, false, bulletSize, bulletHeight, 0, -7));
        this.bullets.push(new Bullet(this.x + 5, this.y, true, false, bulletSize, bulletHeight, -5, -5));
        this.bullets.push(new Bullet(this.x + this.width - 5 - bulletSize, this.y, true, false, bulletSize, bulletHeight, 5, -5));
      } else {
        this.bullets.push(new Bullet(this.x + this.width / 2 - bulletSize / 2, this.y, true, false, bulletSize, bulletHeight, 0, -7));
      }
      this.lastShotTime = now;
    }
  }
}

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
    if (this.x < this.minX || this.x + this.width > this.maxX) {
      this.speedX *= -1;
      this.x = Math.max(this.minX, Math.min(this.maxX - this.width, this.x));
    }
  }
}

class Bullet {
  constructor(x, y, isPlayerBullet, autoAim = false, customWidth = BULLET_WIDTH, customHeight = BULLET_HEIGHT, velocityX = 0, velocityY = -7) {
    this.x = x; this.y = y; this.width = customWidth; this.height = customHeight;
    this.velocityX = velocityX; this.velocityY = velocityY; this.isPlayerBullet = isPlayerBullet;
    this.autoAim = autoAim; this.targetEnemy = null;
  }
  draw() { ctx.fillStyle = this.isPlayerBullet ? '#FFFF00' : '#FF4444'; ctx.fillRect(this.x, this.y, this.width, this.height); }
  update() {
    if (this.autoAim) {
      if (!this.targetEnemy || this.targetEnemy.y > canvas.height) {
        this.targetEnemy = null; let closestEnemy = null; let closestDistance = Infinity;
        for (const enemy of game.enemies) {
          const dx = enemy.x + enemy.width / 2 - (this.x + this.width / 2);
          const dy = enemy.y + enemy.height / 2 - (this.y + this.height / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < closestDistance) { closestDistance = distance; closestEnemy = enemy; }
        }
        this.targetEnemy = closestEnemy;
      }
      if (this.targetEnemy) {
        const dx = this.targetEnemy.x + this.targetEnemy.width / 2 - (this.x + this.width / 2);
        const dy = this.targetEnemy.y + this.targetEnemy.height / 2 - (this.y + this.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
          const speed = 7; const moveX = (dx / distance) * speed; const moveY = (dy / distance) * speed;
          this.x += moveX; this.y += moveY;
        }
      } else { this.x += this.velocityX; this.y += this.velocityY; }
    } else { this.x += this.velocityX; this.y += this.velocityY; }
  }
}

class PowerUp {
  constructor(x, y, type) { this.x = x; this.y = y; this.width = 45; this.height = 45; this.type = type; }
  draw() {
    if (this.type === 0) { ctx.fillStyle = '#00FFFF'; ctx.fillRect(this.x, this.y, this.width, this.height); ctx.fillStyle = '#0088FF'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.fillText('⚡', this.x + this.width / 2, this.y + this.height / 2 + 5); }
    else if (this.type === 1) { ctx.fillStyle = '#00FF88'; ctx.fillRect(this.x, this.y, this.width, this.height); ctx.fillStyle = '#00AA44'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.fillText('●', this.x + this.width / 2, this.y + this.height / 2 + 5); }
    else if (this.type === 2) { ctx.fillStyle = '#FF8800'; ctx.fillRect(this.x, this.y, this.width, this.height); ctx.fillStyle = '#FF4400'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.fillText('▲', this.x + this.width / 2, this.y + this.height / 2 + 5); }
  }
  update() {}
}

function isColliding(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
}

function spawnEnemiesForSide(isLeftSide) {
  const HALF_WIDTH = canvas.width / 2;
  if (isLeftSide) { const x = 50 + Math.random() * (HALF_WIDTH - 100); game.enemies.push(new Enemy(x, 20, 10, HALF_WIDTH - 10)); }
  else { const x = HALF_WIDTH + 50 + Math.random() * (HALF_WIDTH - 100); game.enemies.push(new Enemy(x, 20, HALF_WIDTH + 10, canvas.width - 10)); }
}

function spawnPowerUpsForSide(isLeftSide) {
  if (game.powerups.length >= game.maxPowerups) return;
  const type = Math.floor(Math.random() * 3);
  let x, y; let validSpawn = false; let attempts = 0; const HALF_WIDTH = canvas.width / 2;
  while (!validSpawn && attempts < 10) {
    if (isLeftSide) { x = 20 + Math.random() * (HALF_WIDTH - 40); y = canvas.height / 2 + Math.random() * (canvas.height / 2 - 100); }
    else { x = HALF_WIDTH + 20 + Math.random() * (HALF_WIDTH - 40); y = canvas.height / 2 + Math.random() * (canvas.height / 2 - 100); }
    validSpawn = true;
    for (const powerup of game.powerups) {
      const isExistingOnLeftSide = powerup.x < HALF_WIDTH; const isNewOnLeftSide = isLeftSide;
      if (isExistingOnLeftSide === isNewOnLeftSide) {
        const dx = powerup.x - x; const dy = powerup.y - y; const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 150) { validSpawn = false; break; }
      }
    }
    attempts++;
  }
  game.powerups.push(new PowerUp(x, y, type));
}

function createInitialGameState() {
  return {
    player1: new Player(true),
    player2: new Player(false),
    enemies: [],
    powerups: [],
    keys: {},
    gameRunning: false,
    enemySpawnCounter: 0,
    enemySpawnRate: 90,
    minSpawnRate: 36,
    gameStartTime: Date.now(),
    powerupSpawnCounter: 0,
    powerupSpawnRate: 360,
    maxPowerups: 6,
  };
}

function initGame(canvasEl) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  game = createInitialGameState();
  // position players
  const HALF_WIDTH = canvas.width / 2;
  game.player1.x = HALF_WIDTH / 2 - PLAYER_WIDTH / 2; game.player1.y = canvas.height - 50;
  game.player2.x = HALF_WIDTH + HALF_WIDTH / 2 - PLAYER_WIDTH / 2; game.player2.y = canvas.height - 50;

  window.addEventListener('keydown', (e) => { game.keys[e.key] = true; if (e.key === ' ') e.preventDefault(); });
  window.addEventListener('keyup', (e) => { game.keys[e.key] = false; });
  window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });

  // start main loop
  if (!animationId) {
    (function loop() { update(); draw(); animationId = requestAnimationFrame(loop); })();
  }
}

function resetGame() {
  if (!game) return;
  game = createInitialGameState();
  const HALF_WIDTH = canvas.width / 2;
  game.player1.x = HALF_WIDTH / 2 - PLAYER_WIDTH / 2; game.player1.y = canvas.height - 50;
  game.player2.x = HALF_WIDTH + HALF_WIDTH / 2 - PLAYER_WIDTH / 2; game.player2.y = canvas.height - 50;
}

function startGame() {
  if (!game) return;
  game.gameRunning = true; game.gameStartTime = Date.now(); game.enemySpawnCounter = 0; game.powerupSpawnCounter = 0;
}

function stopGame() { if (game) game.gameRunning = false; }

function update() {
  if (!game || !game.gameRunning) return;
  // Player input
  if (game.keys['a'] || game.keys['A']) { game.player1.leftHoldTime += 16; const acc = Math.min(1 + (game.player1.leftHoldTime / 1200), 1.8) * game.player1.acceleration; game.player1.velocityX = Math.max(game.player1.velocityX - acc, -game.player1.maxSpeed); } else game.player1.leftHoldTime = 0;
  if (game.keys['d'] || game.keys['D']) { game.player1.rightHoldTime += 16; const acc = Math.min(1 + (game.player1.rightHoldTime / 1200), 1.8) * game.player1.acceleration; game.player1.velocityX = Math.min(game.player1.velocityX + acc, game.player1.maxSpeed); } else game.player1.rightHoldTime = 0;
  if (game.keys['w'] || game.keys['W']) game.player1.shoot();
  if (game.keys['ArrowLeft']) { game.player2.leftHoldTime += 16; const acc = Math.min(1 + (game.player2.leftHoldTime / 1200), 1.8) * game.player2.acceleration; game.player2.velocityX = Math.max(game.player2.velocityX - acc, -game.player2.maxSpeed); } else game.player2.leftHoldTime = 0;
  if (game.keys['ArrowRight']) { game.player2.rightHoldTime += 16; const acc = Math.min(1 + (game.player2.rightHoldTime / 1200), 1.8) * game.player2.acceleration; game.player2.velocityX = Math.min(game.player2.velocityX + acc, game.player2.maxSpeed); } else game.player2.rightHoldTime = 0;
  if (game.keys['ArrowUp']) game.player2.shoot();

  game.player1.update(); game.player2.update();

  const timeSinceStart = Date.now() - game.gameStartTime;
  if (timeSinceStart >= 1000) {
    const difficulty = Math.floor((timeSinceStart - 1000) / 5000);
    game.enemySpawnRate = Math.max(game.minSpawnRate, 90 - difficulty);
    game.enemySpawnCounter++;
    if (game.enemySpawnCounter >= game.enemySpawnRate) { spawnEnemiesForSide(true); spawnEnemiesForSide(false); game.enemySpawnCounter = 0; }
    game.powerupSpawnCounter++; if (game.powerupSpawnCounter >= game.powerupSpawnRate) { spawnPowerUpsForSide(true); spawnPowerUpsForSide(false); game.powerupSpawnCounter = 0; }
  }

  // powerup timers
  if (game.player1.fireRateBoosted && Date.now() - game.player1.fireRateBoostedTime > 10000) game.player1.fireRateBoosted = false;
  if (game.player1.bulletSizeBoosted && Date.now() - game.player1.bulletSizeBoostedTime > 10000) game.player1.bulletSizeBoosted = false;
  if (game.player1.multiShotMode && Date.now() - game.player1.multiShotTime > 10000) game.player1.multiShotMode = false;
  if (game.player2.fireRateBoosted && Date.now() - game.player2.fireRateBoostedTime > 10000) game.player2.fireRateBoosted = false;
  if (game.player2.bulletSizeBoosted && Date.now() - game.player2.bulletSizeBoostedTime > 10000) game.player2.bulletSizeBoosted = false;
  if (game.player2.multiShotMode && Date.now() - game.player2.multiShotTime > 10000) game.player2.multiShotMode = false;

  // update enemies
  for (let i = game.enemies.length - 1; i >= 0; i--) {
    const enemy = game.enemies[i]; enemy.update(); const isEnemyLeft = enemy.x < canvas.width / 2; const player = isEnemyLeft ? game.player1 : game.player2;
    if (enemy.y > canvas.height || (isEnemyLeft && (enemy.x < 0 || enemy.x > canvas.width / 2)) || (!isEnemyLeft && (enemy.x < canvas.width / 2 || enemy.x > canvas.width))) { game.enemies.splice(i, 1); continue; }
    if (isColliding(enemy, player)) { player.health -= 5; game.enemies.splice(i, 1); continue; }
  }

  // update bullets and collisions
  for (let i = game.player1.bullets.length - 1; i >= 0; i--) {
    const bullet = game.player1.bullets[i]; bullet.update(); if (bullet.y < 0 || bullet.x > canvas.width / 2) { game.player1.bullets.splice(i, 1); continue; }
    for (let j = game.enemies.length - 1; j >= 0; j--) { if (game.enemies[j].x < canvas.width / 2 && isColliding(bullet, game.enemies[j])) { game.player1.score += 10; game.enemies.splice(j, 1); game.player1.bullets.splice(i, 1); break; } }
  }
  for (let i = game.player2.bullets.length - 1; i >= 0; i--) {
    const bullet = game.player2.bullets[i]; bullet.update(); if (bullet.y < 0 || bullet.x < canvas.width / 2) { game.player2.bullets.splice(i, 1); continue; }
    for (let j = game.enemies.length - 1; j >= 0; j--) { if (game.enemies[j].x >= canvas.width / 2 && isColliding(bullet, game.enemies[j])) { game.player2.score += 10; game.enemies.splice(j, 1); game.player2.bullets.splice(i, 1); break; } }
  }

  for (let i = game.powerups.length - 1; i >= 0; i--) {
    const powerup = game.powerups[i]; let hitByPlayer = null;
    for (let j = game.player1.bullets.length - 1; j >= 0; j--) { if (powerup.x < canvas.width / 2 && isColliding(game.player1.bullets[j], powerup)) { hitByPlayer = game.player1; game.player1.bullets.splice(j, 1); break; } }
    if (!hitByPlayer) { for (let j = game.player2.bullets.length - 1; j >= 0; j--) { if (powerup.x >= canvas.width / 2 && isColliding(game.player2.bullets[j], powerup)) { hitByPlayer = game.player2; game.player2.bullets.splice(j, 1); break; } } }
    if (hitByPlayer) { const now = Date.now(); if (powerup.type === 0) { hitByPlayer.fireRateBoosted = true; hitByPlayer.fireRateBoostedTime = now; } else if (powerup.type === 1) { hitByPlayer.bulletSizeBoosted = true; hitByPlayer.bulletSizeBoostedTime = now; } else if (powerup.type === 2) { hitByPlayer.multiShotMode = true; hitByPlayer.multiShotTime = now; } game.powerups.splice(i, 1); }
  }

  if (game.player1.health <= 0 || game.player2.health <= 0) game.gameRunning = false;
}

function draw() {
  if (!canvas || !ctx) return;
  ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const HALF = canvas.width / 2;
  ctx.strokeStyle = '#00FF00'; ctx.lineWidth = 3; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(HALF, 0); ctx.lineTo(HALF, canvas.height); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(0,255,0,0.05)'; ctx.fillRect(0,0,HALF,canvas.height); ctx.fillStyle = 'rgba(255,0,0,0.05)'; ctx.fillRect(HALF,0,HALF,canvas.height);
  game.player1.draw(); game.player2.draw(); game.enemies.forEach(e => e.draw()); game.powerups.forEach(p => p.draw()); game.player1.bullets.forEach(b => b.draw()); game.player2.bullets.forEach(b => b.draw());
  if (!game.gameRunning) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 48px Arial'; ctx.textAlign = 'center';
    if (game.player1.health <= 0 && game.player2.health <= 0) ctx.fillText('TIE GAME!', canvas.width/2, canvas.height/2);
    else if (game.player1.health > game.player2.health) ctx.fillText('Player 1 Wins!', canvas.width/2, canvas.height/2);
    else ctx.fillText('Player 2 Wins!', canvas.width/2, canvas.height/2);
    ctx.font = '24px Arial'; ctx.fillText(`P1: ${game.player1.score} | P2: ${game.player2.score}`, canvas.width/2, canvas.height/2 + 50);
  }
}

function getGame() { return game; }

export { initGame, startGame, stopGame, resetGame, getGame };
