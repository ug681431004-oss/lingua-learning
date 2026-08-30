// ============================================================================
// API URL - Auto-detect for localhost or Render
// ============================================================================
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : `${window.location.origin}/api`;

console.log('🔗 API URL:', API_URL);

// ============================================================================
// VOCABULARY DATABASE
// ============================================================================
const CATEGORIES = [
  { name:"Greetings", words:[
    {en:"Hello", ar:"مرحبا", th:"สวัสดี", ms:"Helo"},
    {en:"Thank you", ar:"شكرا", th:"ขอบคุณ", ms:"Terima kasih"},
    {en:"Yes", ar:"نعم", th:"ใช่", ms:"Ya"},
    {en:"No", ar:"لا", th:"ไม่", ms:"Tidak"},
    {en:"Goodbye", ar:"مع السلامة", th:"ลาก่อน", ms:"Selamat tinggal"},
    {en:"Please", ar:"من فضلك", th:"โปรด", ms:"Sila"},
    {en:"Sorry", ar:"آسف", th:"ขอโทษ", ms:"Maaf"},
    {en:"Welcome", ar:"أهلا بك", th:"ยินดีต้อนรับ", ms:"Selamat datang"},
    {en:"Good morning", ar:"صباح الخير", th:"อรุณสวัสดิ์", ms:"Selamat pagi"},
    {en:"Good night", ar:"تصبح على خير", th:"ราตรีสวัสดิ์", ms:"Selamat malam"}
  ]},
  { name:"Numbers", words:[
    {en:"One", ar:"واحد", th:"หนึ่ง", ms:"Satu"},
    {en:"Two", ar:"اثنان", th:"สอง", ms:"Dua"},
    {en:"Three", ar:"ثلاثة", th:"สาม", ms:"Tiga"},
    {en:"Four", ar:"أربعة", th:"สี่", ms:"Empat"},
    {en:"Five", ar:"خمسة", th:"ห้า", ms:"Lima"},
    {en:"Six", ar:"ستة", th:"หก", ms:"Enam"},
    {en:"Seven", ar:"سبعة", th:"เจ็ด", ms:"Tujuh"},
    {en:"Eight", ar:"ثمانية", th:"แปด", ms:"Lapan"},
    {en:"Nine", ar:"تسعة", th:"เก้า", ms:"Sembilan"},
    {en:"Ten", ar:"عشرة", th:"สิบ", ms:"Sepuluh"}
  ]},
  { name:"Colors", words:[
    {en:"Red", ar:"أحمر", th:"สีแดง", ms:"Merah"},
    {en:"Blue", ar:"أزرق", th:"สีฟ้า", ms:"Biru"},
    {en:"Green", ar:"أخضر", th:"สีเขียว", ms:"Hijau"},
    {en:"Yellow", ar:"أصفر", th:"สีเหลือง", ms:"Kuning"},
    {en:"Black", ar:"أسود", th:"สีดำ", ms:"Hitam"},
    {en:"White", ar:"أبيض", th:"สีขาว", ms:"Putih"},
    {en:"Brown", ar:"بني", th:"สีน้ำตาล", ms:"Coklat"},
    {en:"Purple", ar:"بنفسجي", th:"สีม่วง", ms:"Ungu"}
  ]},
  { name:"Animals", words:[
    {en:"Cat", ar:"قطة", th:"แมว", ms:"Kucing"},
    {en:"Dog", ar:"كلب", th:"หมา", ms:"Anjing"},
    {en:"Bird", ar:"طائر", th:"นก", ms:"Burung"},
    {en:"Fish", ar:"سمكة", th:"ปลา", ms:"Ikan"},
    {en:"Elephant", ar:"فيل", th:"ช้าง", ms:"Gajah"},
    {en:"Horse", ar:"حصان", th:"ม้า", ms:"Kuda"},
    {en:"Lion", ar:"أسد", th:"สิงโต", ms:"Singa"},
    {en:"Rabbit", ar:"أرنب", th:"กระต่าย", ms:"Arnab"}
  ]},
  { name:"Family", words:[
    {en:"Mother", ar:"أم", th:"แม่", ms:"Ibu"},
    {en:"Father", ar:"أب", th:"พ่อ", ms:"Bapa"},
    {en:"Grandmother", ar:"جدة", th:"ยาย", ms:"Nenek"},
    {en:"Grandfather", ar:"جد", th:"ตา", ms:"Datuk"},
    {en:"Son", ar:"ابن", th:"ลูกชาย", ms:"Anak lelaki"},
    {en:"Daughter", ar:"ابنة", th:"ลูกสาว", ms:"Anak perempuan"},
    {en:"Brother", ar:"أخ", th:"พี่ชาย", ms:"Saudara lelaki"},
    {en:"Sister", ar:"أخت", th:"พี่สาว", ms:"Saudara perempuan"}
  ]},
  { name:"Food", words:[
    {en:"Rice", ar:"أرز", th:"ข้าว", ms:"Nasi"},
    {en:"Water", ar:"ماء", th:"น้ำ", ms:"Air"},
    {en:"Bread", ar:"خبز", th:"ขนมปัง", ms:"Roti"},
    {en:"Egg", ar:"بيضة", th:"ไข่", ms:"Telur"},
    {en:"Milk", ar:"حليب", th:"นม", ms:"Susu"},
    {en:"Chicken", ar:"دجاج", th:"ไก่", ms:"Ayam"},
    {en:"Fruit", ar:"فاكهة", th:"ผลไม้", ms:"Buah"},
    {en:"Apple", ar:"تفاحة", th:"แอปเปิ้ล", ms:"Epal"}
  ]}
];

// ============================================================================
// GAME STATE
// ============================================================================
let gameState = {
  currentLesson: 0,
  currentQuestion: 0,
  totalQuestions: 8,
  score: 0,
  correct: 0,
  wrong: 0,
  xp: 0,
  hearts: 5,
  streak: 0,
  level: 1,
  lessonsCompleted: 0,
  questions: [],
  isAnswered: false
};

// ============================================================================
// USER STATE
// ============================================================================
let currentUser = null;

// ============================================================================
// THEME TOGGLE
// ============================================================================
function updateThemeButton(theme) {
  const icon = document.getElementById('themeIcon');
  const text = document.getElementById('themeText');
  if (icon && text) {
    if (theme === 'dark') {
      icon.textContent = '☀️';
      text.textContent = 'Light';
    } else {
      icon.textContent = '🌙';
      text.textContent = 'Dark';
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButton(savedTheme);
  
  const savedToken = localStorage.getItem('authToken');
  const savedUser = localStorage.getItem('currentUser');
  if (savedToken && savedUser) {
    document.getElementById('loginModal').classList.add('hidden');
    currentUser = JSON.parse(savedUser);
    document.getElementById('navUser').style.display = 'block';
    document.getElementById('navUsername').textContent = '👤 ' + currentUser.username;
    document.getElementById('navUsername').style.color = 'var(--gold-bright)';
    
    if (currentUser.username === 'admin') {
      showAdminDashboard();
    } else {
      showUserDashboard();
    }
  }
});

document.getElementById('themeToggle').addEventListener('click', function() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeButton(newTheme);
});

// ============================================================================
// NAVBAR
// ============================================================================
const topnav = document.getElementById('topnav');
window.addEventListener('scroll', () => {
  const heroEl = document.querySelector('.hero');
  if (heroEl) {
    const past = window.scrollY > heroEl.offsetHeight - 80;
    topnav.classList.toggle('show', past);
  }
});

// ============================================================================
// DICTIONARY
// ============================================================================
function buildDictionary() {
  const dictBody = document.getElementById('dictBody');
  if (!dictBody) return;
  dictBody.innerHTML = '';
  
  CATEGORIES.forEach(cat => {
    const catRow = document.createElement('tr');
    const catCell = document.createElement('td');
    catCell.colSpan = 5;
    catCell.className = 'cat-cell';
    catCell.innerHTML = `<span class="arrow" id="arrow-${cat.name}">▶</span> ${cat.name}`;
    catCell.style.cursor = 'pointer';
    catCell.style.fontWeight = 'bold';
    catCell.style.fontFamily = 'var(--mono)';
    catCell.style.fontSize = '13px';
    catCell.style.color = 'var(--gold)';
    
    let isOpen = false;
    catCell.addEventListener('click', () => {
      isOpen = !isOpen;
      const arrow = document.getElementById(`arrow-${cat.name}`);
      const wordRows = document.querySelectorAll(`.word-row-${cat.name}`);
      if (isOpen) {
        arrow.textContent = '▼';
        wordRows.forEach(row => row.style.display = 'table-row');
      } else {
        arrow.textContent = '▶';
        wordRows.forEach(row => row.style.display = 'none');
      }
    });
    
    catRow.appendChild(catCell);
    dictBody.appendChild(catRow);
    
    cat.words.forEach(w => {
      const tr = document.createElement('tr');
      tr.className = `word-row-${cat.name}`;
      tr.style.display = 'none';
      tr.innerHTML =
        '<td></td>' +
        '<td>' + w.en + '</td>' +
        '<td dir="rtl" class="lang-ar">' + w.ar + '</td>' +
        '<td class="lang-th">' + w.th + '</td>' +
        '<td>' + w.ms + '</td>';
      dictBody.appendChild(tr);
    });
  });
}

const dictSearch = document.getElementById('dictSearch');
if (dictSearch) {
  dictSearch.addEventListener('input', function() {
    const query = this.value.trim().toLowerCase();
    const allRows = document.querySelectorAll('#dictBody tr');
    allRows.forEach(row => {
      if (row.classList.contains('category-row')) {
        const catName = row.textContent.replace('▶', '').replace('▼', '').trim();
        const wordRows = document.querySelectorAll(`.word-row-${catName}`);
        let hasMatch = false;
        wordRows.forEach(wRow => {
          const text = wRow.textContent.toLowerCase();
          if (query === '' || text.includes(query)) {
            wRow.style.display = 'table-row';
            hasMatch = true;
          } else {
            wRow.style.display = 'none';
          }
        });
        const arrow = document.getElementById(`arrow-${catName}`);
        if (arrow) {
          if (hasMatch && query !== '') {
            arrow.textContent = '▼';
            row.style.display = 'table-row';
          } else if (query === '') {
            arrow.textContent = '▶';
            row.style.display = 'table-row';
          } else {
            row.style.display = hasMatch ? 'table-row' : 'none';
          }
        }
      }
    });
  });
}

buildDictionary();

// ============================================================================
// SHOW USER DASHBOARD (Regular Users)
// ============================================================================
function showUserDashboard() {
  document.getElementById('userDashboard').style.display = 'block';
  document.getElementById('adminDashboard').style.display = 'none';
  document.getElementById('learn').style.display = 'none';
  document.getElementById('dictionary').style.display = 'block';
  document.getElementById('heroSection').style.display = 'none';
  document.getElementById('navUser').style.display = 'block';
  document.getElementById('navUsername').textContent = '👤 ' + currentUser.username;
  document.getElementById('navUsername').style.color = 'var(--gold-bright)';
  document.getElementById('dashUsername').textContent = currentUser.username;
  loadUserStats();
  loadLessons();
}

// ============================================================================
// SHOW ADMIN DASHBOARD (Admin Only)
// ============================================================================
function showAdminDashboard() {
  document.getElementById('adminDashboard').style.display = 'block';
  document.getElementById('userDashboard').style.display = 'none';
  document.getElementById('learn').style.display = 'none';
  document.getElementById('dictionary').style.display = 'block';
  document.getElementById('heroSection').style.display = 'none';
  document.getElementById('navUser').style.display = 'block';
  document.getElementById('navUsername').textContent = '👤 ' + currentUser.username + ' (Admin)';
  document.getElementById('navUsername').style.color = 'var(--gold-bright)';
  document.getElementById('adminName').textContent = currentUser.username;
  loadAdminStats();
}

function showLearn() {
  document.getElementById('learn').style.display = 'block';
  document.getElementById('userDashboard').style.display = 'none';
  document.getElementById('adminDashboard').style.display = 'none';
  document.getElementById('dictionary').style.display = 'none';
}

// ============================================================================
// LESSONS
// ============================================================================
function loadLessons() {
  const grid = document.getElementById('lessonsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  
  CATEGORIES.forEach((cat, index) => {
    const card = document.createElement('div');
    card.className = 'lesson-card';
    const isCompleted = index < gameState.lessonsCompleted;
    const isActive = index === gameState.lessonsCompleted;
    const isLocked = index > gameState.lessonsCompleted;
    
    let status = 'locked';
    if (isCompleted) status = 'completed';
    else if (isActive) status = 'active';
    
    card.innerHTML = `
      <span class="lesson-icon">${isCompleted ? '✅' : isActive ? '📖' : '🔒'}</span>
      <div class="lesson-name">${cat.name}</div>
      <div class="lesson-status ${status}">${isCompleted ? 'Completed' : isActive ? 'Start' : 'Locked'}</div>
    `;
    
    if (!isLocked) {
      card.addEventListener('click', () => startLesson(index));
    }
    
    grid.appendChild(card);
  });
}

// ============================================================================
// START LESSON
// ============================================================================
function startLesson(index) {
  gameState.currentLesson = index;
  gameState.currentQuestion = 0;
  gameState.correct = 0;
  gameState.wrong = 0;
  gameState.hearts = 5;
  gameState.isAnswered = false;
  gameState.xp = parseInt(document.getElementById('dashXp').textContent) || 0;
  
  const cat = CATEGORIES[index];
  const words = shuffle([...cat.words]);
  const numQuestions = Math.min(words.length, 8);
  gameState.totalQuestions = numQuestions;
  
  gameState.questions = [];
  for (let i = 0; i < numQuestions; i++) {
    const word = words[i];
    const toLang = ['ar', 'th', 'ms'][Math.floor(Math.random() * 3)];
    const allWords = cat.words.filter(w => w !== word);
    const distractors = shuffle(allWords).slice(0, 3).map(w => w[toLang]);
    const correctAnswer = word[toLang];
    const options = shuffle([correctAnswer, ...distractors]);
    
    gameState.questions.push({
      word: word,
      fromLang: 'en',
      toLang: toLang,
      questionText: `What is the translation of "${word.en}"?`,
      correctAnswer: correctAnswer,
      options: options
    });
  }
  
  showLearn();
  renderQuestion();
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================================================================
// RENDER QUESTION
// ============================================================================
function renderQuestion() {
  const q = gameState.questions[gameState.currentQuestion];
  if (!q) return;
  
  document.getElementById('hearts').textContent = gameState.hearts;
  document.getElementById('xp').textContent = gameState.xp;
  document.getElementById('streak').textContent = gameState.streak;
  document.getElementById('level').textContent = 'Level ' + gameState.level;
  
  const progress = ((gameState.currentQuestion) / gameState.totalQuestions) * 100;
  document.getElementById('lessonProgress').style.width = progress + '%';
  
  document.getElementById('questionNumber').textContent = `${gameState.currentQuestion + 1} / ${gameState.totalQuestions}`;
  document.getElementById('questionCategory').textContent = CATEGORIES[gameState.currentLesson].name;
  document.getElementById('questionText').textContent = q.questionText;
  document.getElementById('questionWord').textContent = q.word.en;
  
  const container = document.getElementById('optionsContainer');
  container.innerHTML = '';
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => handleAnswer(btn, opt));
    container.appendChild(btn);
  });
  
  document.getElementById('feedbackContainer').style.display = 'none';
  document.getElementById('gameComplete').style.display = 'none';
  document.getElementById('questionContainer').style.display = 'flex';
  
  gameState.isAnswered = false;
}

// ============================================================================
// HANDLE ANSWER
// ============================================================================
function handleAnswer(btn, selected) {
  if (gameState.isAnswered) return;
  gameState.isAnswered = true;
  
  const q = gameState.questions[gameState.currentQuestion];
  const isCorrect = selected === q.correctAnswer;
  
  document.querySelectorAll('.option-btn').forEach(b => b.classList.add('disabled'));
  
  if (isCorrect) {
    btn.classList.add('correct');
    gameState.correct++;
    gameState.xp += 10;
    gameState.streak++;
    if (gameState.xp >= gameState.level * 100) {
      gameState.level++;
    }
  } else {
    btn.classList.add('wrong');
    gameState.wrong++;
    gameState.hearts--;
    gameState.streak = 0;
    document.querySelectorAll('.option-btn').forEach(b => {
      if (b.textContent === q.correctAnswer) {
        b.classList.add('correct');
      }
    });
  }
  
  document.getElementById('hearts').textContent = gameState.hearts;
  document.getElementById('xp').textContent = gameState.xp;
  document.getElementById('streak').textContent = gameState.streak;
  document.getElementById('level').textContent = 'Level ' + gameState.level;
  
  const feedback = document.getElementById('feedbackContainer');
  feedback.style.display = 'block';
  feedback.className = 'feedback-container ' + (isCorrect ? 'correct' : 'wrong');
  document.getElementById('feedbackIcon').textContent = isCorrect ? '✅' : '❌';
  document.getElementById('feedbackText').textContent = isCorrect ? 'Correct! Well done!' : `Oops! The answer is "${q.correctAnswer}"`;
  
  if (gameState.hearts <= 0) {
    document.getElementById('nextQuestionBtn').textContent = 'Game Over 😢';
    document.getElementById('nextQuestionBtn').disabled = true;
    setTimeout(() => completeLesson(), 1500);
    return;
  }
  
  const nextBtn = document.getElementById('nextQuestionBtn');
  if (gameState.currentQuestion >= gameState.totalQuestions - 1) {
    nextBtn.textContent = 'Finish Lesson 🎉';
  } else {
    nextBtn.textContent = 'Continue →';
  }
  nextBtn.disabled = false;
  nextBtn.onclick = () => {
    if (gameState.currentQuestion >= gameState.totalQuestions - 1) {
      completeLesson();
    } else {
      gameState.currentQuestion++;
      renderQuestion();
    }
  };
}

// ============================================================================
// COMPLETE LESSON
// ============================================================================
function completeLesson() {
  document.getElementById('questionContainer').style.display = 'none';
  document.getElementById('feedbackContainer').style.display = 'none';
  document.getElementById('gameComplete').style.display = 'block';
  
  document.getElementById('completeCorrect').textContent = gameState.correct;
  document.getElementById('completeWrong').textContent = gameState.wrong;
  document.getElementById('completeXp').textContent = gameState.correct * 10;
  
  if (gameState.hearts > 0 && gameState.correct > gameState.wrong) {
    gameState.lessonsCompleted = Math.max(gameState.lessonsCompleted, gameState.currentLesson + 1);
  }
  
  saveProgress();
  
  document.getElementById('continueBtn').onclick = () => {
    if (currentUser.username === 'admin') {
      showAdminDashboard();
    } else {
      showUserDashboard();
    }
  };
}

// ============================================================================
// SAVE PROGRESS
// ============================================================================
async function saveProgress() {
  const token = localStorage.getItem('authToken');
  if (!token || !currentUser) return;
  
  try {
    const userId = currentUser.id || currentUser.user_id;
    const quizScore = gameState.totalQuestions > 0 ? Math.round((gameState.correct / gameState.totalQuestions) * 100) : 0;
    
    const response = await fetch(`${API_URL}/save-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: userId,
        courseId: 1,
        lessonsCompleted: gameState.lessonsCompleted,
        quizScore: quizScore,
        timeSpent: 5
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Progress saved:', data);
    }
  } catch (error) {
    console.error('Error saving progress:', error);
  }
}

// ============================================================================
// LOAD USER STATS
// ============================================================================
async function loadUserStats() {
  const token = localStorage.getItem('authToken');
  if (!token || !currentUser) return;
  
  try {
    const userId = currentUser.id || currentUser.user_id;
    const response = await fetch(`${API_URL}/profile/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        const stats = data.stats || {};
        document.getElementById('dashXp').textContent = stats.total_score || 0;
        document.getElementById('dashLessons').textContent = stats.games_played || 0;
        document.getElementById('dashStreak').textContent = 0;
        document.getElementById('dashLevel').textContent = 'Level ' + (Math.floor((stats.total_score || 0) / 100) + 1);
      }
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// ============================================================================
// LOAD ADMIN STATS
// ============================================================================
async function loadAdminStats() {
  const token = localStorage.getItem('authToken');
  if (!token) return;
  
  try {
    const response = await fetch(`${API_URL}/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const users = data.users || [];
      
      document.getElementById('adminTotalUsers').textContent = users.length;
      document.getElementById('adminTotalWords').textContent = CATEGORIES.reduce((sum, cat) => sum + cat.words.length, 0);
      
      let totalScore = 0;
      let totalGames = 0;
      users.forEach(user => {
        totalScore += user.total_score || 0;
        totalGames += user.games_played || 0;
      });
      document.getElementById('adminTotalScore').textContent = totalScore;
      document.getElementById('adminTotalGames').textContent = totalGames;
      
      const adminBody = document.getElementById('adminUsersBody');
      adminBody.innerHTML = '';
      
      if (users.length === 0) {
        adminBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-secondary);padding:20px;">No users found</td></tr>';
      } else {
        users.forEach(user => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${user.id}</td>
            <td><strong>${user.username}</strong></td>
            <td>${user.email || '-'}</td>
            <td>${user.total_score || 0}</td>
            <td>${user.games_played || 0}</td>
            <td>${user.best_score || 0}</td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
          `;
          adminBody.appendChild(tr);
        });
      }
    }
  } catch (error) {
    console.error('Admin error:', error);
  }
}

// ============================================================================
// VIEW DATA BUTTON - Opens admin data page with token
// ============================================================================
document.getElementById('viewDataBtn').addEventListener('click', function() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('Please login as admin');
        return;
    }
    
    // Open the data page with token in URL
    window.open(`/admin/data?token=${encodeURIComponent(token)}`, '_blank');
});

// ============================================================================
// LOGOUT
// ============================================================================
document.getElementById('logoutBtn').addEventListener('click', function() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  location.reload();
});

document.getElementById('adminLogoutBtn').addEventListener('click', function() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  location.reload();
});

// ============================================================================
// EXIT GAME
// ============================================================================
document.getElementById('exitGameBtn').addEventListener('click', function() {
  if (confirm('Exit the lesson? Your progress will be saved.')) {
    if (currentUser.username === 'admin') {
      showAdminDashboard();
    } else {
      showUserDashboard();
    }
  }
});

// ============================================================================
// LOGIN MODAL HANDLERS
// ============================================================================
document.getElementById('switchToRegister').addEventListener('click', function() {
  document.getElementById('signinForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
});

document.getElementById('switchToSignin').addEventListener('click', function() {
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('signinForm').style.display = 'block';
});

document.getElementById('signinBtn').addEventListener('click', async function() {
  const username = document.getElementById('signinUsername').value.trim();
  const password = document.getElementById('signinPassword').value.trim();
  
  if (!username || !password) {
    alert('Please enter username and password');
    return;
  }
  
  this.disabled = true;
  this.textContent = '⏳ Signing in...';
  
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      currentUser = data.user;
      document.getElementById('loginModal').classList.add('hidden');
      document.getElementById('navUser').style.display = 'block';
      
      if (currentUser.username === 'admin') {
        showAdminDashboard();
      } else {
        showUserDashboard();
      }
    } else {
      alert('❌ ' + data.error);
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('❌ Connection error. Make sure the server is running.');
  }
  
  this.disabled = false;
  this.textContent = '🔐 Sign In';
});

document.getElementById('modalRegisterBtn').addEventListener('click', async function() {
  const username = document.getElementById('modalUsername').value.trim();
  const password = document.getElementById('modalPassword').value.trim();
  const email = document.getElementById('modalEmail').value.trim();
  
  if (!username || !password) {
    alert('Please enter username and password');
    return;
  }
  if (password.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }
  
  this.disabled = true;
  this.textContent = '⏳ Creating...';
  
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      currentUser = data.user;
      document.getElementById('loginModal').classList.add('hidden');
      document.getElementById('navUser').style.display = 'block';
      
      if (currentUser.username === 'admin') {
        showAdminDashboard();
      } else {
        showUserDashboard();
      }
    } else {
      alert('❌ ' + data.error);
    }
  } catch (error) {
    console.error('Register error:', error);
    alert('❌ Connection error. Make sure the server is running.');
  }
  
  this.disabled = false;
  this.textContent = '🚀 Create Account';
});

document.getElementById('modalSkipBtn').addEventListener('click', function() {
  document.getElementById('loginModal').classList.add('hidden');
  document.getElementById('guestRegisterBtn').style.display = 'block';
  document.getElementById('navUser').style.display = 'block';
  document.getElementById('navUsername').textContent = '👤 Guest';
});

document.getElementById('modalSkipBtn2').addEventListener('click', function() {
  document.getElementById('loginModal').classList.add('hidden');
  document.getElementById('guestRegisterBtn').style.display = 'block';
  document.getElementById('navUser').style.display = 'block';
  document.getElementById('navUsername').textContent = '👤 Guest';
});

document.getElementById('guestRegisterBtn').addEventListener('click', function() {
  document.getElementById('loginModal').classList.remove('hidden');
  this.style.display = 'none';
  document.getElementById('signinUsername').value = '';
  document.getElementById('signinPassword').value = '';
  document.getElementById('modalUsername').value = '';
  document.getElementById('modalPassword').value = '';
  document.getElementById('modalEmail').value = '';
  document.getElementById('signinForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
});

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const nextBtn = document.getElementById('nextQuestionBtn');
    if (nextBtn && !nextBtn.disabled && nextBtn.style.display !== 'none') {
      nextBtn.click();
    }
  }
  if (e.key >= '1' && e.key <= '4') {
    const options = document.querySelectorAll('.option-btn:not(.disabled)');
    if (options[e.key - 1]) {
      options[e.key - 1].click();
    }
  }
});

console.log('🦉 Lingua - Language Learning System Ready!');
