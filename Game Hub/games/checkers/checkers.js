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

const rows = 8;
const columns = 8;

let board = [];
let currentPlayer = "player1";
let selectedPiece = null;
let validMoves = [];
let gameOver = false;
let mustContinueCapture = false;


// =========================
// CREATE STARTING BOARD
// =========================

function createStartingBoard() {
    board = [];

    for (let row = 0; row < rows; row++) {
        let boardRow = [];

        for (let col = 0; col < columns; col++) {
            boardRow.push(null);
        }

        board.push(boardRow);
    }

    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < columns; col++) {
            if ((row + col) % 2 === 1) {
                board[row][col] = {
                    player: "player2",
                    king: false
                };
            }
        }
    }

    for (let row = 5; row < 8; row++) {
        for (let col = 0; col < columns; col++) {
            if ((row + col) % 2 === 1) {
                board[row][col] = {
                    player: "player1",
                    king: false
                };
            }
        }
    }
}


// =========================
// CREATE BOARD DISPLAY
// =========================

function createBoard() {
    const boardDiv = document.getElementById("board");

    boardDiv.innerHTML = "";

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const cell = document.createElement("div");

            cell.classList.add("cell");

            if ((row + col) % 2 === 0) {
                cell.classList.add("light-square");
            } else {
                cell.classList.add("dark-square");
            }

            if (isValidMoveSquare(row, col)) {
                cell.classList.add("valid-move");
            }

            const piece = board[row][col];

            if (piece !== null) {
                const pieceDiv = document.createElement("div");

                pieceDiv.classList.add("checker-piece");

                if (piece.player === "player1") {
                    pieceDiv.classList.add("player-one-piece");
                }

                if (piece.player === "player2") {
                    pieceDiv.classList.add("player-two-piece");
                }

                if (piece.king === true) {
                    pieceDiv.classList.add("king");
                }

                if (
                    selectedPiece !== null &&
                    selectedPiece.row === row &&
                    selectedPiece.col === col
                ) {
                    pieceDiv.classList.add("selected");
                }

                cell.appendChild(pieceDiv);
            }

            cell.onclick = function () {
                handleCellClick(row, col);
            };

            boardDiv.appendChild(cell);
        }
    }
}


// =========================
// HANDLE HUMAN CLICK
// =========================

function handleCellClick(row, col) {
    if (gameOver === true) {
        return;
    }

    if (savedMode === "bot" && currentPlayer === "player2") {
        return;
    }

    const clickedPiece = board[row][col];

    if (mustContinueCapture === true) {
        if (selectedPiece !== null && isValidMoveSquare(row, col)) {
            makeSelectedMove(row, col);
        }

        return;
    }

    if (clickedPiece !== null && clickedPiece.player === currentPlayer) {
        selectedPiece = {
            row: row,
            col: col
        };

        validMoves = getLegalMovesForPiece(row, col);

        createBoard();
        return;
    }

    if (selectedPiece !== null && isValidMoveSquare(row, col)) {
        makeSelectedMove(row, col);
    }
}


// =========================
// MAKE SELECTED HUMAN MOVE
// =========================

function makeSelectedMove(toRow, toCol) {
    const move = getMoveFromValidMoves(toRow, toCol);

    if (move === null) {
        return;
    }

    const fullMove = {
        fromRow: selectedPiece.row,
        fromCol: selectedPiece.col,
        row: move.row,
        col: move.col,
        capture: move.capture,
        capturedRow: move.capturedRow,
        capturedCol: move.capturedCol
    };

    makeMoveOnBoard(fullMove);

    if (checkGameOverAfterMove() === true) {
        selectedPiece = null;
        validMoves = [];
        createBoard();
        return;
    }

    if (fullMove.capture === true) {
        const extraCaptures = getCaptureMovesForPiece(fullMove.row, fullMove.col);

        if (extraCaptures.length > 0) {
            selectedPiece = {
                row: fullMove.row,
                col: fullMove.col
            };

            validMoves = extraCaptures;
            mustContinueCapture = true;

            updateMessageForExtraCapture();
            createBoard();
            return;
        }
    }

    selectedPiece = null;
    validMoves = [];
    mustContinueCapture = false;

    switchPlayer();

    if (checkCurrentPlayerHasMoves() === false) {
        createBoard();
        return;
    }

    createBoard();
    startBotIfNeeded();
}


// =========================
// START BOT IF NEEDED
// =========================

function startBotIfNeeded() {
    if (savedMode === "bot" && currentPlayer === "player2" && gameOver === false) {
        setTimeout(botMove, 500);
    }
}


// =========================
// BOT MOVE
// =========================

function botMove() {
    if (gameOver === true) {
        return;
    }

    if (currentPlayer !== "player2") {
        return;
    }

    let move = chooseBotMove();

    if (move === null) {
        document.getElementById("message").textContent = "You win!";
        gameOver = true;
        createBoard();
        return;
    }

    makeMoveOnBoard(move);

    if (checkGameOverAfterMove() === true) {
        createBoard();
        return;
    }

    // Bot multi-capture
    while (move.capture === true) {
        let extraCaptures = getCaptureMovesForPiece(move.row, move.col);

        if (extraCaptures.length === 0) {
            break;
        }

        let nextMove = chooseBotMoveFromList(extraCaptures, move.row, move.col);

        if (nextMove === null) {
            break;
        }

        move = {
            fromRow: move.row,
            fromCol: move.col,
            row: nextMove.row,
            col: nextMove.col,
            capture: nextMove.capture,
            capturedRow: nextMove.capturedRow,
            capturedCol: nextMove.capturedCol
        };

        makeMoveOnBoard(move);

        if (checkGameOverAfterMove() === true) {
            createBoard();
            return;
        }
    }

    switchPlayer();

    if (checkCurrentPlayerHasMoves() === false) {
        createBoard();
        return;
    }

    createBoard();
}


// =========================
// CHOOSE BOT MOVE
// =========================

function chooseBotMove() {
    const legalMoves = getAllLegalMovesForPlayer("player2");

    if (legalMoves.length === 0) {
        return null;
    }

    if (savedBotDifficulty === "random") {
        return chooseRandomMove(legalMoves);
    }

    if (savedBotDifficulty === "winning") {
        return chooseCaptureBotMove(legalMoves);
    }

    if (savedBotDifficulty === "smart") {
        return chooseSmartMove(legalMoves, "player2");
    }

    if (savedBotDifficulty === "optimal") {
        return chooseOptimalMove();
    }

    return chooseRandomMove(legalMoves);
}


// =========================
// CHOOSE BOT MOVE FROM EXTRA CAPTURES
// =========================

function chooseBotMoveFromList(moves, fromRow, fromCol) {
    let fullMoves = [];

    for (let move of moves) {
        fullMoves.push({
            fromRow: fromRow,
            fromCol: fromCol,
            row: move.row,
            col: move.col,
            capture: move.capture,
            capturedRow: move.capturedRow,
            capturedCol: move.capturedCol
        });
    }

    if (savedBotDifficulty === "random") {
        return chooseRandomMove(fullMoves);
    }

    if (savedBotDifficulty === "winning") {
        return chooseCaptureBotMove(fullMoves);
    }

    if (savedBotDifficulty === "smart") {
        return chooseSmartMove(fullMoves, "player2");
    }

    if (savedBotDifficulty === "optimal") {
        return chooseSmartMove(fullMoves, "player2");
    }

    return chooseRandomMove(fullMoves);
}


// =========================
// RANDOM BOT
// =========================

function chooseRandomMove(moves) {
    const randomIndex = Math.floor(Math.random() * moves.length);
    return moves[randomIndex];
}


// =========================
// CAPTURE / WINNING MOVE BOT
// =========================

function chooseCaptureBotMove(moves) {
    let bestScore = -Infinity;
    let bestMoves = [];

    for (let move of moves) {
        let score = 0;

        if (move.capture === true) {
            score += 100;

            const capturedPiece = board[move.capturedRow][move.capturedCol];

            if (capturedPiece !== null && capturedPiece.king === true) {
                score += 80;
            }
        }

        const movingPiece = board[move.fromRow][move.fromCol];

        if (
            movingPiece !== null &&
            movingPiece.king === false &&
            movingPiece.player === "player2" &&
            move.row === rows - 1
        ) {
            score += 60;
        }

        if (score > bestScore) {
            bestScore = score;
            bestMoves = [move];
        } else if (score === bestScore) {
            bestMoves.push(move);
        }
    }

    return chooseRandomMove(bestMoves);
}


// =========================
// SMART BOT
// =========================

function chooseSmartMove(moves, player) {
    let bestScore = -Infinity;
    let bestMoves = [];

    for (let move of moves) {
        const oldBoard = cloneBoard(board);

        makeMoveOnBoard(move);

        let score = evaluateBoardForPlayer(player);

        board = oldBoard;

        score += scoreMove(move, player);

        if (score > bestScore) {
            bestScore = score;
            bestMoves = [move];
        } else if (score === bestScore) {
            bestMoves.push(move);
        }
    }

    return chooseRandomMove(bestMoves);
}


// =========================
// SCORE ONE MOVE
// =========================

function scoreMove(move, player) {
    let score = 0;

    const piece = board[move.fromRow][move.fromCol];

    if (move.capture === true) {
        score += 100;

        const capturedPiece = board[move.capturedRow][move.capturedCol];

        if (capturedPiece !== null && capturedPiece.king === true) {
            score += 80;
        }
    }

    if (piece !== null && piece.king === false) {
        if (player === "player2" && move.row === rows - 1) {
            score += 70;
        }

        if (player === "player1" && move.row === 0) {
            score += 70;
        }
    }

    // Prefer central squares
    if (move.col >= 2 && move.col <= 5) {
        score += 10;
    }

    // Avoid edge unless useful
    if (move.col === 0 || move.col === 7) {
        score -= 5;
    }

    return score;
}


// =========================
// OPTIMAL BOT
// =========================

function chooseOptimalMove() {
    const legalMoves = getAllLegalMovesForPlayer("player2");

    if (legalMoves.length === 0) {
        return null;
    }

    const depth = 4;

    let bestScore = -Infinity;
    let bestMoves = [];

    for (let move of legalMoves) {
        const oldBoard = cloneBoard(board);

        makeMoveOnBoard(move);

        let nextPlayer = "player1";

        if (move.capture === true) {
            const extraCaptures = getCaptureMovesForPiece(move.row, move.col);

            if (extraCaptures.length > 0) {
                nextPlayer = "player2";
            }
        }

        let score = minimax(depth - 1, nextPlayer, -Infinity, Infinity);

        board = oldBoard;

        if (score > bestScore) {
            bestScore = score;
            bestMoves = [move];
        } else if (score === bestScore) {
            bestMoves.push(move);
        }
    }

    return chooseRandomMove(bestMoves);
}


// =========================
// MINIMAX WITH ALPHA-BETA
// =========================

function minimax(depth, player, alpha, beta) {
    const winner = getWinnerIfGameOver();

    if (winner === "player2") {
        return 100000 + depth;
    }

    if (winner === "player1") {
        return -100000 - depth;
    }

    if (depth === 0) {
        return evaluateBoardForPlayer("player2");
    }

    const legalMoves = getAllLegalMovesForPlayer(player);

    if (legalMoves.length === 0) {
        if (player === "player2") {
            return -100000 - depth;
        } else {
            return 100000 + depth;
        }
    }

    if (player === "player2") {
        let bestScore = -Infinity;

        for (let move of legalMoves) {
            const oldBoard = cloneBoard(board);

            makeMoveOnBoard(move);

            let nextPlayer = "player1";

            if (move.capture === true) {
                const extraCaptures = getCaptureMovesForPiece(move.row, move.col);

                if (extraCaptures.length > 0) {
                    nextPlayer = "player2";
                }
            }

            const score = minimax(depth - 1, nextPlayer, alpha, beta);

            board = oldBoard;

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

        for (let move of legalMoves) {
            const oldBoard = cloneBoard(board);

            makeMoveOnBoard(move);

            let nextPlayer = "player2";

            if (move.capture === true) {
                const extraCaptures = getCaptureMovesForPiece(move.row, move.col);

                if (extraCaptures.length > 0) {
                    nextPlayer = "player1";
                }
            }

            const score = minimax(depth - 1, nextPlayer, alpha, beta);

            board = oldBoard;

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

function evaluateBoardForPlayer(player) {
    let score = 0;

    const opponent = player === "player1" ? "player2" : "player1";

    score += countMaterial(player);
    score -= countMaterial(opponent);

    score += getAllCaptureMovesForPlayer(player).length * 30;
    score -= getAllCaptureMovesForPlayer(opponent).length * 30;

    return score;
}


// =========================
// COUNT MATERIAL
// =========================

function countMaterial(player) {
    let score = 0;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const piece = board[row][col];

            if (piece !== null && piece.player === player) {
                if (piece.king === true) {
                    score += 175;
                } else {
                    score += 100;
                }

                // Reward advanced pieces
                if (player === "player2") {
                    score += row * 4;
                } else {
                    score += (rows - 1 - row) * 4;
                }

                // Reward centre control
                if (col >= 2 && col <= 5) {
                    score += 8;
                }
            }
        }
    }

    return score;
}


// =========================
// GET WINNER IF GAME OVER
// =========================

function getWinnerIfGameOver() {
    let player1Pieces = 0;
    let player2Pieces = 0;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const piece = board[row][col];

            if (piece !== null && piece.player === "player1") {
                player1Pieces++;
            }

            if (piece !== null && piece.player === "player2") {
                player2Pieces++;
            }
        }
    }

    if (player1Pieces === 0) {
        return "player2";
    }

    if (player2Pieces === 0) {
        return "player1";
    }

    if (playerHasAnyLegalMove("player1") === false) {
        return "player2";
    }

    if (playerHasAnyLegalMove("player2") === false) {
        return "player1";
    }

    return null;
}


// =========================
// GET LEGAL MOVES FOR PIECE
// =========================

function getLegalMovesForPiece(row, col) {
    const piece = board[row][col];

    if (piece === null) {
        return [];
    }

    const allCaptures = getAllCaptureMovesForPlayer(currentPlayer);
    const pieceCaptures = getCaptureMovesForPiece(row, col);

    if (allCaptures.length > 0) {
        return pieceCaptures;
    }

    return getNormalMovesForPiece(row, col);
}


// =========================
// GET ALL LEGAL MOVES FOR PLAYER
// =========================

function getAllLegalMovesForPlayer(player) {
    const captures = getAllCaptureMovesForPlayer(player);

    if (captures.length > 0) {
        return captures;
    }

    let moves = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const piece = board[row][col];

            if (piece !== null && piece.player === player) {
                const pieceMoves = getNormalMovesForPiece(row, col);

                for (let move of pieceMoves) {
                    moves.push({
                        fromRow: row,
                        fromCol: col,
                        row: move.row,
                        col: move.col,
                        capture: false
                    });
                }
            }
        }
    }

    return moves;
}


// =========================
// GET NORMAL MOVES FOR PIECE
// =========================

function getNormalMovesForPiece(row, col) {
    const piece = board[row][col];

    if (piece === null) {
        return [];
    }

    let moves = [];
    let directions = getDirectionsForPiece(piece);

    for (let direction of directions) {
        const moveRow = row + direction[0];
        const moveCol = col + direction[1];

        if (isOnBoard(moveRow, moveCol) && board[moveRow][moveCol] === null) {
            moves.push({
                row: moveRow,
                col: moveCol,
                capture: false
            });
        }
    }

    return moves;
}


// =========================
// GET CAPTURE MOVES FOR PIECE
// =========================

function getCaptureMovesForPiece(row, col) {
    const piece = board[row][col];

    if (piece === null) {
        return [];
    }

    let moves = [];
    let directions = getDirectionsForPiece(piece);

    for (let direction of directions) {
        const enemyRow = row + direction[0];
        const enemyCol = col + direction[1];

        const landingRow = row + direction[0] * 2;
        const landingCol = col + direction[1] * 2;

        if (
            isOnBoard(enemyRow, enemyCol) &&
            isOnBoard(landingRow, landingCol) &&
            board[enemyRow][enemyCol] !== null &&
            board[enemyRow][enemyCol].player !== piece.player &&
            board[landingRow][landingCol] === null
        ) {
            moves.push({
                row: landingRow,
                col: landingCol,
                capture: true,
                capturedRow: enemyRow,
                capturedCol: enemyCol
            });
        }
    }

    return moves;
}


// =========================
// GET ALL CAPTURE MOVES FOR PLAYER
// =========================

function getAllCaptureMovesForPlayer(player) {
    let captures = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const piece = board[row][col];

            if (piece !== null && piece.player === player) {
                const pieceCaptures = getCaptureMovesForPiece(row, col);

                for (let move of pieceCaptures) {
                    captures.push({
                        fromRow: row,
                        fromCol: col,
                        row: move.row,
                        col: move.col,
                        capture: true,
                        capturedRow: move.capturedRow,
                        capturedCol: move.capturedCol
                    });
                }
            }
        }
    }

    return captures;
}


// =========================
// GET DIRECTIONS FOR PIECE
// =========================

function getDirectionsForPiece(piece) {
    let directions = [];

    if (piece.player === "player1" || piece.king === true) {
        directions.push([-1, -1]);
        directions.push([-1, 1]);
    }

    if (piece.player === "player2" || piece.king === true) {
        directions.push([1, -1]);
        directions.push([1, 1]);
    }

    return directions;
}


// =========================
// MAKE MOVE ON BOARD
// =========================

function makeMoveOnBoard(move) {
    const piece = board[move.fromRow][move.fromCol];

    board[move.row][move.col] = piece;
    board[move.fromRow][move.fromCol] = null;

    if (move.capture === true) {
        board[move.capturedRow][move.capturedCol] = null;
    }

    if (piece.player === "player1" && move.row === 0) {
        piece.king = true;
    }

    if (piece.player === "player2" && move.row === rows - 1) {
        piece.king = true;
    }
}


// =========================
// GET CHOSEN MOVE
// =========================

function getMoveFromValidMoves(row, col) {
    for (let move of validMoves) {
        if (move.row === row && move.col === col) {
            return move;
        }
    }

    return null;
}


// =========================
// CHECK VALID MOVE SQUARE
// =========================

function isValidMoveSquare(row, col) {
    for (let move of validMoves) {
        if (move.row === row && move.col === col) {
            return true;
        }
    }

    return false;
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
    if (savedMode === "bot" && currentPlayer === "player1") {
        document.getElementById("message").textContent = "Your turn";
    } else if (savedMode === "bot" && currentPlayer === "player2") {
        document.getElementById("message").textContent = "Bot's turn";
    } else if (currentPlayer === "player1") {
        document.getElementById("message").textContent = "Player 1's turn";
    } else {
        document.getElementById("message").textContent = "Player 2's turn";
    }
}


// =========================
// UPDATE MESSAGE FOR EXTRA CAPTURE
// =========================

function updateMessageForExtraCapture() {
    if (currentPlayer === "player1") {
        document.getElementById("message").textContent = "Player 1 must capture again";
    } else {
        document.getElementById("message").textContent = "Player 2 must capture again";
    }
}


// =========================
// CHECK GAME OVER AFTER MOVE
// =========================

function checkGameOverAfterMove() {
    const winner = getWinnerIfGameOver();

    if (winner === "player1") {
        if (savedMode === "bot") {
            document.getElementById("message").textContent = "You win!";
        } else {
            document.getElementById("message").textContent = "Player 1 wins!";
        }

        gameOver = true;
        return true;
    }

    if (winner === "player2") {
        if (savedMode === "bot") {
            document.getElementById("message").textContent = "Bot wins!";
        } else {
            document.getElementById("message").textContent = "Player 2 wins!";
        }

        gameOver = true;
        return true;
    }

    return false;
}


// =========================
// CHECK CURRENT PLAYER HAS MOVES
// =========================

function checkCurrentPlayerHasMoves() {
    if (playerHasAnyLegalMove(currentPlayer) === true) {
        return true;
    }

    if (currentPlayer === "player1") {
        if (savedMode === "bot") {
            document.getElementById("message").textContent = "Bot wins!";
        } else {
            document.getElementById("message").textContent = "Player 2 wins!";
        }
    } else {
        if (savedMode === "bot") {
            document.getElementById("message").textContent = "You win!";
        } else {
            document.getElementById("message").textContent = "Player 1 wins!";
        }
    }

    gameOver = true;
    return false;
}


// =========================
// PLAYER HAS ANY LEGAL MOVE
// =========================

function playerHasAnyLegalMove(player) {
    const moves = getAllLegalMovesForPlayer(player);
    return moves.length > 0;
}


// =========================
// CLONE BOARD
// =========================

function cloneBoard(originalBoard) {
    let newBoard = [];

    for (let row = 0; row < rows; row++) {
        let newRow = [];

        for (let col = 0; col < columns; col++) {
            const piece = originalBoard[row][col];

            if (piece === null) {
                newRow.push(null);
            } else {
                newRow.push({
                    player: piece.player,
                    king: piece.king
                });
            }
        }

        newBoard.push(newRow);
    }

    return newBoard;
}


// =========================
// HELPERS
// =========================

function isOnBoard(row, col) {
    return row >= 0 && row < rows && col >= 0 && col < columns;
}


// =========================
// RESTART GAME
// =========================

function restartGame() {
    currentPlayer = "player1";
    selectedPiece = null;
    validMoves = [];
    gameOver = false;
    mustContinueCapture = false;

    createStartingBoard();
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

createStartingBoard();
updateMessage();
createBoard();