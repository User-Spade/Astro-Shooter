import './style.css';
import { initGame, startGame, resetGame, getGame } from './game.js';

const canvas = document.getElementById('gameCanvas');
if (!canvas) throw new Error('gameCanvas not found');

// Initialize game module with canvas
initGame(canvas);

// UI / Screen management
function showScreen(screenId) {
  const ids = ['title-screen', 'rules-screen', 'game-screen'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === screenId) ? 'flex' : 'none';
  });
}

document.getElementById('start-button')?.addEventListener('click', () => {
  resetGame();
  startGame();
  showScreen('game-screen');
});

document.getElementById('rules-button')?.addEventListener('click', () => showScreen('rules-screen'));
document.querySelector('.back-button')?.addEventListener('click', () => showScreen('title-screen'));

// UI update loop (reads game state)
function uiLoop() {
  const g = getGame();
  if (g) {
    const p1 = document.getElementById('p1Score');
    const p1h = document.getElementById('p1Health');
    const p2 = document.getElementById('p2Score');
    const p2h = document.getElementById('p2Health');
    if (p1) p1.textContent = g.player1.score;
    if (p1h) p1h.textContent = Math.max(0, g.player1.health);
    if (p2) p2.textContent = g.player2.score;
    if (p2h) p2h.textContent = Math.max(0, g.player2.health);
  }
  requestAnimationFrame(uiLoop);
}
uiLoop();

// Show title by default
showScreen('title-screen');

// Auto-start the game by showing the game screen (useful for quick runs)
window.addEventListener('DOMContentLoaded', () => {
  const title = document.getElementById('title-screen');
  const rules = document.getElementById('rules-screen');
  const gameScreen = document.getElementById('game-screen');
  if (title) title.style.display = 'none';
  if (rules) rules.style.display = 'none';
  if (gameScreen) gameScreen.style.display = 'flex';
  game.gameRunning = true;
});
