import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { AppState, EMPTY_STATE, EMPTY_WORKSPACE, GUEST_KEY, Workspace } from './types';

const DATA_DIR = path.join(process.cwd(), '.data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const IMG_DIR = path.join(process.cwd(), 'public', 'generated');

export const SESSION_COOKIE = 'cn_session';

function ensure() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(IMG_DIR, { recursive: true });
}

export function readState(): AppState {
  ensure();
  if (!fs.existsSync(STATE_FILE)) return structuredClone(EMPTY_STATE);
  try {
    return { ...structuredClone(EMPTY_STATE), ...JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) };
  } catch {
    return structuredClone(EMPTY_STATE);
  }
}

export function writeState(next: AppState) {
  ensure();
  fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 2), 'utf-8');
  return next;
}

export function mutate(fn: (s: AppState) => AppState) {
  return writeState(fn(readState()));
}

/** 현재 요청의 작업 공간 키 — 로그인 세션이 있으면 사용자 키, 없으면 게스트 */
export async function currentKey(): Promise<string> {
  const sid = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sid) return GUEST_KEY;
  return readState().sessions[sid]?.key ?? GUEST_KEY;
}

export function getWorkspace(state: AppState, key: string): Workspace {
  return state.workspaces[key] ?? structuredClone(EMPTY_WORKSPACE);
}

export function mutateWorkspace(key: string, fn: (w: Workspace) => Workspace) {
  return mutate((s) => ({
    ...s,
    workspaces: { ...s.workspaces, [key]: fn(getWorkspace(s, key)) },
  }));
}

export function newSessionId() {
  return crypto.randomBytes(24).toString('hex');
}

export function saveImage(buf: Buffer, name: string): string {
  ensure();
  const file = `${name}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.png`;
  fs.writeFileSync(path.join(IMG_DIR, file), buf);
  return `/generated/${file}`;
}

export function resolveKey(state: AppState): string | null {
  return state.apiKey || process.env.GEMINI_API_KEY || null;
}
