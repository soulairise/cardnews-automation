import { GoogleGenAI } from '@google/genai';

/**
 * Gemini 어댑터 (@google/genai v2, interactions API).
 * PRD 10장 원가표에 맞춰 용도별로 모델을 분리한다.
 *  - 캐릭터 시트: 브랜드당 1회성이므로 고급 모델 허용
 *  - 카드 배경:   매 건 발생하므로 저가~표준 모델
 */
export const MODELS = {
  characterSheet: 'gemini-3-pro-image',
  cardBackground: 'gemini-3.1-flash-image',
  text: 'gemini-3.7-flash',
} as const;

export class GeminiError extends Error {}

function client(apiKey: string) {
  return new GoogleGenAI({ apiKey });
}

export async function genText(apiKey: string, prompt: string): Promise<string> {
  try {
    const res = await client(apiKey).interactions.create({ model: MODELS.text, input: prompt });
    const text = (res as { output_text?: string }).output_text;
    if (!text) throw new GeminiError('텍스트 응답이 비어 있습니다.');
    return text;
  } catch (e) {
    throw new GeminiError(`카피 생성 실패: ${(e as Error).message}`);
  }
}

/** 모델이 코드펜스로 감싸 주는 경우가 잦아 관대하게 파싱한다. */
export async function genJSON<T>(apiKey: string, prompt: string): Promise<T> {
  const raw = await genText(apiKey, prompt);
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.search(/[[{]/);
  const end = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
  if (start === -1 || end === -1) throw new GeminiError('JSON 응답을 해석하지 못했습니다.');
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    throw new GeminiError('JSON 응답을 해석하지 못했습니다.');
  }
}

export type ImageRef = { mimeType: string; base64: string };

export async function genImage(
  apiKey: string,
  opts: { prompt: string; model: string; refs?: ImageRef[] },
): Promise<Buffer> {
  const input: unknown[] = [{ type: 'text', text: opts.prompt }];
  for (const ref of opts.refs ?? []) {
    input.push({ type: 'image', mime_type: ref.mimeType, data: ref.base64 });
  }
  try {
    const res = await client(apiKey).interactions.create({
      model: opts.model,
      // 참조 이미지가 없으면 문자열 입력이 더 안정적이다.
      input: (opts.refs?.length ? input : opts.prompt) as never,
    });
    const img = (res as { output_image?: { data?: string } }).output_image;
    if (!img?.data) throw new GeminiError('이미지 응답이 비어 있습니다.');
    return Buffer.from(img.data, 'base64');
  } catch (e) {
    if (e instanceof GeminiError) throw e;
    throw new GeminiError(`이미지 생성 실패: ${(e as Error).message}`);
  }
}
