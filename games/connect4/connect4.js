// =========================
// LOAD SETTINGS FROM HUB
// =========================

const savedTheme = localStorage.getItem("theme") || "wooden";
const savedMode = localStorage.getItem("mode") || "local";
const savedBotDifficulty = localStorage.getItem("botDifficulty") || "random";

document.body.className = savedTheme;


// =========================
// GAME VARIABLES
// =========================

const rows = 6;
const columns = 7;

let board = [
    ["", "", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["", "", "", "", "", "", ""]
];

let currentPlayer = "player1";
let gameOver = false;


// =========================
// CREATE BOARD
// =========================

function createBoard() {
    const boardDiv = document.getElementById("board");

    boardDiv.innerHTML = "";

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const cell = document.createElement("div");

            cell.classList.add("cell");

            if (board[row][col] === "player1") {
                cell.classList.add("player-one-piece");
            }

            if (board[row][col] === "player2") {
                cell.classList.add("player-two-piece");
            }

            cell.onclick = function () {
                makeMove(col);
            };

            boardDiv.appendChild(cell);
        }
    }
}


// =========================
// MAKE MOVE
// =========================

function makeMove(col) {
    if (gameOver === true) {
        return;
    }

    if (savedMode === "bot" && currentPlayer === "player2") {
        return;
    }

    const row = getLowestEmptyRow(col);

    if (row === null) {
        return;
    }

    board[row][col] = currentPlayer;

    checkGame();

    if (gameOver === false) {
        switchPlayer();
    }

    createBoard();

    if (savedMode === "bot" && currentPlayer === "player2" && gameOver === false) {
        setTimeout(botMove, 400);
    }
}


// =========================
// GET LOWEST EMPTY ROW
// =========================

function getLowestEmptyRow(col) {
    for (let row = rows - 1; row >= 0; row--) {
        if (board[row][col] === "") {
            return row;
        }
    }

    return null;
}


// =========================
// SWITCH PLAYER
// =========================

function switchPlayer() {
    if (currentPlayer === "player1") {
        currentPlayer = "player2";
    } else {
        currentPlayer = "player1";
    }

    updateMessage();
}


// =========================
// UPDATE MESSAGE
// =========================

function updateMessage() {
    if (savedMode === "bot" && currentPlayer === "player2") {
        document.getElementById("message").textContent = "Bot's turn";
    } else if (savedMode === "bot" && currentPlayer === "player1") {
        document.getElementById("message").textContent = "Your turn";
    } else if (currentPlayer === "player1") {
        document.getElementById("message").textContent = "Player 1's turn";
    } else {
        document.getElementById("message").textContent = "Player 2's turn";
    }
}


// =========================
// BOT MOVE
// =========================

function botMove() {
    if (gameOver === true) {
        return;
    }

    let move;

    if (savedBotDifficulty === "random") {
        move = getRandomMove();
    } else if (savedBotDifficulty === "winning") {
        move = getWinningMoveBotMove();
    } else if (savedBotDifficulty === "smart") {
        move = getSmartMove();
    } else if (savedBotDifficulty === "optimal") {
        move = getOptimalMove();
    } else {
        move = getSmartMove();
    }

    if (move === null) {
        return;
    }

    const row = getLowestEmptyRow(move);

    board[row][move] = "player2";

    checkGame();

    if (gameOver === false) {
        switchPlayer();
    }

    createBoard();
}


// =========================
// RANDOM BOT
// =========================

function getRandomMove() {
    let validColumns = getValidColumns();

    if (validColumns.length === 0) {
        return null;
    }

    const randomIndex = Math.floor(Math.random() * validColumns.length);

    return validColumns[randomIndex];
}


// =========================
// GET VALID COLUMNS
// =========================

function getValidColumns() {
    let validColumns = [];

    for (let col = 0; col < columns; col++) {
        if (getLowestEmptyRow(col) !== null) {
            validColumns.push(col);
        }
    }

    return validColumns;
}


// =========================
// WINNING MOVE BOT
// =========================

function getWinningMoveBotMove() {
    let winningMove = findWinningColumn("player2");

    if (winningMove !== null) {
        return winningMove;
    }

    let blockingMove = findWinningColumn("player1");

    if (blockingMove !== null) {
        return blockingMove;
    }

    return getRandomMove();
}


// =========================
// SMART BOT
// =========================

function getSmartMove() {
    let winningMove = findWinningColumn("player2");

    if (winningMove !== null) {
        return winningMove;
    }

    let blockingMove = findWinningColumn("player1");

    if (blockingMove !== null) {
        return blockingMove;
    }

    let validColumns = getValidColumns();

    if (validColumns.length === 0) {
        return null;
    }

    let bestScore = -Infinity;
    let bestColumns = [];

    for (let col of validColumns) {
        const row = getLowestEmptyRow(col);

        board[row][col] = "player2";

        let score = scoreBoardPosition("player2");

        board[row][col] = "";

        if (score > bestScore) {
            bestScore = score;
            bestColumns = [col];
        } else if (score === bestScore) {
            bestColumns.push(col);
        }
    }

    const randomIndex = Math.floor(Math.random() * bestColumns.length);

    return bestColumns[randomIndex];
}

// =========================
// OPTIMAL BOT
// =========================

function getOptimalMove() {
    let winningMove = findWinningColumn("player2");

    if (winningMove !== null) {
        return winningMove;
    }

    let blockingMove = findWinningColumn("player1");

    if (blockingMove !== null) {
        return blockingMove;
    }

    const depth = 6;

    let bestScore = -Infinity;
    let bestMove = null;

    const validColumns = getOrderedValidColumns();

    for (let col of validColumns) {
        const row = getLowestEmptyRow(col);

        board[row][col] = "player2";

        let score = minimax(depth - 1, false, -Infinity, Infinity);

        board[row][col] = "";

        if (score > bestScore) {
            bestScore = score;
            bestMove = col;
        }
    }

    if (bestMove === null) {
        return getSmartMove();
    }

    return bestMove;
}

// =========================
// MINIMAX WITH ALPHA-BETA PRUNING
// =========================

function minimax(depth, isMaximising, alpha, beta) {
    if (checkWinner("player2") === true) {
        return 100000 + depth;
    }

    if (checkWinner("player1") === true) {
        return -100000 - depth;
    }

    if (boardIsFull() === true || depth === 0) {
        return evaluateBoard();
    }

    const validColumns = getOrderedValidColumns();

    if (isMaximising === true) {
        let bestScore = -Infinity;

        for (let col of validColumns) {
            const row = getLowestEmptyRow(col);

            board[row][col] = "player2";

            let score = minimax(depth - 1, false, alpha, beta);

            board[row][col] = "";

            if (score > bestScore) {
                bestScore = score;
            }

            if (score > alpha) {
                alpha = score;
            }

            if (beta <= alpha) {
                break;
            }
        }

        return bestScore;
    } else {
        let bestScore = Infinity;

        for (let col of validColumns) {
            const row = getLowestEmptyRow(col);

            board[row][col] = "player1";

            let score = minimax(depth - 1, true, alpha, beta);

            board[row][col] = "";

            if (score < bestScore) {
                bestScore = score;
            }

            if (score < beta) {
                beta = score;
            }

            if (beta <= alpha) {
                break;
            }
        }

        return bestScore;
    }
}

// =========================
// EVALUATE BOARD
// =========================

function evaluateBoard() {
    let botScore = scoreBoardPosition("player2");
    let playerScore = scoreBoardPosition("player1");

    return botScore - playerScore;
}

// =========================
// ORDER COLUMNS FROM BEST TO WORST
// =========================

function getOrderedValidColumns() {
    const preferredOrder = [3, 2, 4, 1, 5, 0, 6];

    let orderedColumns = [];

    for (let col of preferredOrder) {
        if (getLowestEmptyRow(col) !== null) {
            orderedColumns.push(col);
        }
    }

    return orderedColumns;
}

// =========================
// SCORE BOARD POSITION
// =========================

function scoreBoardPosition(player) {
    let score = 0;

    // Prefer centre column
    const centreColumn = 3;

    for (let row = 0; row < rows; row++) {
        if (board[row][centreColumn] === player) {
            score += 6;
        }
    }

    // Slightly prefer columns near centre
    const columnScores = [1, 2, 4, 6, 4, 2, 1];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            if (board[row][col] === player) {
                score += columnScores[col];
            }
        }
    }

    // Score every group of 4 spaces
    score += scoreAllLines(player);

    return score;
}

// =========================
// SCORE ALL POSSIBLE LINES
// =========================

function scoreAllLines(player) {
    let score = 0;

    // Horizontal lines
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns - 3; col++) {
            const line = [
                board[row][col],
                board[row][col + 1],
                board[row][col + 2],
                board[row][col + 3]
            ];

            score += scoreLine(line, player);
        }
    }

    // Vertical lines
    for (let row = 0; row < rows - 3; row++) {
        for (let col = 0; col < columns; col++) {
            const line = [
                board[row][col],
                board[row + 1][col],
                board[row + 2][col],
                board[row + 3][col]
            ];

            score += scoreLine(line, player);
        }
    }

    // Diagonal down-right lines
    for (let row = 0; row < rows - 3; row++) {
        for (let col = 0; col < columns - 3; col++) {
            const line = [
                board[row][col],
                board[row + 1][col + 1],
                board[row + 2][col + 2],
                board[row + 3][col + 3]
            ];

            score += scoreLine(line, player);
        }
    }

    // Diagonal down-left lines
    for (let row = 0; row < rows - 3; row++) {
        for (let col = 3; col < columns; col++) {
            const line = [
                board[row][col],
                board[row + 1][col - 1],
                board[row + 2][col - 2],
                board[row + 3][col - 3]
            ];

            score += scoreLine(line, player);
        }
    }

    return score;
}


// =========================
// SCORE ONE LINE OF 4
// =========================

function scoreLine(line, player) {
    const opponent = player === "player2" ? "player1" : "player2";

    let playerCount = 0;
    let opponentCount = 0;
    let emptyCount = 0;

    for (let cell of line) {
        if (cell === player) {
            playerCount++;
        } else if (cell === opponent) {
            opponentCount++;
        } else {
            emptyCount++;
        }
    }

    if (playerCount === 4) {
        return 1000;
    }

    if (playerCount === 3 && emptyCount === 1) {
        return 50;
    }

    if (playerCount === 2 && emptyCount === 2) {
        return 10;
    }

    if (opponentCount === 3 && emptyCount === 1) {
        return -40;
    }

    if (opponentCount === 2 && emptyCount === 2) {
        return -6;
    }

    return 0;
}


// =========================
// FIND WINNING COLUMN
// =========================

function findWinningColumn(player) {
    for (let col = 0; col < columns; col++) {
        const row = getLowestEmptyRow(col);

        if (row === null) {
            continue;
        }

        board[row][col] = player;

        const isWinningMove = checkWinner(player);

        board[row][col] = "";

        if (isWinningMove === true) {
            return col;
        }
    }

    return null;
}


// =========================
// CHECK GAME
// =========================

function checkGame() {
    if (checkWinner(currentPlayer) === true) {
        if (savedMode === "bot" && currentPlayer === "player2") {
            document.getElementById("message").textContent = "Bot wins!";
        } else if (savedMode === "bot" && currentPlayer === "player1") {
            document.getElementById("message").textContent = "You win!";
        } else if (currentPlayer === "player1") {
            document.getElementById("message").textContent = "Player 1 wins!";
        } else {
            document.getElementById("message").textContent = "Player 2 wins!";
        }

        gameOver = true;
        return;
    }

    if (boardIsFull() === true) {
        document.getElementById("message").textContent = "Draw!";
        gameOver = true;
    }
}


// =========================
// CHECK WINNER
// =========================

function checkWinner(player) {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {

            if (board[row][col] !== player) {
                continue;
            }

            // Horizontal
            if (
                col + 3 < columns &&
                board[row][col + 1] === player &&
                board[row][col + 2] === player &&
                board[row][col + 3] === player
            ) {
                return true;
            }

            // Vertical
            if (
                row + 3 < rows &&
                board[row + 1][col] === player &&
                board[row + 2][col] === player &&
                board[row + 3][col] === player
            ) {
                return true;
            }

            // Diagonal down-right
            if (
                row + 3 < rows &&
                col + 3 < columns &&
                board[row + 1][col + 1] === player &&
                board[row + 2][col + 2] === player &&
                board[row + 3][col + 3] === player
            ) {
                return true;
            }

            // Diagonal down-left
            if (
                row + 3 < rows &&
                col - 3 >= 0 &&
                board[row + 1][col - 1] === player &&
                board[row + 2][col - 2] === player &&
                board[row + 3][col - 3] === player
            ) {
                return true;
            }
        }
    }

    return false;
}


// =========================
// BOARD IS FULL
// =========================

function boardIsFull() {
    for (let col = 0; col < columns; col++) {
        if (getLowestEmptyRow(col) !== null) {
            return false;
        }
    }

    return true;
}


// =========================
// RESTART GAME
// =========================

function restartGame() {
    board = [
        ["", "", "", "", "", "", ""],
        ["", "", "", "", "", "", ""],
        ["", "", "", "", "", "", ""],
        ["", "", "", "", "", "", ""],
        ["", "", "", "", "", "", ""],
        ["", "", "", "", "", "", ""]
    ];

    currentPlayer = "player1";
    gameOver = false;

    updateMessage();

    createBoard();
}


// =========================
// BACK TO HUB
// =========================

function goBackToHub() {
    window.location.href = "../../index.html";
}


// =========================
// START GAME
// =========================

updateMessage();
createBoard();