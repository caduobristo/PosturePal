// Adapter that prefers Capacitor SQLite plugin but falls back to localStorage
// Provides: initDB, registerUser, login, fetchUser, createSession, fetchSessionsForUser, fetchSession
// NOTE: For native mobile builds, install @capacitor-community/sqlite to use real SQLite.

const STORAGE_USERS_KEY = 'pp_users_v1';
const STORAGE_SESSIONS_KEY = 'pp_sessions_v1';

function nowIso() {
  return new Date().toISOString();
}

function generateId() {
  // Simple UUIDv4-ish generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (c === 'x' ? 0 : 0);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function hashString(str) {
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(hash));
  return arr.map(b => b.toString(16).padStart(2, '0')).join('');
}

// LocalStorage-backed simple DB implementation
const LocalStore = {
  getUsers() {
    try {
      const raw = localStorage.getItem(STORAGE_USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to read users from localStorage', e);
      return [];
    }
  },
  saveUsers(users) {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  },
  getSessions() {
    try {
      const raw = localStorage.getItem(STORAGE_SESSIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to read sessions from localStorage', e);
      return [];
    }
  },
  saveSessions(sessions) {
    localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
  }
};

async function initDB() {
  // If plugin available, user should install it; otherwise create basic storage keys
  if (typeof window === 'undefined') return;

  // Ensure there's a demo user with a stable id 'demo-user' so AuthContext demo login
  // (which uses id 'demo-user') matches a real record in the local DB.
  const users = LocalStore.getUsers();
  const demoEmail = 'admin@ballet.com';
  const existing = users.find((u) => u.email && u.email.toLowerCase() === demoEmail);
  if (existing) {
    if (existing.id !== 'demo-user') {
      // normalize id to demo-user for compatibility
      existing.id = 'demo-user';
      existing.name = existing.name || 'Demo User';
      existing.updated_at = nowIso();
      LocalStore.saveUsers(users);
    }
  } else {
    const passwordHash = await hashString('admin');
    const demoUser = {
      id: 'demo-user',
      name: 'Demo User',
      email: demoEmail,
      password_hash: passwordHash,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    users.push(demoUser);
    LocalStore.saveUsers(users);
  }

  if (!localStorage.getItem(STORAGE_SESSIONS_KEY)) {
    LocalStore.saveSessions([]);
  }
}

// User functions
async function registerUser(payload) {
  const users = LocalStore.getUsers();
  const exists = users.find(u => u.email.toLowerCase() === payload.email.toLowerCase());
  if (exists) {
    const err = new Error('User with this email already exists');
    err.code = 'DUPLICATE_EMAIL';
    throw err;
  }

  const passwordHash = await hashString(payload.password);
  const now = nowIso();
  const user = {
    id: generateId(),
    name: payload.name,
    email: payload.email,
    password_hash: passwordHash,
    created_at: now,
    updated_at: now,
  };
  users.push(user);
  LocalStore.saveUsers(users);
  // Return public view (no password_hash)
  const { password_hash, ...publicUser } = user;
  return publicUser;
}

async function login(email, password) {
  const users = LocalStore.getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  const pwHash = await hashString(password);
  if (pwHash !== user.password_hash) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const { password_hash, ...publicUser } = user;
  return publicUser;
}

async function fetchUser(userId) {
  const users = LocalStore.getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  const { password_hash, ...publicUser } = user;
  return publicUser;
}

// Session functions
async function createSession(payload) {
  const users = LocalStore.getUsers();
  const user = users.find(u => u.id === payload.user_id);
  if (!user) {
    const err = new Error('Invalid user_id');
    err.status = 400;
    throw err;
  }

  const sessions = LocalStore.getSessions();
  const now = nowIso();
  const session = {
    id: generateId(),
    user_id: payload.user_id,
    exercise_id: payload.exercise_id,
    exercise_name: payload.exercise_name,
    score: payload.score,
    feedback: payload.feedback || [],
    metrics: payload.metrics || {},
    landmark_frames: payload.landmark_frames || [],
    created_at: now,
    updated_at: now,
  };
  sessions.push(session);
  LocalStore.saveSessions(sessions);
  return session;
}

async function listSessionsForUser(userId) {
  const sessions = LocalStore.getSessions();
  // sort desc by created_at
  return sessions
    .filter(s => s.user_id === userId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

async function fetchSession(sessionId) {
  const sessions = LocalStore.getSessions();
  const s = sessions.find(x => x.id === sessionId);
  return s || null;
}

export default {
  initDB,
  registerUser,
  login,
  fetchUser,
  createSession,
  listSessionsForUser,
  fetchSession,
};
