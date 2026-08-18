'use client';
import { EMPTY_WORKSPACE, Workspace } from './types';

/**
 * 브라우저 저장소.
 * 서버가 없으므로 브랜드·캐릭터·카드뉴스는 이 기기의 IndexedDB 에만 남는다.
 * 생성 이미지가 data URL 이라 용량이 커서 localStorage 대신 IndexedDB 를 쓴다.
 */
const DB = 'cardnews';
const STORE = 'kv';
const WS_KEY = 'workspace';
const API_KEY = 'cardnews.gemini.key';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadWorkspace(): Promise<Workspace> {
  try {
    const ws = await idbGet<Workspace>(WS_KEY);
    return { ...structuredClone(EMPTY_WORKSPACE), ...(ws ?? {}) };
  } catch {
    return structuredClone(EMPTY_WORKSPACE);
  }
}

export async function saveWorkspace(ws: Workspace): Promise<Workspace> {
  await idbSet(WS_KEY, ws);
  return ws;
}

export async function updateWorkspace(fn: (w: Workspace) => Workspace): Promise<Workspace> {
  return saveWorkspace(fn(await loadWorkspace()));
}

export async function resetWorkspace() {
  await idbSet(WS_KEY, structuredClone(EMPTY_WORKSPACE));
}

// API 키는 작아서 localStorage 로 충분하다
export function getApiKey(): string | null {
  try {
    return localStorage.getItem(API_KEY);
  } catch {
    return null;
  }
}

export function setApiKey(key: string) {
  localStorage.setItem(API_KEY, key.trim());
}

export function clearApiKey() {
  localStorage.removeItem(API_KEY);
}

export function maskKey(key: string) {
  return `${key.slice(0, 4)}${'*'.repeat(Math.max(0, key.length - 8))}${key.slice(-4)}`;
}
