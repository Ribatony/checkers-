// static/script.js

let currentPlayer = "red";
let board = [];
let selectedSquare = null;

// preload sounds
const moveSound = new Audio("/static/move.wav");
const captureSound = new Audio("/static/capture.wav");

document.addEventListener("DOMContentLoaded", () => {
  const boardDiv = document.getElementById("board");
  initBoard(boardDiv);
});

function initBoard(boardDiv) {
  boardDiv.innerHTML = "";
  board = [];

  for (let row = 0; row < 8; row++) {
    board[row] = [];
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.className = "square " + ((row + col) % 2 === 0 ? "light" : "dark");
      square.dataset.row = row;
      square.dataset.col = col;

      if (square.classList.contains("dark")) {
        if (row < 3) addPiece(square, "black");
        else if (row > 4) addPiece(square, "red");
      }

      square.addEventListener("click", () => handleClick(square));
      boardDiv.appendChild(square);
      board[row][col] = square;
    }
  }
}

function addPiece(square, color) {
  const piece = document.createElement("div");
  piece.className = "piece " + color;
  square.appendChild(piece);
}

function handleClick(square) {
  if (currentPlayer !== "red") return; // Only human plays red

  if (selectedSquare) {
    attemptMove(selectedSquare, square);
    selectedSquare = null;
  } else if (square.querySelector(".piece.red")) {
    selectedSquare = square;
  }
}

function attemptMove(fromSquare, toSquare) {
  const fromRow = parseInt(fromSquare.dataset.row);
  const fromCol = parseInt(fromSquare.dataset.col);
  const toRow = parseInt(toSquare.dataset.row);
  const toCol = parseInt(toSquare.dataset.col);

  const piece = fromSquare.querySelector(".piece");

  // Simple move (diagonal by 1)
  if (Math.abs(toRow - fromRow) === 1 && Math.abs(toCol - fromCol) === 1 &&
      !toSquare.querySelector(".piece")) {
    toSquare.appendChild(piece);
    kingPromotion(piece, toRow, "red");
    moveSound.play();
    currentPlayer = "black";
    document.getElementById("status").innerText = "Computer's turn...";
    setTimeout(computerMove, 1000);
  }

  // Capture move (diagonal by 2)
  else if (Math.abs(toRow - fromRow) === 2 && Math.abs(toCol - fromCol) === 2) {
    const midRow = (fromRow + toRow) / 2;
    const midCol = (fromCol + toCol) / 2;
    const midSquare = board[midRow][midCol];

    if (midSquare.querySelector(".piece.black") && !toSquare.querySelector(".piece")) {
      midSquare.innerHTML = ""; // remove captured piece
      toSquare.appendChild(piece);
      kingPromotion(piece, toRow, "red");
      captureSound.play();

      // Check for more captures
      if (hasMoreCaptures(toSquare, "red")) {
        selectedSquare = toSquare; // keep piece selected for another jump
      } else {
        currentPlayer = "black";
        document.getElementById("status").innerText = "Computer's turn...";
        setTimeout(computerMove, 1000);
      }
    }
  }
}

function hasMoreCaptures(square, color) {
  const row = parseInt(square.dataset.row);
  const col = parseInt(square.dataset.col);
  const dirs = color === "red" ? [[-2, -2], [-2, 2]] : [[2, -2], [2, 2]];

  for (let d of dirs) {
    let nr = row + d[0], nc = col + d[1];
    let midRow = row + d[0] / 2, midCol = col + d[1] / 2;
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      let target = board[nr][nc];
      let midSquare = board[midRow][midCol];
      if (!target.querySelector(".piece") &&
          midSquare.querySelector(".piece." + (color === "red" ? "black" : "red")) &&
          target.classList.contains("dark")) {
        return true;
      }
    }
  }
  return false;
}

function kingPromotion(piece, row, color) {
  if ((color === "red" && row === 0) || (color === "black" && row === 7)) {
    piece.classList.add("king");
  }
}

function computerMove() {
  let moved = false;

  while (!moved) {
    let captureMoves = [];
    let normalMoves = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = board[row][col];
        if (square.querySelector(".piece.black")) {
          // capture directions
          let captureDirs = [[2, -2], [2, 2]];
          for (let d of captureDirs) {
            let nr = row + d[0], nc = col + d[1];
            let midRow = row + d[0] / 2, midCol = col + d[1] / 2;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
              let target = board[nr][nc];
              let midSquare = board[midRow][midCol];
              if (!target.querySelector(".piece") &&
                  midSquare.querySelector(".piece.red") &&
                  target.classList.contains("dark")) {
                captureMoves.push({ from: square, to: target, mid: midSquare });
              }
            }
          }

          // normal moves
          let dirs = [[1, -1], [1, 1]];
          for (let d of dirs) {
            let nr = row + d[0], nc = col + d[1];
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
              let target = board[nr][nc];
              if (!target.querySelector(".piece") && target.classList.contains("dark")) {
                normalMoves.push({ from: square, to: target });
              }
            }
          }
        }
      }
    }

    if (captureMoves.length > 0) {
      let choice = captureMoves[Math.floor(Math.random() * captureMoves.length)];
      const piece = choice.from.querySelector(".piece");
      choice.mid.innerHTML = ""; // remove captured piece
      choice.to.appendChild(piece);
      kingPromotion(piece, parseInt(choice.to.dataset.row), "black");
      captureSound.play();

      if (!hasMoreCaptures(choice.to, "black")) {
        moved = true;
      }
    } else if (normalMoves.length > 0) {
      let choice = normalMoves[Math.floor(Math.random() * normalMoves.length)];
      const piece = choice.from.querySelector(".piece");
      choice.to.appendChild(piece);
      kingPromotion(piece, parseInt(choice.to.dataset.row), "black");
      moveSound.play();
      moved = true;
    } else {
      moved = true; // no moves
    }
  }

  currentPlayer = "red";
  document.getElementById("status").innerText = "Your turn (Red)";
}

