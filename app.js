// ══════════════════════════════════════════════════════════════
//  JEE 2026 Mock Test Portal — App Logic
//  ⚙  Configure EmailJS here:
//  1. Go to https://emailjs.com → create free account
//  2. Create an Email Service (Gmail recommended)
//  3. Create an Email Template
//  4. Copy your Service ID, Template ID, Public Key below
// ══════════════════════════════════════════════════════════════

const CONFIG = {
  // ── EmailJS Config ──────────────────────────────────────────
  EMAILJS_PUBLIC_KEY:   "xLKXUTz0Wy_Ehp94w",       // From EmailJS dashboard
  EMAILJS_SERVICE_ID:   "service_ayan",       // e.g. "service_abc123"
  EMAILJS_TEMPLATE_ID:  "template_xib7csz",      // e.g. "template_xyz789"
  
  // ── Admin email (always receives report) ───────────────────
  ADMIN_EMAIL: "ayanchattopadhyay05@gmail.com",           // ← CHANGE THIS
  
  // ── Exam Settings ──────────────────────────────────────────
  EXAM_DURATION_SECONDS: 3 * 60 * 60,           // 3 hours
  MARKS_CORRECT: 4,
  MARKS_WRONG: -1,
  MARKS_SKIPPED: 0,
  TOTAL_MARKS: 360,
};

// ── Initialize EmailJS ───────────────────────────────────────
emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);

// ── State ────────────────────────────────────────────────────
let state = {
  studentName: "",
  studentEmail: "",
  currentSubject: 0,       // 0=Physics, 1=Chem, 2=Math
  currentQIndex: 0,        // within subject
  answers: {},             // key: globalIndex, value: 0-3
  marked: new Set(),       // globalIndex
  visited: new Set(),      // globalIndex
  timerInterval: null,
  timeLeft: CONFIG.EXAM_DURATION_SECONDS,
  submitted: false,
};

const SUBJECT_NAMES = ["Physics", "Chemistry", "Mathematics"];
const SUBJECT_COUNTS = [PHY.length, CHEM.length, MATH.length];
const SUBJECT_KEYS = ["physics", "chemistry", "math"];

// ── Global index helpers ─────────────────────────────────────
function getGlobalIndex(subjectIdx, qIdx) {
  let offset = 0;
  for(let i = 0; i < subjectIdx; i++) offset += SUBJECT_COUNTS[i];
  return offset + qIdx;
}

function getCurrentGlobalIndex() {
  return getGlobalIndex(state.currentSubject, state.currentQIndex);
}

function getQuestionByGlobal(gi) {
  return ALL_QUESTIONS[gi];
}

function getSubjectQuestions(si) {
  if(si===0) return PHY;
  if(si===1) return CHEM;
  return MATH;
}

// ═══════════════════════════════════════════════════════
//   LANDING
// ═══════════════════════════════════════════════════════
function startExam() {
  const nameInput = document.getElementById('student-name').value.trim();
  const emailInput = document.getElementById('student-email').value.trim();
  
  if(!nameInput) {
    document.getElementById('student-name').style.borderColor = '#ef4444';
    document.getElementById('student-name').placeholder = 'Please enter your name!';
    return;
  }
  
  state.studentName = nameInput;
  state.studentEmail = emailInput;
  state.answers = {};
  state.marked = new Set();
  state.visited = new Set();
  state.timeLeft = CONFIG.EXAM_DURATION_SECONDS;
  state.currentSubject = 0;
  state.currentQIndex = 0;
  state.submitted = false;
  
  showScreen('exam');
  document.getElementById('header-name').textContent = nameInput;
  buildPalette();
  renderQuestion();
  startTimer();
}

// ═══════════════════════════════════════════════════════
//   TIMER
// ═══════════════════════════════════════════════════════
function startTimer() {
  if(state.timerInterval) clearInterval(state.timerInterval);
  updateTimerDisplay();
  state.timerInterval = setInterval(() => {
    state.timeLeft--;
    updateTimerDisplay();
    if(state.timeLeft <= 600) {
      document.getElementById('timer').classList.add('warning');
    }
    if(state.timeLeft <= 0) {
      clearInterval(state.timerInterval);
      submitExam();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const h = Math.floor(state.timeLeft / 3600);
  const m = Math.floor((state.timeLeft % 3600) / 60);
  const s = state.timeLeft % 60;
  document.getElementById('timer').textContent =
    String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}

// ═══════════════════════════════════════════════════════
//   SUBJECT SWITCHING
// ═══════════════════════════════════════════════════════
function switchSubject(si) {
  state.currentSubject = si;
  state.currentQIndex = 0;
  // Update tabs
  for(let i=0;i<3;i++) {
    document.getElementById('stab-'+i).classList.toggle('active', i===si);
  }
  renderQuestion();
  updatePalette();
}

// ═══════════════════════════════════════════════════════
//   QUESTION RENDERING
// ═══════════════════════════════════════════════════════
function renderQuestion() {
  const qs = getSubjectQuestions(state.currentSubject);
  const q = qs[state.currentQIndex];
  const gi = getCurrentGlobalIndex();
  
  state.visited.add(gi);
  
  // Meta
  const tag = document.getElementById('q-subject-tag');
  tag.textContent = SUBJECT_NAMES[state.currentSubject];
  tag.className = 'q-subject-tag ' + SUBJECT_KEYS[state.currentSubject];
  
  document.getElementById('q-number').textContent =
    `Q${state.currentQIndex+1} of ${qs.length}`;
  document.getElementById('q-topic').textContent = q.topic;
  document.getElementById('q-text').innerHTML = formatMath(q.question);
  
  // Options
  const grid = document.getElementById('options-grid');
  grid.innerHTML = '';
  const labels = ['A','B','C','D'];
  const selectedAns = state.answers[gi] ?? -1;
  
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn' + (selectedAns === i ? ' selected' : '');
    btn.innerHTML = `<span class="option-label">${labels[i]}</span><span>${formatMath(opt)}</span>`;
    btn.onclick = () => selectOption(i);
    grid.appendChild(btn);
  });
  
  updatePalette();
  updateScorePreview();
}

function formatMath(text) {
  // Basic math formatting
  return text
    .replace(/\^(\d+)/g, '<sup>$1</sup>')
    .replace(/\_(\d+)/g, '<sub>$1</sub>')
    .replace(/√/g, '√')
    .replace(/π/g, 'π')
    .replace(/∞/g, '∞')
    .replace(/±/g, '±')
    .replace(/≤/g, '≤')
    .replace(/≥/g, '≥');
}

function selectOption(optIdx) {
  const gi = getCurrentGlobalIndex();
  state.answers[gi] = optIdx;
  renderQuestion();
}

function clearResponse() {
  const gi = getCurrentGlobalIndex();
  delete state.answers[gi];
  state.marked.delete(gi);
  renderQuestion();
}

function markForReview() {
  const gi = getCurrentGlobalIndex();
  if(state.marked.has(gi)) {
    state.marked.delete(gi);
  } else {
    state.marked.add(gi);
  }
  updatePalette();
}

function nextQuestion() {
  const qs = getSubjectQuestions(state.currentSubject);
  if(state.currentQIndex < qs.length - 1) {
    state.currentQIndex++;
    renderQuestion();
  } else {
    // Move to next subject
    if(state.currentSubject < 2) {
      switchSubject(state.currentSubject + 1);
    }
  }
}

function prevQuestion() {
  if(state.currentQIndex > 0) {
    state.currentQIndex--;
    renderQuestion();
  } else {
    if(state.currentSubject > 0) {
      state.currentSubject--;
      state.currentQIndex = getSubjectQuestions(state.currentSubject).length - 1;
      document.getElementById('stab-'+state.currentSubject).click();
    }
  }
}

// ═══════════════════════════════════════════════════════
//   PALETTE
// ═══════════════════════════════════════════════════════
function buildPalette() {
  const grid = document.getElementById('palette-grid');
  grid.innerHTML = '';
  
  ALL_QUESTIONS.forEach((q, gi) => {
    const btn = document.createElement('button');
    btn.className = 'pal-btn';
    btn.id = 'pal-'+gi;
    btn.textContent = gi + 1;
    btn.onclick = () => jumpToQuestion(gi);
    grid.appendChild(btn);
  });
}

function updatePalette() {
  const curGI = getCurrentGlobalIndex();
  ALL_QUESTIONS.forEach((q, gi) => {
    const btn = document.getElementById('pal-'+gi);
    if(!btn) return;
    btn.className = 'pal-btn';
    if(state.answers[gi] !== undefined) btn.classList.add('answered');
    else if(state.marked.has(gi)) btn.classList.add('marked');
    else if(state.visited.has(gi)) btn.classList.add('visited');
    if(gi === curGI) btn.classList.add('current');
  });
}

function jumpToQuestion(gi) {
  // Find subject and index
  let offset = 0;
  for(let si=0; si<3; si++) {
    const cnt = SUBJECT_COUNTS[si];
    if(gi < offset + cnt) {
      state.currentSubject = si;
      state.currentQIndex = gi - offset;
      for(let i=0;i<3;i++) document.getElementById('stab-'+i).classList.toggle('active', i===si);
      renderQuestion();
      return;
    }
    offset += cnt;
  }
}

function updateScorePreview() {
  const attempted = Object.keys(state.answers).length;
  const marked = state.marked.size;
  const remaining = ALL_QUESTIONS.length - attempted;
  document.getElementById('prev-attempted').textContent = attempted;
  document.getElementById('prev-marked').textContent = marked;
  document.getElementById('prev-remaining').textContent = remaining;
}

// ═══════════════════════════════════════════════════════
//   SUBMIT
// ═══════════════════════════════════════════════════════
function confirmSubmit() {
  const attempted = Object.keys(state.answers).length;
  const remaining = ALL_QUESTIONS.length - attempted;
  
  document.getElementById('modal-stats').innerHTML = `
    <div style="color:var(--correct)">✓ Answered: <strong>${attempted}</strong></div>
    <div style="color:var(--wrong)">✗ Not Answered: <strong>${remaining}</strong></div>
    <div style="color:var(--marked)">★ Marked for Review: <strong>${state.marked.size}</strong></div>
  `;
  document.getElementById('submit-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('submit-modal').style.display = 'none';
}

function submitExam() {
  closeModal();
  if(state.timerInterval) clearInterval(state.timerInterval);
  state.submitted = true;
  calculateAndShowResults();
}

// ═══════════════════════════════════════════════════════
//   RESULTS
// ═══════════════════════════════════════════════════════
function calculateAndShowResults() {
  let totalScore = 0;
  let subScores = [0,0,0];
  let subCorrect = [0,0,0];
  let subWrong = [0,0,0];
  let subSkipped = [0,0,0];
  
  ALL_QUESTIONS.forEach((q, gi) => {
    let si = gi < PHY.length ? 0 : (gi < PHY.length + CHEM.length ? 1 : 2);
    const userAns = state.answers[gi];
    
    if(userAns === undefined) {
      subSkipped[si]++;
    } else if(userAns === q.correct) {
      subScores[si] += CONFIG.MARKS_CORRECT;
      totalScore += CONFIG.MARKS_CORRECT;
      subCorrect[si]++;
    } else {
      subScores[si] += CONFIG.MARKS_WRONG;
      totalScore += CONFIG.MARKS_WRONG;
      subWrong[si]++;
    }
  });
  
  // Populate result screen
  document.getElementById('result-name').textContent = state.studentName;
  document.getElementById('result-score-big').textContent = `${totalScore} / ${CONFIG.TOTAL_MARKS}`;
  
  const pct = ((totalScore / CONFIG.TOTAL_MARKS) * 100).toFixed(1);
  let grade = totalScore >= 288 ? "🏆 Outstanding" : totalScore >= 216 ? "🥇 Excellent" : totalScore >= 144 ? "📚 Good" : "💪 Keep Practicing";
  document.getElementById('result-percentile').textContent = `${pct}% — ${grade}`;
  document.getElementById('result-badge').textContent = grade.split(' ')[1];
  
  const subNames = ['phy','chem','math'];
  const subLabels = ['Physics','Chemistry','Mathematics'];
  [0,1,2].forEach(si => {
    document.getElementById(`res-${subNames[si]}-score`).textContent = `${subScores[si]}/120`;
    document.getElementById(`res-${subNames[si]}-detail`).innerHTML = 
      `<span style="color:var(--correct)">✓ ${subCorrect[si]} correct</span> &nbsp; <span style="color:var(--wrong)">✗ ${subWrong[si]} wrong</span> &nbsp; <span style="color:var(--text3)">— ${subSkipped[si]} skipped</span>`;
  });
  
  // Pre-fill student email
  if(state.studentEmail) {
    document.getElementById('report-email').value = state.studentEmail;
  }
  
  // Build solutions
  buildSolutions();
  
  showScreen('result');
  
  // Auto-send to admin
  autoSendAdminEmail(totalScore, subScores, subCorrect, subWrong, subSkipped);
}

// ═══════════════════════════════════════════════════════
//   SOLUTIONS
// ═══════════════════════════════════════════════════════
let solutionCards = [];

function buildSolutions() {
  const list = document.getElementById('solutions-list');
  list.innerHTML = '';
  solutionCards = [];
  const labels = ['A','B','C','D'];
  
  ALL_QUESTIONS.forEach((q, gi) => {
    const userAns = state.answers[gi];
    const isCorrect = userAns === q.correct;
    const isSkipped = userAns === undefined;
    
    let status = isSkipped ? 'skipped' : (isCorrect ? 'correct' : 'wrong');
    let marks = isSkipped ? 0 : (isCorrect ? CONFIG.MARKS_CORRECT : CONFIG.MARKS_WRONG);
    let marksClass = marks > 0 ? 'pos' : (marks < 0 ? 'neg' : 'zero');
    let marksStr = marks > 0 ? '+'+marks : String(marks);
    
    let subjectStr = q.subject;
    
    // Options HTML
    let optsHTML = q.options.map((opt, i) => {
      let cls = '';
      if(i === q.correct) cls = 'sol-correct';
      else if(i === userAns && userAns !== q.correct) cls = 'sol-user-wrong';
      let icon = '';
      if(i === q.correct) icon = '✓ ';
      else if(i === userAns && !isCorrect) icon = '✗ ';
      return `<div class="sol-option ${cls}">
        <span class="sol-opt-label">${labels[i]}</span>
        <span>${icon}${formatMath(opt)}</span>
      </div>`;
    }).join('');
    
    const card = document.createElement('div');
    card.className = `solution-card ${status}-card`;
    card.dataset.status = status;
    card.dataset.subject = subjectStr;
    card.innerHTML = `
      <div class="sol-header">
        <span class="sol-qnum">Q${gi+1}</span>
        <span class="q-subject-tag ${subjectStr}">${SUBJECT_NAMES[subjectStr==='physics'?0:subjectStr==='chemistry'?1:2]}</span>
        <span class="q-topic">${q.topic}</span>
        <span class="sol-status ${status}">${status==='correct'?'✓ Correct':status==='wrong'?'✗ Wrong':'— Skipped'}</span>
        <span class="sol-marks ${marksClass}">${marksStr} marks</span>
      </div>
      <div class="sol-question">${formatMath(q.question)}</div>
      <div class="sol-options">${optsHTML}</div>
      ${!isSkipped && !isCorrect ? `<div style="margin-bottom:8px;font-size:13px;color:var(--text2)">Your answer: <strong style="color:var(--wrong)">${labels[userAns]}</strong> &nbsp; Correct: <strong style="color:var(--correct)">${labels[q.correct]}</strong></div>` : ''}
      <div class="sol-explanation"><strong>EXPLANATION →</strong> ${q.explanation}</div>
    `;
    
    list.appendChild(card);
    solutionCards.push(card);
  });
}

function filterSolutions(filter) {
  // Update filter tab
  document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  solutionCards.forEach(card => {
    let show = false;
    if(filter === 'all') show = true;
    else if(filter === 'correct') show = card.dataset.status === 'correct';
    else if(filter === 'wrong') show = card.dataset.status === 'wrong';
    else if(filter === 'skipped') show = card.dataset.status === 'skipped';
    else if(filter === 'physics') show = card.dataset.subject === 'physics';
    else if(filter === 'chemistry') show = card.dataset.subject === 'chemistry';
    else if(filter === 'math') show = card.dataset.subject === 'math';
    card.style.display = show ? 'block' : 'none';
  });
}

// ═══════════════════════════════════════════════════════
//   EMAIL REPORTS
// ═══════════════════════════════════════════════════════
function buildEmailReport() {
  let correct = 0, wrong = 0, skipped = 0, total = 0;
  const details = [];
  const labels = ['A','B','C','D'];
  
  ALL_QUESTIONS.forEach((q, gi) => {
    const userAns = state.answers[gi];
    const isCorrect = userAns === q.correct;
    const isSkipped = userAns === undefined;
    
    if(isSkipped) { skipped++; }
    else if(isCorrect) { correct++; total += CONFIG.MARKS_CORRECT; }
    else { wrong++; total += CONFIG.MARKS_WRONG; }
    
    details.push(
      `Q${gi+1} [${q.subject.toUpperCase()}] ${q.topic}: ` +
      `${isSkipped ? 'Skipped' : (isCorrect ? '✓ Correct' : `✗ Wrong (Yours: ${labels[userAns]}, Correct: ${labels[q.correct]})`)} `
    );
  });
  
  return {
    student_name: state.studentName,
    score: `${total} / ${CONFIG.TOTAL_MARKS}`,
    percentage: `${((total/CONFIG.TOTAL_MARKS)*100).toFixed(1)}%`,
    correct: correct,
    wrong: wrong,
    skipped: skipped,
    details: details.join('\n'),
    date: new Date().toLocaleString('en-IN'),
  };
}

function autoSendAdminEmail(totalScore, subScores, subCorrect, subWrong, subSkipped) {
  if(CONFIG.EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') return; // Not configured
  
  const report = buildEmailReport();
  emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, {
    to_email: CONFIG.ADMIN_EMAIL,
    to_name: "Admin",
    student_name: report.student_name,
    score: report.score,
    percentage: report.percentage,
    correct: report.correct,
    wrong: report.wrong,
    skipped: report.skipped,
    physics_score: subScores[0] + '/120 (' + subCorrect[0] + 'C/' + subWrong[0] + 'W/' + subSkipped[0] + 'S)',
    chemistry_score: subScores[1] + '/120 (' + subCorrect[1] + 'C/' + subWrong[1] + 'W/' + subSkipped[1] + 'S)',
    math_score: subScores[2] + '/120 (' + subCorrect[2] + 'C/' + subWrong[2] + 'W/' + subSkipped[2] + 'S)',
    details: report.details,
    date: report.date,
  }).catch(() => {}); // Silent fail for admin
}

async function sendEmailReport() {
  const emailInput = document.getElementById('report-email');
  const statusEl = document.getElementById('email-status');
  const email = emailInput.value.trim();
  
  if(!email || !email.includes('@')) {
    statusEl.textContent = '⚠ Please enter a valid email address.';
    statusEl.className = 'email-status error';
    return;
  }
  
  if(CONFIG.EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
    statusEl.innerHTML = '⚠ EmailJS not configured yet. See the <code>CONFIG</code> object in <b>app.js</b> to set up free email. <a href="https://emailjs.com" target="_blank" style="color:var(--accent)">→ Setup EmailJS</a>';
    statusEl.className = 'email-status error';
    return;
  }
  
  statusEl.textContent = '⏳ Sending...';
  statusEl.className = 'email-status';
  
  const report = buildEmailReport();
  
  try {
    await emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, {
      to_email: email,
      to_name: state.studentName,
      student_name: report.student_name,
      score: report.score,
      percentage: report.percentage,
      correct: report.correct,
      wrong: report.wrong,
      skipped: report.skipped,
      details: report.details,
      date: report.date,
    });
    statusEl.textContent = '✓ Report sent successfully to ' + email;
    statusEl.className = 'email-status success';
  } catch(err) {
    statusEl.textContent = '✗ Failed to send. Check EmailJS configuration. Error: ' + (err.text || JSON.stringify(err));
    statusEl.className = 'email-status error';
  }
}

// ═══════════════════════════════════════════════════════
//   SCREEN MANAGEMENT
// ═══════════════════════════════════════════════════════
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
}

function retakeExam() {
  showScreen('landing');
  state = {
    studentName: "",
    studentEmail: "",
    currentSubject: 0,
    currentQIndex: 0,
    answers: {},
    marked: new Set(),
    visited: new Set(),
    timerInterval: null,
    timeLeft: CONFIG.EXAM_DURATION_SECONDS,
    submitted: false,
  };
}

// ═══════════════════════════════════════════════════════
//   KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════
document.addEventListener('keydown', (e) => {
  if(!document.getElementById('screen-exam').classList.contains('active')) return;
  
  const key = e.key;
  if(key === 'ArrowRight' || key === 'n') nextQuestion();
  else if(key === 'ArrowLeft' || key === 'p') prevQuestion();
  else if(key === '1' || key === 'a') selectOption(0);
  else if(key === '2' || key === 'b') selectOption(1);
  else if(key === '3' || key === 'c') selectOption(2);
  else if(key === '4' || key === 'd') selectOption(3);
  else if(key === 'm') markForReview();
  else if(key === 'Escape') closeModal();
});
