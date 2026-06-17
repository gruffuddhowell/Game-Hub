// =========================
// DEFAULT SETTINGS
// =========================

let selectedTheme = localStorage.getItem("theme") || "wooden";
let selectedMode = localStorage.getItem("mode") || "local";
let selectedBotDifficulty = localStorage.getItem("botDifficulty") || "random";


// =========================
// LOAD SAVED SETTINGS
// =========================

window.onload = function () {
    document.body.className = selectedTheme;

    highlightSavedButtons();
};


// =========================
// THEME SELECTION
// =========================

function setTheme(theme, button) {
    selectedTheme = theme;

    localStorage.setItem("theme", theme);

    document.body.className = theme;

    clearSelectedButtons(button.parentElement);
    button.classList.add("selected");
}


// =========================
// MODE SELECTION
// =========================

function setMode(mode, button) {
    selectedMode = mode;

    localStorage.setItem("mode", mode);

    clearSelectedButtons(button.parentElement);
    button.classList.add("selected");
}


// =========================
// BOT DIFFICULTY SELECTION
// =========================

function setBotDifficulty(difficulty, button) {
    selectedBotDifficulty = difficulty;

    localStorage.setItem("botDifficulty", difficulty);

    clearSelectedButtons(button.parentElement);
    button.classList.add("selected");
}


// =========================
// OPEN GAME
// =========================

function openGame(gameName) {
    localStorage.setItem("theme", selectedTheme);
    localStorage.setItem("mode", selectedMode);
    localStorage.setItem("botDifficulty", selectedBotDifficulty);

    if (gameName === "tictactoe") {
        window.location.href = "games/tictactoe/index.html";
    }

    if (gameName === "connect4") {
        window.location.href = "games/connect4/index.html";
    }

    if (gameName === "quarto") {
        window.location.href = "games/quarto/index.html";
    }

    if (gameName === "checkers") {
        window.location.href = "games/checkers/index.html";
    }
}


// =========================
// BUTTON HELPERS
// =========================

function clearSelectedButtons(section) {
    const buttons = section.querySelectorAll("button");

    for (let button of buttons) {
        button.classList.remove("selected");
    }
}


function highlightSavedButtons() {
    const buttons = document.querySelectorAll("button");

    for (let button of buttons) {
        button.classList.remove("selected");
    }

    for (let button of buttons) {
        let text = button.textContent.toLowerCase();

        if (selectedTheme === "wooden" && text.includes("wooden")) {
            button.classList.add("selected");
        }

        if (selectedTheme === "forest" && text.includes("forest")) {
            button.classList.add("selected");
        }

        if (selectedTheme === "blackwhite" && text.includes("black")) {
            button.classList.add("selected");
        }

        if (selectedMode === "local" && text.includes("local")) {
            button.classList.add("selected");
        }

        if (selectedMode === "bot" && text.includes("bot")) {
            button.classList.add("selected");
        }

        if (selectedBotDifficulty === "random" && text.includes("random")) {
            button.classList.add("selected");
        }

        if (selectedBotDifficulty === "winning" && text.includes("winning")) {
            button.classList.add("selected");
        }

        if (selectedBotDifficulty === "smart" && text.includes("smart")) {
            button.classList.add("selected");
        }

        if (selectedBotDifficulty === "optimal" && text.includes("optimal")) {
            button.classList.add("selected");
        }
    }
}