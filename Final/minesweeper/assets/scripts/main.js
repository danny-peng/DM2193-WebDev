const boardElement = document.getElementById('game-board');
const winAlert = document.getElementById('win-alert');
const loseAlert = document.getElementById('lose-alert');
const rowInput = document.getElementById('row-input');
const colInput = document.getElementById('col-input');
const timerElement = document.getElementById('timer');
const counterElement = document.getElementById('moves');
const colorOneInput = document.getElementById('color-one');
const colorTwoInput = document.getElementById('color-two');
const highScoreContainer = document.getElementById('high-score-list');


const rangeInput = document.getElementById('spawn-rate');
const rangeOutput = document.getElementById('spawn-rate-output');

const defaultColorOne = getComputedStyle(document.documentElement).getPropertyValue('--c-grad-one').trim();
const defaultColorTwo = getComputedStyle(document.documentElement).getPropertyValue('--c-grad-two').trim();

let rows = 10;
let cols = 10;

let board = [];
let isGameOver = false;
let mineCount = 0;

// settings
const spawnRateElement = document.getElementById('spawn-rate'); 
let threshold = spawnRateElement.value;

// stats
const mineCountElement = document.getElementById('mine-count');

setInterval(() => {
    if (!isGameOver) {
        timerElement.textContent = parseInt(timerElement.textContent) + 1;
        timerElement.textContent = timerElement.textContent.padStart(3, '0');
    }
}, 1000);


rangeOutput.textContent = Math.round(rangeInput.value / 6 * 100) + '%';

rangeInput.addEventListener('input', function() {
    rangeOutput.textContent = Math.round(this.value / 6 * 100) + '%';
});

// 1. Initialize the Game
function initGame() {
    board = [];
    isGameOver = false;
    mineCount = 0;
    counterElement.textContent = '000';
    timerElement.textContent = '000';
    winAlert.classList.add('hidden');
    loseAlert.classList.add('hidden');
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    
    threshold = spawnRateElement.value;

    // Create the logical board and the HTML elements
    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < cols; c++) {
            const cellData = {
                r, c,
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            };
            row.push(cellData);
            
            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');
            cellElement.dataset.r = r;
            cellElement.dataset.c = c;
            
            // Event Listeners
            cellElement.addEventListener('click', () => {
                handleLeftClick(r, c);
                checkWin();
            });
            cellElement.addEventListener('contextmenu', (e) => {
                e.preventDefault(); // Prevent right-click menu
                handleRightClick(r, c);
            });

            boardElement.appendChild(cellElement);
        }
        board.push(row);
    }
    
    placeMines(threshold);
    calculateNeighbors();
    checkWin();
    displayHighScores();

    // console.log(board);
}

function applySettings() {
    threshold = spawnRateElement.value;
    rows = Math.max(5, Math.min(parseInt(rowInput.value), 25));
    cols = Math.max(5, Math.min(parseInt(colInput.value), 25));
    rowInput.value = rows;
    colInput.value = cols;
    applyColorSettings();

    initGame();
}

function resetSettings() {
    spawnRateElement.value = 1;
    rowInput.value = 10;
    colInput.value = 10;
    colorOneInput.value = defaultColorOne;
    colorTwoInput.value = defaultColorTwo;
    applyColorSettings();

    initGame();
}

function applyColorSettings() {
    let r = document.querySelector(':root');
    r.style.setProperty('--c-grad-one', colorOneInput.value);
    r.style.setProperty('--c-grad-two', colorTwoInput.value);
}

function getHighScores() {
    return JSON.parse(localStorage.getItem('minesweeperHighScores')) || {};
}

function saveHighScore() {
    const time = parseInt(timerElement.textContent);
    const moves = parseInt(counterElement.textContent);
    // Create a unique key for the current game mode
    const key = `${rows}x${cols}_${threshold}`; 
    
    const scores = getHighScores();
    
    if (!scores[key]) {
        scores[key] = { time: time, moves: moves };
    } else {
        // Update if the new time is lower, OR if time is tied but moves are lower
        if (time < scores[key].time || (time === scores[key].time && moves < scores[key].moves)) {
            scores[key] = { time: time, moves: moves };
        }
    }
    
    localStorage.setItem('minesweeperHighScores', JSON.stringify(scores));
    displayHighScores();
}

function clearCurrentHighScore() {
    // Get all scores
    const scores = getHighScores();
    
    // Determine the key for the current board settings
    const key = `${rows}x${cols}_${threshold}`;
    
    // If a score exists for this mode, delete it and save
    if (scores[key]) {
        delete scores[key];
        localStorage.setItem('minesweeperHighScores', JSON.stringify(scores));
        
        // Update the display immediately
        displayHighScores();
    }
}

function displayHighScores() {
    if (!highScoreContainer) return;
    const scores = getHighScores();
    const key = `${rows}x${cols}_${threshold}`;
    
    let html = `<p class="mb-2"><strong>Current Mode:<br>${rows}x${cols} Board | ${Math.round(threshold / 6 * 100)}% Rate</strong></p>`;
    
    if (scores[key]) {
        html += `<div class="d-flex justify-content-between"><span>⏱️ Best Time:</span> <strong>${scores[key].time}s</strong></div>`;
        html += `<div class="d-flex justify-content-between"><span>👆 Best Moves:</span> <strong>${scores[key].moves}</strong></div>`;
    } else {
        html += `<em>No high score for this mode yet!</em>`;
    }
    
    highScoreContainer.innerHTML = html;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function checkWin() {
    for (row of board) {
        for (cell of row) {
            if (!cell.isMine && !cell.isRevealed) {
                return false;
            }
        }
    }
    endGame(true);
    return true;
}

function endGame(win = false) {
    isGameOver = true;
    if (win) {
        winAlert.classList.remove('hidden');
        saveHighScore();
    } else {
        loseAlert.classList.remove('hidden');
    }
}

function placeMines(threshold = 1) {
    for (row of board) {
        for (cell of row) {
            cell.isMine = randomInt(1, 6) <= threshold; // chance to be a mine
            if (cell.isMine) ++mineCount;
        }
    }
    mineCountElement.textContent = mineCount;
    mineCountElement.textContent = mineCountElement.textContent.padStart(2, '0');
}

function calculateNeighbors() {
    for (row of board) {
        for (cell of row) {
            if (cell.isMine) continue;
            let count = 0;
            for (let rOffset = -1; rOffset <= 1; rOffset++) {
                for (let cOffset = -1; cOffset <= 1; cOffset++) {
                    if (rOffset === 0 && cOffset === 0) continue;
                    const targetR = cell.r + rOffset;
                    const targetC = cell.c + cOffset;
                    if (targetR >= 0 && targetR < rows && targetC >= 0 && targetC < cols) {
                        if (board[targetR][targetC].isMine) ++count;
                    }
                }
            }
            cell.neighborMines = count;
        }
    }
}

function handleLeftClick(r, c, isRecursive = false) {
    if (isGameOver || board[r][c].isRevealed || board[r][c].isFlagged) return;
    
    cell = board[r][c];
    cell.isRevealed = true;
    const cellElement = boardElement.children[r * cols + c];
    cellElement.classList.add('revealed');

    if (!cell.isMine) {
        cellElement.textContent = cell.isMine ? '💣' : (cell.neighborMines > 0 ? cell.neighborMines : '');
        cellElement.dataset.count = cell.neighborMines;

        if (cell.neighborMines === 0) {
            for (let rOffset = -1; rOffset <= 1; rOffset++) {
                for (let cOffset = -1; cOffset <= 1; cOffset++) {
                    if (rOffset === 0 && cOffset === 0) continue;
                    const targetR = r + rOffset;
                    const targetC = c + cOffset;
                    if (targetR >= 0 && targetR < rows && targetC >= 0 && targetC < cols) {
                        if (!board[targetR][targetC].isRevealed) {
                            handleLeftClick(targetR, targetC, true);
                        }
                    }
                }
            }
        }
    } else {
        cellElement.textContent = '💣';
        isGameOver = true;
        endGame(false);
        // Reveal all mines
        for (row of board) {
            for (cell of row) {
                if (cell.isMine) {
                    const mineElement = boardElement.children[cell.r * cols + cell.c];
                    mineElement.textContent = '💣';
                    mineElement.classList.add('mine');
                }
            }
        }
    }
    if (!isRecursive) {
        counterElement.textContent = parseInt(counterElement.textContent) + 1;
        counterElement.textContent = counterElement.textContent.padStart(3, '0');
    }
}

function handleRightClick(r, c) {
    if (isGameOver || board[r][c].isRevealed) return;
    
    cell = board[r][c];
    cell.isFlagged = !cell.isFlagged;
    const cellElement = boardElement.children[r * cols + c];
    if (cell.isFlagged) {
        cellElement.textContent = '🚩';
        --mineCount;
    } else {
        cellElement.textContent = '';
        ++mineCount;
    }
    mineCountElement.textContent = mineCount;
    mineCountElement.textContent = mineCountElement.textContent.padStart(2, '0');
    counterElement.textContent = parseInt(counterElement.textContent) + 1;
    counterElement.textContent = counterElement.textContent.padStart(3, '0');
}

// Start the game
initGame();