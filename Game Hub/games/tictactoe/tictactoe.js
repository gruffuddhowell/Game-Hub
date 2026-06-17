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

let board = [
    "", "", "",
    "", "", "",
    "", "", ""
];

let currentPlayer = "X";
let gameOver = false;


// =========================
// CREATE BOARD
// =========================

function createBoard() {
    const boardDiv = document.getElementById("board");

    boardDiv.innerHTML = "";

    for (let i = 0; i < 9; i++) {
        const cell = document.createElement("div");

        cell.classList.add("cell");

        if (board[i] === "X") {
            const counter = document.createElement("div");
            counter.classList.add("counter", "player-one-piece");
            cell.appendChild(counter);
        }

        if (board[i] === "O") {
            const counter = document.createElement("div");
            counter.classList.add("counter", "player-two-piece");
            cell.appendChild(counter);
        }

        cell.onclick = function () {
            makeMove(i);
        };

        boardDiv.appendChild(cell);
    }
}


// =========================
// MAKE MOVE
// =========================

function makeMove(index) {
    if (gameOver === true) {
        return;
    }

    if (board[index] !== "") {
        return;
    }

    if (savedMode === "bot" && currentPlayer === "O") {
        return;
    }

    board[index] = currentPlayer;

    checkGame();

    if (gameOver === false) {
        switchPlayer();
    }

    createBoard();

    if (savedMode === "bot" && currentPlayer === "O" && gameOver === false) {
        setTimeout(botMove, 400);
    }
}


// =========================
// SWITCH PLAYER
// =========================

function switchPlayer() {
    if (currentPlayer === "X") {
        currentPlayer = "O";
    } else {
        currentPlayer = "X";
    }

    updateMessage();
}


// =========================
// UPDATE MESSAGE
// =========================

function updateMessage() {
    if (savedMode === "bot" && currentPlayer === "O") {
        document.getElementById("message").textContent = "Bot's turn";
    } else if (savedMode === "bot" && currentPlayer === "X") {
        document.getElementById("message").textContent = "Your turn";
    } else if (currentPlayer === "X") {
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
        move = getOptimalMove();
    } else if (savedBotDifficulty === "optimal") {
        move = getOptimalMove();
    } else {
        move = getRandomMove();
    }

    if (move === null) {
        return;
    }

    board[move] = "O";

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
    let emptySquares = [];

    for (let i = 0; i < board.length; i++) {
        if (board[i] === "") {
            emptySquares.push(i);
        }
    }

    if (emptySquares.length === 0) {
        return null;
    }

    const randomIndex = Math.floor(Math.random() * emptySquares.length);

    return emptySquares[randomIndex];
}


// =========================
// WINNING MOVE BOT
// =========================

function getWinningMoveBotMove() {
    let winningMove = findWinningMove("O");

    if (winningMove !== null) {
        return winningMove;
    }

    let blockingMove = findWinningMove("X");

    if (blockingMove !== null) {
        return blockingMove;
    }

    return getRandomMove();
}


// =========================
// FIND A WINNING MOVE
// =========================

function findWinningMove(player) {
    const winningLines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],

        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],

        [0, 4, 8],
        [2, 4, 6]
    ];

    for (let line of winningLines) {
        const a = line[0];
        const b = line[1];
        const c = line[2];

        if (board[a] === player && board[b] === player && board[c] === "") {
            return c;
        }

        if (board[a] === player && board[c] === player && board[b] === "") {
            return b;
        }

        if (board[b] === player && board[c] === player && board[a] === "") {
            return a;
        }
    }

    return null;
}


// =========================
// OPTIMAL BOT
// =========================

function getOptimalMove() {
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < board.length; i++) {
        if (board[i] === "") {
            board[i] = "O";

            let score = minimax(false);

            board[i] = "";

            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }

    return bestMove;
}


// =========================
// MINIMAX
// =========================

function minimax(isMaximising) {
    let result = checkWinnerForMinimax();

    if (result !== null) {
        return result;
    }

    if (isMaximising === true) {
        let bestScore = -Infinity;

        for (let i = 0; i < board.length; i++) {
            if (board[i] === "") {
                board[i] = "O";

                let score = minimax(false);

                board[i] = "";

                if (score > bestScore) {
                    bestScore = score;
                }
            }
        }

        return bestScore;
    } else {
        let bestScore = Infinity;

        for (let i = 0; i < board.length; i++) {
            if (board[i] === "") {
                board[i] = "X";

                let score = minimax(true);

                board[i] = "";

                if (score < bestScore) {
                    bestScore = score;
                }
            }
        }

        return bestScore;
    }
}


// =========================
// CHECK WINNER FOR MINIMAX
// =========================

function checkWinnerForMinimax() {
    const winningLines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],

        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],

        [0, 4, 8],
        [2, 4, 6]
    ];

    for (let line of winningLines) {
        const a = line[0];
        const b = line[1];
        const c = line[2];

        if (board[a] !== "" && board[a] === board[b] && board[b] === board[c]) {
            if (board[a] === "O") {
                return 10;
            }

            if (board[a] === "X") {
                return -10;
            }
        }
    }

    if (!board.includes("")) {
        return 0;
    }

    return null;
}


// =========================
// CHECK GAME
// =========================

function checkGame() {
    const winningLines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],

        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],

        [0, 4, 8],
        [2, 4, 6]
    ];

    for (let line of winningLines) {
        const a = line[0];
        const b = line[1];
        const c = line[2];

        if (board[a] !== "" && board[a] === board[b] && board[b] === board[c]) {
            if (savedMode === "bot" && currentPlayer === "O") {
                document.getElementById("message").textContent = "Bot wins!";
            } else if (savedMode === "bot" && currentPlayer === "X") {
                document.getElementById("message").textContent = "You win!";
            } else if (currentPlayer === "X") {
                document.getElementById("message").textContent = "Player 1 wins!";
            } else {
                document.getElementById("message").textContent = "Player 2 wins!";
            }

            gameOver = true;
            return;
        }
    }

    if (!board.includes("")) {
        document.getElementById("message").textContent = "Draw!";
        gameOver = true;
    }
}


// =========================
// RESTART GAME
// =========================

function restartGame() {
    board = [
        "", "", "",
        "", "", "",
        "", "", ""
    ];

    currentPlayer = "X";
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