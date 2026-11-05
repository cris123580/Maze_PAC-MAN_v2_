const width = 28, height = 31;
const grid = document.querySelector('.grid');
const $ = id => document.getElementById(id);
const squares = [];
const PAC_START = 490, LAIR_EXIT = 10 * width + 13, QUESTION_EVERY = 6, MAX_LEVEL = 3;
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // omhoog, rechts, omlaag, links

let score = 0, level = 1, lives = 3, streak = 0, remaining = 0, dotsSinceQ = 0;
let pac = PAC_START, dir = -1, nextDir = -1, pacDrawn = PAC_START;
let paused = true, running = false, gt = 0, prevNow = 0, lastPac = 0;
let scaredUntil = 0, combo = 0, nextFruit = 0, fruitUntil = 0, drawn = [];
let boardCreated = false, loop = null, msgTimer = null;
let highScore = 0;
try { highScore = Number(localStorage.getItem('mathMazeHigh')) || 0; } catch (e) {}

class Ghost {
  constructor(name, startIndex, speed, delay) {
    Object.assign(this, { name, startIndex, speed, delay });
    this.reset(0);
  }
  reset(now) {
    this.index = this.startIndex; this.dir = 0; this.last = 0;
    this.inLair = true; this.scared = false;
    this.releaseAt = now + this.delay / level;
  }
}
const ghosts = [
  new Ghost('blinky', 348, 230, 500),
  new Ghost('pinky', 376, 250, 2500),
  new Ghost('inky', 351, 250, 5000),
  new Ghost('clyde', 379, 280, 8000)
];

const layout = [
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,
  1,3,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,3,1,
  1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,1,
  1,0,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,
  1,1,1,1,1,1,0,1,1,4,4,4,4,4,4,4,4,4,4,1,1,0,1,1,1,1,1,1,
  1,1,1,1,1,1,0,1,1,4,1,1,1,2,2,1,1,1,4,1,1,0,1,1,1,1,1,1,
  1,1,1,1,1,1,0,1,1,4,1,2,2,2,2,2,2,1,4,1,1,0,1,1,1,1,1,1,
  4,4,4,4,4,4,0,0,0,4,1,2,2,2,2,2,2,1,4,0,0,0,4,4,4,4,4,4,
  1,1,1,1,1,1,0,1,1,4,1,2,2,2,2,2,2,1,4,1,1,0,1,1,1,1,1,1,
  1,1,1,1,1,1,0,1,1,4,1,1,1,1,1,1,1,1,4,1,1,0,1,1,1,1,1,1,
  1,1,1,1,1,1,0,1,1,4,1,1,1,1,1,1,1,1,4,1,1,0,1,1,1,1,1,1,
  1,1,1,1,1,1,0,1,1,4,1,1,1,1,1,1,1,1,4,1,1,0,1,1,1,1,1,1,
  1,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,1,
  1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,
  1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,
  1,3,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,3,1,
  1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1,
  1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1,
  1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1,
  1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,
  1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
];

/* ---------- bord ---------- */
function createBoard() {
  if (boardCreated) return;
  layout.forEach(v => {
    const sq = document.createElement('div');
    grid.appendChild(sq);
    squares.push(sq);
    if (v === 1) sq.classList.add('wall');
    if (v === 2) sq.classList.add('ghost-lair');
  });
  boardCreated = true;
}

function fillDots() {
  remaining = 0;
  squares.forEach((sq, i) => {
    sq.classList.remove('pac-dot', 'power-pellet', 'fruit');
    const v = layout[i];
    if ((v === 0 || v === 4) && i !== PAC_START) { sq.classList.add('pac-dot'); remaining++; }
    if (v === 3) { sq.classList.add('power-pellet'); remaining++; }
  });
  dotsSinceQ = 0;
}

const isWall = i => squares[i].classList.contains('wall');
const isLair = i => layout[i] === 2;
const canPac = i => i >= 0 && !isWall(i) && !isLair(i);

function stepIndex(i, d) {
  if (d < 0) return -1;
  const x = (i % width + DIRS[d][0] + width) % width; // tunnel: links <-> rechts
  const y = Math.floor(i / width) + DIRS[d][1];
  return y < 0 || y >= height ? -1 : y * width + x;
}

/* ---------- start / loop ---------- */
function startGame() {
  $('menu').style.display = 'none';
  $('game').style.display = 'block';
  createBoard();
  fillDots();
  resetPositions();
  document.addEventListener('keydown', onKey);
  prevNow = performance.now();
  running = true;
  updateHud();
  showMsg('Klaar? Gebruik de pijltjes of W A S D!', 2000);
  paused = false;
  loop = setInterval(tick, 40);
}

function onKey(e) {
  const map = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3, w: 0, d: 1, s: 2, a: 3, W: 0, D: 1, S: 2, A: 3 };
  if (!(e.key in map)) return;
  e.preventDefault();
  nextDir = map[e.key];
}

function resetPositions() {
  pac = PAC_START; dir = -1; nextDir = -1; combo = 0; scaredUntil = 0;
  ghosts.forEach(g => g.reset(gt));
  nextFruit = gt + 15000; fruitUntil = 0;
  squares.forEach(s => s.classList.remove('fruit'));
}

function tick() {
  const now = performance.now();
  if (!paused) gt += now - prevNow;
  prevNow = now;
  if (paused || !running) return;

  if (scaredUntil && gt > scaredUntil) {
    scaredUntil = 0; combo = 0;
    ghosts.forEach(g => g.scared = false);
  }
  const pacSpeed = Math.max(95, 140 - level * 8);
  if (gt - lastPac >= pacSpeed) { lastPac = gt; movePac(); }
  if (!running || paused) return;

  ghosts.forEach(g => {
    const sp = (g.scared ? g.speed * 1.6 : g.speed) * (1 - 0.1 * (level - 1));
    if (gt - g.last >= sp) { g.last = gt; moveGhost(g); }
  });
  checkCollisions();
  handleFruit();
  draw();
}

/* ---------- Pac-Man ---------- */
function movePac() {
  let n = stepIndex(pac, nextDir);
  if (canPac(n)) dir = nextDir; else n = stepIndex(pac, dir);
  if (!canPac(n)) return;
  pac = n;
  const c = squares[pac].classList;
  if (c.contains('pac-dot')) {
    c.remove('pac-dot'); remaining--; score += 10; dotsSinceQ++;
  } else if (c.contains('power-pellet')) {
    c.remove('power-pellet'); remaining--; score += 50; combo = 0;
    scaredUntil = gt + Math.max(4000, 9000 - level * 1500);
    ghosts.forEach(g => { if (!g.inLair) g.scared = true; });
  } else if (c.contains('fruit')) {
    c.remove('fruit'); score += 300; showMsg('🍒 +300 bonus!', 1200);
  }
  updateHud();
  checkCollisions();
  if (!running) return;
  if (remaining <= 0) return levelComplete();
  if (dotsSinceQ >= QUESTION_EVERY) askQuestion();
}

function handleFruit() {
  const sq = squares[PAC_START].classList;
  if (!fruitUntil && gt > nextFruit && pac !== PAC_START) { sq.add('fruit'); fruitUntil = gt + 8000; }
  if (fruitUntil && gt > fruitUntil) { sq.remove('fruit'); fruitUntil = 0; nextFruit = gt + 15000; }
}

/* ---------- geesten ---------- */
function ghostTarget(g) {
  const px = pac % width, py = Math.floor(pac / width);
  const [dx, dy] = dir >= 0 ? DIRS[dir] : [0, 0];
  const gx = g.index % width, gy = Math.floor(g.index / width);
  switch (g.name) {
    case 'blinky': return [px, py];                                   // jaagt direct
    case 'pinky': return [px + 4 * dx, py + 4 * dy];                  // onderschept
    case 'inky': {                                                    // omsingelt samen met Blinky
      const b = ghosts[0], bx = b.index % width, by = Math.floor(b.index / width);
      return [2 * (px + 2 * dx) - bx, 2 * (py + 2 * dy) - by];
    }
    default: return Math.hypot(gx - px, gy - py) > 8 ? [px, py] : [1, height - 2]; // Clyde durft niet te dichtbij
  }
}

function moveGhost(g) {
  if (gt < g.releaseAt) return;
  const ok = d => {
    const n = stepIndex(g.index, d);
    return n >= 0 && !isWall(n) && (g.inLair || !isLair(n));
  };
  let opts = [0, 1, 2, 3].filter(d => ok(d) && (g.inLair || (d + 2) % 4 !== g.dir));
  if (!opts.length) opts = [0, 1, 2, 3].filter(ok);
  if (!opts.length) return;

  let best;
  if (g.scared) {
    best = opts[Math.floor(Math.random() * opts.length)];
  } else {
    const [tx, ty] = g.inLair ? [LAIR_EXIT % width, Math.floor(LAIR_EXIT / width)] : ghostTarget(g);
    let bd = Infinity;
    opts.forEach(d => {
      const n = stepIndex(g.index, d);
      const dist = Math.hypot((n % width) - tx, Math.floor(n / width) - ty) + Math.random() * 0.1;
      if (dist < bd) { bd = dist; best = d; }
    });
  }
  g.dir = best;
  g.index = stepIndex(g.index, best);
  if (!isLair(g.index)) g.inLair = false;
}

function checkCollisions() {
  for (const g of ghosts) {
    if (g.index !== pac || gt < g.releaseAt) continue;
    if (g.scared) {
      combo++;
      score += 100 * Math.pow(2, combo);
      showMsg(`Spook opgegeten! +${100 * Math.pow(2, combo)}`, 1000);
      g.reset(gt); g.releaseAt = gt + 3000;
      updateHud();
    } else {
      loseLife('Au! Een spook ving je.');
      return;
    }
  }
}

/* ---------- vragen ---------- */
const r = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

function makeQuestion() {
  let text, ans;
  if (level === 1) { const a = r(1, 15), b = r(1, 15); text = `${a} + ${b}`; ans = a + b; }
  else if (level === 2) {
    if (Math.random() < 0.5) { const a = r(5, 30), b = r(5, 30); text = `${a} + ${b}`; ans = a + b; }
    else { const a = r(10, 40), b = r(1, a); text = `${a} − ${b}`; ans = a - b; }
  } else { const a = r(2, 9), b = r(2, 9); text = `${a} × ${b}`; ans = a * b; }
  const answers = [ans];
  while (answers.length < 4) {
    const w = ans + r(-6, 6);
    if (w > 0 && !answers.includes(w)) answers.push(w);
  }
  return { text, ans, answers: answers.sort(() => Math.random() - 0.5) };
}

function askQuestion() {
  paused = true; dotsSinceQ = 0;
  const q = makeQuestion();
  $('question').textContent = `Wat is ${q.text}?`;
  $('answers').style.display = 'block';
  ['answer1', 'answer2', 'answer3', 'answer4'].forEach((id, i) => {
    const b = $(id);
    b.textContent = q.answers[i];
    b.onclick = () => checkAnswer(q.answers[i] === q.ans, q.ans);
  });
}

function checkAnswer(correct, ans) {
  $('answers').style.display = 'none';
  $('question').textContent = '';
  if (correct) {
    streak++;
    const bonus = 50 + streak * 10;
    score += bonus;
    let text = `Goed zo! +${bonus}`;
    if (streak % 5 === 0 && lives < 5) { lives++; text += ' ❤️ extra leven!'; }
    showMsg(text, 1500);
    updateHud();
    paused = false;
  } else {
    streak = 0;
    loseLife(`Fout! Het antwoord was ${ans}.`);
  }
}

/* ---------- levens, levels, einde ---------- */
function loseLife(text) {
  lives--;
  updateHud();
  if (lives <= 0) return gameOver();
  paused = true;
  showMsg(text, 1400);
  setTimeout(() => { resetPositions(); draw(); paused = false; }, 1400);
}

function levelComplete() {
  level++;
  if (level > MAX_LEVEL) { level = MAX_LEVEL; return winGame(); }
  paused = true;
  showMsg('Gefeliciteerd, je gaat naar het volgende level!', 2500);
  setTimeout(() => { fillDots(); resetPositions(); updateHud(); draw(); paused = false; }, 2500);
}

function saveHigh() {
  if (score > highScore) { highScore = score; try { localStorage.setItem('mathMazeHigh', highScore); } catch (e) {} }
}

function endGame(screen, scoreId, levelId) {
  running = false; paused = true;
  clearInterval(loop);
  saveHigh();
  $('game').style.display = 'none';
  $(screen).style.display = 'block';
  $(scoreId).textContent = score;
  $(levelId).textContent = level;
  document.querySelectorAll('.high').forEach(el => el.textContent = highScore);
}
const gameOver = () => endGame('gameover', 'final-score', 'final-level');
const winGame = () => endGame('win', 'win-score', 'win-level');

/* ---------- weergave ---------- */
function updateHud() {
  $('score').textContent = score;
  $('level').textContent = level;
  $('lives').textContent = '❤️'.repeat(lives);
  $('high').textContent = Math.max(highScore, score);
}

function showMsg(text, ms) {
  const m = $('message');
  m.textContent = text; m.style.opacity = 1;
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => m.style.opacity = 0, ms);
}

function draw() {
  drawn.forEach(i => squares[i].classList.remove('ghost', 'blinky', 'pinky', 'inky', 'clyde', 'scared-ghost', 'flash'));
  drawn = [];
  ghosts.forEach(g => {
    const c = squares[g.index].classList;
    c.add('ghost', g.name);
    if (g.scared) { c.add('scared-ghost'); if (scaredUntil - gt < 2000) c.add('flash'); }
    drawn.push(g.index);
  });
  squares[pacDrawn].classList.remove('pac-man');
  squares[pacDrawn].removeAttribute('data-face');
  pacDrawn = pac;
  squares[pac].classList.add('pac-man');
  squares[pac].dataset.face = dir < 0 ? 1 : dir;
}
