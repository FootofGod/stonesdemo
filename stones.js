/*****************************************\
  =======================================
 
               Stones Demo

                    by

				FootofGod

			   forked from

             Code Monkey King

  =======================================
\*****************************************/

// DATA 
const canvas = document.getElementById('gobang');
const ctx = canvas.getContext('2d');
const EMPTY = 0
const BLACK = 1
const WHITE = 2
const MARKER = 4
const OFFBOARD = 7
const LIBERTY = 8

var board = [];
var size = 11;
var side = BLACK;
var liberties = [];
var block = [];
var points_side = [];
var compensation = 6
var lead = []; // this shows who has the lead, White is positive, Black is negative
var leadOld =[]; // we'll frickin try this!
var leadThreshold = 7; // lead threshold (defaults by board size, make custom)
var pts = []; //used to track last capture
var leader = [];
var points_count = [];
var ko = EMPTY;
var bestMove = EMPTY;
var userMove = 0;
var cell = canvas.width / size;
var selectSize = document.getElementById("size");

// GUI
function drawBoard() { /* Render board to screen */
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  for (let i = 1; i < size-1; i++) {
    const x = i * cell + cell / 2;
    const y = i * cell + cell / 2;
    let offset = cell * 2 - cell / 2;
    ctx.moveTo(offset, y);
    ctx.lineTo(canvas.width - offset, y);
    ctx.moveTo(x, offset);
    ctx.lineTo(x, canvas.height - offset);
  };ctx.stroke();
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      let sq = row * size + col;
      if (board[sq] == 7) continue;
      let color = board[sq] == 1 ? "black" : "white";
      if (board[sq]) {
        ctx.beginPath();
        ctx.arc(col * cell + cell / 2, row * cell + cell / 2, cell / 2 - 2, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.stroke();
      }
      if (sq == userMove) {
        let color = board[sq] == 1 ? "white" : "black";
        ctx.beginPath();
        ctx.arc(col * cell+(cell/4)*2, row * cell +(cell/4)*2, cell / 4 - 2, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.stroke();
      }
    }
  }
}

function userInput(event) { /* Handle user input */
  let rect = canvas.getBoundingClientRect();
  let mouseX = event.clientX - rect.left;
  let mouseY = event.clientY - rect.top;
  let col = Math.floor(mouseX / cell);
  let row = Math.floor(mouseY / cell);
  let sq = row * size + col;
  if (board[sq]) return;
  if (!setStone(sq, side, true)) return;
  drawBoard();
  setTimeout(function() { play(6); }, 10);
  updateScore();
}
//--- we don't need this, we need to make a new score system 
function territory(sq) { /*Count territory, returns [side, points] */
  stone = board[sq];
  if (stone == OFFBOARD) return OFFBOARD;
  if (stone == EMPTY) {
    block.push(sq);
    points_count.push(sq);
    board[sq] |= MARKER;
    for (let offset of [1, size, -1, -size]) territory(sq+offset);
  } else if (stone != MARKER) {
    points_side.push(stone);
  } if (!points_side.length) return [EMPTY, points_count.length];
  else if (points_side.every((element) => element == points_side[0]))
    return [points_side[0], points_count.length];
  else return [EMPTY, points_count.length];
}

function score() { /* Scores game, returns points [empty, black, white]*/
	leadOld = lead
  let scorePosition = [0, 0, 0];
  for (let sq = 0; sq < size ** 2; sq++) {
    if (board[sq]) continue;
    let result = territory(sq);
    scorePosition[result[0]] += result[1];
    points_side = [];
    points_count = [];
  } restoreBoard();
  let prisoners = (side == BLACK ? evaluate(): -evaluate());
  if (prisoners > 0) scorePosition[BLACK] += prisoners;
  if (prisoners < 0) scorePosition[WHITE] += Math.abs(prisoners);
  scorePosition[WHITE] += compensation;  // Compensation stones
  lead = prisoners - compensation;
  lastCapture = Math.abs(lead - leadOld + (side == BLACK ? 1 : -1));
  return scorePosition; //we still need this for the move selection to work properly
  return lead;

}

function updateScore() { /* Render score to screen */
  let pts = score();
  let leader = lead<0 ? "White": lead==0 ? "" : "Black";
  let element = document.getElementById("score");
  element.innerHTML = "Lead: " + Math.abs(lead) + " " + leader + " | White Compensation: " + compensation + " | Last Capture: " + lastCapture; //need to replace with "Lead" = diff
   if (lead >= leadThreshold - compensation && lastCapture >=2 || lead <= -leadThreshold - compensation && lastCapture >=2){ //we need to make this ifs with requirement of 2 stones captured
	 alert(leader + " Wins!"); 
	canvas.removeEventListener("click", userInput);
	side = EMPTY;
   }
}

// ENGINE
function initBoard() { /* Empty board, set offboard squares */
  for (let sq = 0; sq < size ** 2; sq++) {
    switch (true) {
      case (sq < size):
      case (sq >= (size ** 2 - size)):
      case (!(sq % size)):
        board[sq] = OFFBOARD;
        board[sq-1] = OFFBOARD;
        break;
      default: board[sq] = 0;
    }
  }
}

function inEye(sq) { /* Check if sqaure is in diamond shape */
  let eyeColor = -1;
  let otherColor = -1;
  for (let offset of [1, size, -1, -size]) {
    if (board[sq+offset] == OFFBOARD) continue;
    if (board[sq+offset] == EMPTY) return 0;
    if (eyeColor == -1) {
      eyeColor = board[sq+offset];
      otherColor = 3-eyeColor;
    } else if (board[sq+offset] == otherColor)
      return 0;
  }
  if (eyeColor > 2) eyeColor -= MARKER;
  return eyeColor;
}

function clearBlock(move) { /* Erase stones when captured  - does not currently erase suicides of multiple stones*/
  if (block.length == 1 && inEye(move, 0) == 3-side) ko = block[0];
  for (let i = 0; i < block.length; i++)
    board[block[i]] = EMPTY;
}

function captures(color, move) { /* Handle captured stones */
  for (let sq = 0; sq < size ** 2; sq++) {
    let stone = board[sq];
    if (stone == OFFBOARD) continue;
    if (stone & color) {
      count(sq, color);
      if (liberties.length == 0) clearBlock(move);	  //maybe can add an ifelse here to check again for suicide
      restoreBoard();
    }
  }
}

function count(sq, color) { /* Count group liberties */
  stone = board[sq];
  if (stone == OFFBOARD) return;
  if (stone && (stone & color) && (stone & MARKER) == 0) {
    block.push(sq);
    board[sq] |= MARKER;
    for (let offset of [1, size, -1, -size]) count(sq+offset, color);
  } else if (stone == EMPTY) {
    board[sq] |= LIBERTY;
    liberties.push(sq);
  }
}

function restoreBoard() { /* Remove group markers */
  block = []; liberties = []; points_side = [];
  for (let sq = 0; sq < size ** 2; sq++) {
    if (board[sq] != OFFBOARD) board[sq] &= 3;
  }
}

function setStone(sq, color, user) { /* Place stone on board */
  if (board[sq] != EMPTY) {
    if (user) alert("Illegal move!");
    return false;
  } else if (sq == ko) {
    if (user) alert("Ko!");
    return false;
  } let old_ko = ko;
  ko = EMPTY;
  board[sq] = color;
  captures(3 - color, sq);
  count(sq, color);
  let suicide = true ? false : true; //we need to redo suicide
  restoreBoard();
  if (suicide) {
    board[sq] = EMPTY;
    ko = old_ko;
    if (user) alert("Suicide move!");
    return false;
  } side = 3 - side;
  userMove = sq;
  return true; /*----- We don't need no stinking suicide rule (though we might have to check for superko?) */ 
}

function getUrgentMoves() { /* Get escape squares of groups with less than 3 liberties */
  let urgent = [];
  for (let sq = 0; sq < size ** 2; sq++) {
    if (board[sq] == OFFBOARD || board[sq] == EMPTY) continue;
    count(sq, board[sq]);
    if (liberties.length < 3)
      for (let sq of liberties) urgent.push(sq);
    restoreBoard();
  };return [...new Set(urgent)];
}

function evaluate() { /* Count captures stones difference */
  let eval = 0;
  let blackStones = 0;
  let whiteStones = 0;
    for (let sq = 0; sq < size ** 2; sq++) {
    if (!board[sq] || board[sq] == OFFBOARD) continue;
    if (board[sq] == BLACK) blackStones += 1;
    if (board[sq] == WHITE) whiteStones += 1;
  } eval += (blackStones - whiteStones);
    return (side == BLACK) ? eval : -eval;
  
}

function search(depth) { /* Recursively search fighting moves */
  if (!depth) return evaluate();
  let bestScore = -10000;
  for (let sq of getUrgentMoves()) {
    for (let offset of [1, size, -1, -size])
      if (board[sq+offset] == OFFBOARD && depth == 1) continue;
    if (sq == ko) continue;
    let oldBoard = JSON.stringify(board);
    let oldSide = side;
    let oldKo = ko;
    if (!setStone(sq, side, false)) continue;
    let eval = -search(depth-1);
    if (eval > bestScore) {
      bestScore = eval;
      if (depth == 6) bestMove = sq;
    } board = JSON.parse(oldBoard);
    side = oldSide;
    ko = oldKo;
  };return bestScore;
}

function tenuki(direction) { /* Play away when no urgent moves */
  for (let sq of [
    (4*size+4), (4*size+(size-5)), ((size-5)*size+4), ((size-5)*size+(size-5)),
    ((size-1)/2*size+3), (3*size+(size-1)/2), ((size-1)/2*size+(size-4)), ((size-4)*size+(size-1)/2)
  ]) {
    if (board[sq] == EMPTY) {
      if (inEye(sq)) break;
      else return sq;
    }
  };if (score()[EMPTY]) {
    let smallestGroup = 100, tenuki = 0;
    for (let sq = 0; sq < size ** 2; sq++) {
      if (board[sq] == (3-side)) {
        let attack = 0;
        count(sq, board[sq]);
        if (liberties.length < smallestGroup) {
          smallestGroup = liberties.length;
          attack = liberties[0];
        } else if (liberties.length) {
          attack = liberties[(direction?liberties.length-1:0)];
        };restoreBoard();
          let libs = 0;
          for (let lib of [1, -1, size, -size])
            if (board[attack+lib] == EMPTY) libs++;
          if (attack&&libs&&attack!=ko) tenuki = attack;
      }
    };return tenuki;
  }
}

function play(depth) { /* Engine plays a move */
  let eval = 0;
  bestMove = 0;
  eval = search(depth);
  if (!bestMove) {
    bestMove = tenuki(1);
    if (!bestMove) bestMove = tenuki(0);
  };let oldSide = side;
  if (!setStone(bestMove, side, false)) {
    side = 3 - side;
    updateScore();
    let empty = score()[EMPTY];
    if (empty == -1) { //rendered useless to override original game ending mechanic
      let finalScore = score();
      finalScore = finalScore[BLACK] - finalScore[WHITE];
      canvas.removeEventListener("click", userInput);
    } setStone(bestMove, side, false); 
    return;
  };drawBoard();
  updateScore();
  let scorePosition = score();
}

// MAIN
canvas.addEventListener('click', userInput);
selectSize.addEventListener("change", function() {
  size = parseInt(selectSize.value);
  cell = canvas.width / size;
  initBoard();
  drawBoard();
  side = BLACK;
  ko = EMPTY;
});

initBoard();
drawBoard();
