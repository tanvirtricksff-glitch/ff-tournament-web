import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  getFirestore, collection, getDocs, doc, setDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const $ = (s) => document.querySelector(s);
const modal = $('#authModal');
const form = $('#authForm');
const message = $('#authMessage');
const nameInput = $('#displayName');
const nameLabel = $('#nameLabel');
const submit = $('#authSubmit');
const accountRow = $('#accountRow');
const accountEmail = $('#accountEmail');
let authMode = 'login';
let activeFilter = 'All';
let allTournaments = [];
let auth = null;
let db = null;
let firebaseReady = false;

const isConfigured = !Object.values(firebaseConfig).some(v => String(v).includes('YOUR_'));

function showModal() {
  modal.hidden = false;
  message.textContent = '';
}
function hideModal() { modal.hidden = true; }
$('#openAuth').addEventListener('click', showModal);
$('#heroAuth').addEventListener('click', showModal);
$('#closeAuth').addEventListener('click', hideModal);
modal.addEventListener('click', e => { if (e.target === modal) hideModal(); });
document.querySelectorAll('[data-auth-required]').forEach(el => el.addEventListener('click', showModal));
document.querySelectorAll('[data-auth-mode]').forEach(btn => btn.addEventListener('click', () => setAuthMode(btn.dataset.authMode)));
function setAuthMode(mode) {
  authMode = mode;
  document.querySelectorAll('[data-auth-mode]').forEach(b => b.classList.toggle('active', b.dataset.authMode === mode));
  const signup = mode === 'signup';
  nameInput.hidden = !signup;
  nameLabel.hidden = !signup;
  nameInput.required = signup;
  $('#authTitle').textContent = signup ? 'নতুন প্লেয়ার অ্যাকাউন্ট' : 'প্লেয়ার লগইন';
  submit.textContent = signup ? 'অ্যাকাউন্ট তৈরি' : 'লগইন';
  $('#password').autocomplete = signup ? 'new-password' : 'current-password';
  message.textContent = '';
}
document.querySelectorAll('.filter').forEach(btn => btn.addEventListener('click', () => {
  activeFilter = btn.dataset.filter;
  document.querySelectorAll('.filter').forEach(b => b.classList.toggle('active', b === btn));
  renderTournaments();
}));

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function renderTournaments() {
  const grid = $('#tournamentGrid');
  const items = allTournaments.filter(t => activeFilter === 'All' || String(t.mode || '').toLowerCase() === activeFilter.toLowerCase());
  if (!items.length) {
    grid.innerHTML = `<div class="tournament-card" style="padding:22px;color:var(--muted);grid-column:1/-1">${firebaseReady ? 'এই ফিল্টারে কোনো টুর্নামেন্ট পাওয়া যায়নি।' : 'Firebase কনফিগার করতে README.md অনুসরণ করো।'}</div>`;
    return;
  }
  grid.innerHTML = items.map((t, i) => {
    const mode = String(t.mode || 'Solo');
    const artClass = mode.toLowerCase() === 'duo' ? 'duo-art' : mode.toLowerCase() === 'squad' ? 'squad-art' : 'solo-art';
    const slots = Number.isFinite(Number(t.slotsTotal)) ? `${Math.max(0, Number(t.slotsTotal) - Number(t.slotsFilled || 0))}/${Number(t.slotsTotal)}` : '—';
    const status = String(t.status || 'upcoming');
    return `<article class="tournament-card"><div class="tournament-art ${artClass}"><span>${escapeHtml(mode.toUpperCase())}</span><b>${String(i+1).padStart(2,'0')}</b></div><div class="tournament-info"><div class="card-meta"><span class="pill">${escapeHtml(status.toUpperCase())}</span><span>◷ Match listing</span></div><h3>${escapeHtml(t.name || `Free Fire ${mode}`)}</h3><p>${escapeHtml(t.description || 'ম্যাচের নিয়ম ও সময় আয়োজকের কাছ থেকে নিশ্চিত করো।')}</p><div class="match-data"><div><small>এন্ট্রি ফি</small><strong>৳${escapeHtml(t.entryFee ?? 20)}</strong></div><div><small>প্রাইজ পুল</small><strong>৳${escapeHtml(t.prizePool ?? 100)}</strong></div><div><small>স্লট</small><strong>${escapeHtml(slots)}</strong></div></div><button class="btn btn-primary join-btn" data-auth-required>লগইন করে যোগ দাও</button></div></article>`;
  }).join('');
  grid.querySelectorAll('[data-auth-required]').forEach(el => el.addEventListener('click', showModal));
}

if (!isConfigured) {
  $('#tournamentStatus').textContent = 'Firebase config বসানো হয়নি';
  allTournaments = [];
  renderTournaments();
} else {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    firebaseReady = true;
    $('#tournamentStatus').textContent = 'Firebase প্রস্তুত';
    onAuthStateChanged(auth, user => {
      accountRow.hidden = !user;
      if (user) {
        accountEmail.textContent = user.email || 'Signed in';
        $('#openAuth').textContent = 'আমার অ্যাকাউন্ট';
      } else {
        $('#openAuth').textContent = 'লগইন / রেজিস্টার';
      }
    });
    loadTournaments();
  } catch (err) {
    $('#tournamentStatus').textContent = 'Firebase সেটআপ যাচাই করো';
    console.error(err);
  }
}

async function loadTournaments() {
  try {
    const snapshot = await getDocs(collection(db, 'tournaments'));
    allTournaments = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    $('#tournamentStatus').textContent = `${allTournaments.length}টি ম্যাচ`;
    renderTournaments();
  } catch (err) {
    $('#tournamentStatus').textContent = 'ম্যাচ লোড হয়নি';
    $('#tournamentGrid').innerHTML = `<div class="tournament-card" style="padding:22px;color:var(--muted);grid-column:1/-1">ম্যাচ লোড করা যায়নি। Firebase config এবং Firestore Rules পরীক্ষা করো।</div>`;
    console.error(err);
  }
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!firebaseReady) {
    message.textContent = 'প্রথমে public/firebase-config.js-এ Firebase config বসাও।';
    return;
  }
  submit.disabled = true;
  message.textContent = 'একটু অপেক্ষা করো…';
  try {
    const email = $('#email').value.trim();
    const password = $('#password').value;
    if (authMode === 'signup') {
      const displayName = nameInput.value.trim();
      if (!displayName) throw new Error('প্লেয়ার নাম লিখো।');
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName });
      await setDoc(doc(db, 'users', credential.user.uid), {
        displayName, email, createdAt: serverTimestamp()
      });
      message.textContent = 'অ্যাকাউন্ট তৈরি হয়েছে। স্বাগতম!';
    } else {
      await signInWithEmailAndPassword(auth, email, password);
      message.textContent = 'লগইন সফল হয়েছে।';
    }
  } catch (err) {
    const friendly = {
      'auth/email-already-in-use':'এই ইমেইলে অ্যাকাউন্ট আছে। লগইন করো।',
      'auth/invalid-email':'সঠিক ইমেইল দাও।',
      'auth/weak-password':'আরও শক্তিশালী পাসওয়ার্ড দাও (কমপক্ষে ৬ অক্ষর)।',
      'auth/invalid-credential':'ইমেইল বা পাসওয়ার্ড সঠিক নয়।',
      'auth/network-request-failed':'ইন্টারনেট সংযোগ পরীক্ষা করো।',
      'permission-denied':'Firestore Rules পরীক্ষা করতে হবে।'
    };
    message.textContent = friendly[err.code] || err.message || 'কাজটি করা যায়নি। সেটআপ পরীক্ষা করো।';
  } finally {
    submit.disabled = false;
  }
});
$('#signOut').addEventListener('click', async () => {
  try { await signOut(auth); message.textContent = 'লগআউট হয়েছে।'; }
  catch (err) { message.textContent = 'লগআউট করা যায়নি।'; }
});
