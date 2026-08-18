import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { EMPTY_WORKSPACE, OAuthCreds, Provider, User, Workspace } from './types';

export const SESSION_COOKIE = 'cn_session';
export const GUEST_COOKIE = 'cn_guest';

export type Config = { apiKey?: string; oauth: Partial<Record<Provider, OAuthCreds>> };

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Supabase 가 설정되면 DB, 아니면 로컬 파일. 배포 환경은 파일 쓰기가 유지되지 않는다. */
export const usingDb = !!(SUPABASE_URL && SERVICE_KEY);

const db = usingDb
  ? createClient(SUPABASE_URL!, SERVICE_KEY!, { auth: { persistSession: false } })
  : null;

// ─────────────────────────────── 파일 폴백 (로컬 개발용)

const DATA_DIR = path.join(process.cwd(), '.data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const IMG_DIR = path.join(process.cwd(), 'public', 'generated');

type FileState = {
  config: Config;
  users: Record<string, User>;
  sessions: Record<string, string>;
  workspaces: Record<string, Workspace>;
};
const EMPTY_FILE_STATE: FileState = { config: { oauth: {} }, users: {}, sessions: {}, workspaces: {} };

function readFileState(): FileState {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STATE_FILE)) return structuredClone(EMPTY_FILE_STATE);
  try {
    return { ...structuredClone(EMPTY_FILE_STATE), ...JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) };
  } catch {
    return structuredClone(EMPTY_FILE_STATE);
  }
}

function writeFileState(s: FileState) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2), 'utf-8');
}

// ─────────────────────────────── 설정

export async function getConfig(): Promise<Config> {
  if (!db) return readFileState().config;
  const { data } = await db.from('app_config').select('data').eq('id', 1).maybeSingle();
  const cfg = (data?.data ?? {}) as Partial<Config>;
  return { ...cfg, oauth: cfg.oauth ?? {} };
}

export async function patchConfig(patch: Partial<Config>) {
  const next = { ...(await getConfig()), ...patch };
  if (!db) {
    const s = readFileState();
    writeFileState({ ...s, config: next });
    return next;
  }
  await db.from('app_config').upsert({ id: 1, data: next });
  return next;
}

export async function resolveGeminiKey(): Promise<string | null> {
  const cfg = await getConfig();
  return cfg.apiKey || process.env.GEMINI_API_KEY || null;
}

export async function providerCreds(provider: Provider): Promise<OAuthCreds | null> {
  const envId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
  const envSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
  if (envId && envSecret) return { clientId: envId, clientSecret: envSecret };
  const saved = (await getConfig()).oauth?.[provider];
  return saved?.clientId && saved?.clientSecret ? saved : null;
}

// ─────────────────────────────── 작업 공간

export async function getWorkspace(key: string): Promise<Workspace> {
  if (!db) return readFileState().workspaces[key] ?? structuredClone(EMPTY_WORKSPACE);
  const { data } = await db.from('workspaces').select('data').eq('key', key).maybeSingle();
  return { ...structuredClone(EMPTY_WORKSPACE), ...((data?.data ?? {}) as Workspace) };
}

export async function setWorkspace(key: string, ws: Workspace) {
  if (!db) {
    const s = readFileState();
    writeFileState({ ...s, workspaces: { ...s.workspaces, [key]: ws } });
    return ws;
  }
  await db.from('workspaces').upsert({ key, data: ws, updated_at: new Date().toISOString() });
  return ws;
}

export async function updateWorkspace(key: string, fn: (w: Workspace) => Workspace) {
  return setWorkspace(key, fn(await getWorkspace(key)));
}

export async function deleteWorkspace(key: string) {
  if (!db) {
    const s = readFileState();
    delete s.workspaces[key];
    writeFileState(s);
    return;
  }
  await db.from('workspaces').delete().eq('key', key);
}

// ─────────────────────────────── 회원 · 세션

export async function getUser(key: string): Promise<User | null> {
  if (!db) return readFileState().users[key] ?? null;
  const { data } = await db.from('app_users').select('*').eq('key', key).maybeSingle();
  if (!data) return null;
  return {
    key: data.key,
    provider: data.provider,
    name: data.name,
    email: data.email ?? undefined,
    picture: data.picture ?? undefined,
    joinedAt: data.joined_at,
  };
}

export async function upsertUser(user: User) {
  if (!db) {
    const s = readFileState();
    const existing = s.users[user.key];
    s.users[user.key] = { ...user, joinedAt: existing?.joinedAt ?? user.joinedAt };
    writeFileState(s);
    return;
  }
  const existing = await getUser(user.key);
  await db.from('app_users').upsert({
    key: user.key,
    provider: user.provider,
    name: user.name,
    email: user.email ?? null,
    picture: user.picture ?? null,
    joined_at: existing?.joinedAt ?? user.joinedAt,
  });
}

export async function createSession(sessionId: string, userKey: string) {
  if (!db) {
    const s = readFileState();
    s.sessions[sessionId] = userKey;
    writeFileState(s);
    return;
  }
  await db.from('app_sessions').insert({ id: sessionId, user_key: userKey });
}

export async function sessionUserKey(sessionId: string): Promise<string | null> {
  if (!db) return readFileState().sessions[sessionId] ?? null;
  const { data } = await db.from('app_sessions').select('user_key').eq('id', sessionId).maybeSingle();
  return data?.user_key ?? null;
}

export async function deleteSession(sessionId: string) {
  if (!db) {
    const s = readFileState();
    delete s.sessions[sessionId];
    writeFileState(s);
    return;
  }
  await db.from('app_sessions').delete().eq('id', sessionId);
}

export function newId(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * 현재 요청의 작업 공간 키.
 * 로그인 세션이 있으면 회원 키, 없으면 방문자별 게스트 키를 발급한다.
 * (전역 'guest' 하나를 쓰면 배포 시 모든 방문자가 같은 작업 공간을 공유해 버린다)
 */
export async function currentKey(): Promise<string> {
  const jar = await cookies();

  const sid = jar.get(SESSION_COOKIE)?.value;
  if (sid) {
    const key = await sessionUserKey(sid);
    if (key) return key;
  }

  const existing = jar.get(GUEST_COOKIE)?.value;
  if (existing) return `guest:${existing}`;

  const fresh = newId(12);
  jar.set(GUEST_COOKIE, fresh, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
  return `guest:${fresh}`;
}

export function isGuestKey(key: string) {
  return key.startsWith('guest:');
}

// ─────────────────────────────── 생성 이미지

export async function saveImage(buf: Buffer, name: string): Promise<string> {
  const file = `${name}-${Date.now()}-${newId(3)}.png`;

  if (!db) {
    fs.mkdirSync(IMG_DIR, { recursive: true });
    fs.writeFileSync(path.join(IMG_DIR, file), buf);
    return `/generated/${file}`;
  }

  const { error } = await db.storage.from('generated').upload(file, buf, {
    contentType: 'image/png',
    upsert: false,
  });
  if (error) throw new Error(`이미지 저장 실패: ${error.message}`);
  return db.storage.from('generated').getPublicUrl(file).data.publicUrl;
}

/** 생성 이미지를 참조 이미지로 다시 넣기 위해 원본 바이트를 가져온다 */
export async function loadImageBytes(url: string): Promise<Buffer | null> {
  if (url.startsWith('data:')) return null; // 플레이스홀더는 참조로 쓰지 않는다
  try {
    if (url.startsWith('/generated/')) {
      const abs = path.join(process.cwd(), 'public', url);
      return fs.existsSync(abs) ? fs.readFileSync(abs) : null;
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}
