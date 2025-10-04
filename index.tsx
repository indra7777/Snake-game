/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- DOM Elements ---
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const currentScoreEl = document.getElementById('current-score')!;
const previousScoreEl = document.getElementById('previous-score')!;
const highScoreEl = document.getElementById('high-score')!;
const gameOverModal = document.getElementById('game-over-modal')!;
const finalScoreEl = document.getElementById('final-score')!;
const playAgainBtn = document.getElementById('play-again-btn')!;

// --- Game Constants ---
const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE;
const INITIAL_SNAKE_LENGTH = 3;
const GAME_SPEED_START = 120; // ms per frame
const GAME_SPEED_INCREMENT = 2; // ms faster per food eaten
const CUBE_DEPTH = 5; // For 3D effect

// --- Color Palettes ---
const SNAKE_HEAD_COLORS = {
  front: '#00e676',
  top: '#69f0ae',
  side: '#00c853',
};
const SNAKE_BODY_COLORS = {
  front: '#2ecc40',
  top: '#5edc6f',
  side: '#28a735',
};
const FOOD_COLORS = {
  front: '#ff4136',
  top: '#ff7973',
  side: '#e63a2f',
};

// --- Game State ---
let snake: { x: number; y: number }[];
let food: { x: number; y: number };
let velocity: { x: number; y: number };
let score: number;
let previousScore: number = 0;
let highScore: number;
let isGameOver: boolean;
let gameSpeed: number;
let timeoutId: number;

// --- Touch Controls State ---
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

/**
 * Initializes or resets the game state.
 */
function initializeGame() {
  // Reset game state variables
  snake = [];
  const startPos = Math.floor(TILE_COUNT / 2);
  for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
    snake.push({ x: startPos - i, y: startPos });
  }

  velocity = { x: 1, y: 0 };
  score = 0;
  isGameOver = false;
  gameSpeed = GAME_SPEED_START;

  // Load high score from local storage
  highScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
  highScoreEl.textContent = highScore.toString();
  currentScoreEl.textContent = '0';
  previousScoreEl.textContent = previousScore.toString();

  // Place initial food
  placeFood();

  // Hide game over screen
  gameOverModal.classList.add('hidden');

  // Start the game loop
  if (timeoutId) clearTimeout(timeoutId);
  gameLoop();
}

/**
 * The main loop of the game, updates and renders the game.
 */
function gameLoop() {
  if (isGameOver) {
    showGameOverScreen();
    return;
  }

  update();
  draw();

  timeoutId = setTimeout(gameLoop, gameSpeed);
}

/**
 * Updates the game state (snake position, collisions, etc.).
 */
function update() {
  const head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

  // Check for wall collision
  if (
    head.x < 0 ||
    head.x >= TILE_COUNT ||
    head.y < 0 ||
    head.y >= TILE_COUNT
  ) {
    isGameOver = true;
    return;
  }

  // Check for self collision
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      isGameOver = true;
      return;
    }
  }

  // Move snake
  snake.unshift(head);

  // Check for food collision
  if (head.x === food.x && head.y === food.y) {
    score++;
    currentScoreEl.textContent = score.toString();
    if (score > highScore) {
      highScore = score;
      highScoreEl.textContent = highScore.toString();
      localStorage.setItem('snakeHighScore', highScore.toString());
    }
    gameSpeed = Math.max(50, gameSpeed - GAME_SPEED_INCREMENT); // Increase speed, with a max speed cap
    placeFood();
  } else {
    snake.pop(); // Remove tail only if no food was eaten
  }
}

/**
 * Draws a pseudo-3D cube on the canvas.
 * @param {number} x - The canvas x-coordinate.
 * @param {number} y - The canvas y-coordinate.
 * @param {object} colors - Object with top, front, and side colors.
 */
function drawCube(x: number, y: number, colors: { top: string; front: string; side: string }) {
  const size = GRID_SIZE;
  const depth = CUBE_DEPTH;

  // Draw front face
  ctx.fillStyle = colors.front;
  ctx.fillRect(x, y, size, size);

  // Draw top face
  ctx.fillStyle = colors.top;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + depth, y - depth);
  ctx.lineTo(x + size + depth, y - depth);
  ctx.lineTo(x + size, y);
  ctx.closePath();
  ctx.fill();

  // Draw side face
  ctx.fillStyle = colors.side;
  ctx.beginPath();
  ctx.moveTo(x + size, y);
  ctx.lineTo(x + size + depth, y - depth);
  ctx.lineTo(x + size + depth, y + size - depth);
  ctx.lineTo(x + size, y + size);
  ctx.closePath();
  ctx.fill();
}

/**
 * Renders the game elements on the canvas.
 */
function draw() {
  // Clear canvas with background color
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw food
  drawCube(food.x * GRID_SIZE, food.y * GRID_SIZE, FOOD_COLORS);

  // Draw snake
  snake.forEach((segment, index) => {
    const colors = index === 0 ? SNAKE_HEAD_COLORS : SNAKE_BODY_COLORS;
    drawCube(segment.x * GRID_SIZE, segment.y * GRID_SIZE, colors);
  });
}

/**
 * Places food at a random location not occupied by the snake.
 */
function placeFood() {
  let newFoodPosition;
  do {
    newFoodPosition = {
      x: Math.floor(Math.random() * TILE_COUNT),
      y: Math.floor(Math.random() * TILE_COUNT),
    };
  } while (
    snake.some(
      (segment) =>
        segment.x === newFoodPosition.x && segment.y === newFoodPosition.y
    )
  );
  food = newFoodPosition;
}

/**
 * Shows the game over modal and updates previous score.
 */
function showGameOverScreen() {
  previousScore = score;
  finalScoreEl.textContent = score.toString();
  gameOverModal.classList.remove('hidden');
}

/**
 * Handles keyboard input for controlling the snake.
 * @param {KeyboardEvent} event - The keyboard event.
 */
function handleKeyDown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowUp':
    case 'w':
      if (velocity.y === 0) velocity = { x: 0, y: -1 };
      break;
    case 'ArrowDown':
    case 's':
      if (velocity.y === 0) velocity = { x: 0, y: 1 };
      break;
    case 'ArrowLeft':
    case 'a':
      if (velocity.x === 0) velocity = { x: -1, y: 0 };
      break;
    case 'ArrowRight':
    case 'd':
      if (velocity.x === 0) velocity = { x: 1, y: 0 };
      break;
  }
}

// --- Touch Control Handlers ---
function handleTouchStart(e: TouchEvent) {
  e.preventDefault();
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}

function handleTouchEnd(e: TouchEvent) {
  e.preventDefault();
  touchEndX = e.changedTouches[0].screenX;
  touchEndY = e.changedTouches[0].screenY;
  handleSwipe();
}

function handleSwipe() {
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Check if it's a significant swipe
  if (absDx > 20 || absDy > 20) {
    if (absDx > absDy) {
      // Horizontal swipe
      if (dx > 0 && velocity.x === 0) {
        // Right
        velocity = { x: 1, y: 0 };
      } else if (dx < 0 && velocity.x === 0) {
        // Left
        velocity = { x: -1, y: 0 };
      }
    } else {
      // Vertical swipe
      if (dy > 0 && velocity.y === 0) {
        // Down
        velocity = { x: 0, y: 1 };
      } else if (dy < 0 && velocity.y === 0) {
        // Up
        velocity = { x: 0, y: -1 };
      }
    }
  }
}

// --- Event Listeners ---
document.addEventListener('keydown', handleKeyDown);
playAgainBtn.addEventListener('click', initializeGame);

// Touch listeners
canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd, { passive: false });


// --- Start Game ---
initializeGame();
