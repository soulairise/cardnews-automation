import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Nav from '@/components/Nav';

/**
 * next/font 로 불러야 basePath 가 붙는다.
 * CSS 의 url('/fonts/...') 은 basePath 를 적용받지 않아 배포 환경에서 404 가 나고,
 * 폰트가 깨지는 것은 물론 PNG 내보내기(html-to-image)까지 실패한다.
 * Pretendard, SIL Open Font License 1.1 (상업적 사용 가능)
 */
const pretendard = localFont({
  src: '../public/fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  weight: '45 920',
  display: 'block',
});

export const metadata: Metadata = {
  title: '브랜드 카드뉴스 자동화',
  description: '브랜드를 등록하고 홍보 문구만 넣으면 인스타그램 카드뉴스가 만들어집니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Nav />
        <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
