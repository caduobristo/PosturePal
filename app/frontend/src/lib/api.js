// Local DB-backed API shim. Replaces network calls with local SQLite/IndexedDB/localStorage
import sqliteDB from './sqliteDB';

// initialize DB on import
sqliteDB.initDB();

export const login = (email, password) => sqliteDB.login(email, password);

export const registerUser = (payload) => sqliteDB.registerUser(payload);

export const fetchUser = (userId) => sqliteDB.fetchUser(userId);

export const createSession = (payload) => sqliteDB.createSession(payload);

export const fetchSessionsForUser = (userId) =>
  sqliteDB.listSessionsForUser(userId);

export const fetchSession = (sessionId) => sqliteDB.fetchSession(sessionId);

export const deleteSession = (sessionId) => sqliteDB.deleteSession(sessionId);
