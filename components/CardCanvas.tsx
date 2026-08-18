'use client';
import { forwardRef } from 'react';
import { Brand, Card } from '@/lib/types';

export const CARD_W = 1080;
export const CARD_H = 1350;
const SAFE = 80;

type Props = { card: Card; brand: Brand; index: number; total: number; watermark?: boolean };

/**
 * 하이브리드 렌더러 — 배경/캐릭터는 생성 이미지, 텍스트는 이 DOM 레이어.
 * 미리보기와 내보내기가 같은 노드라 WYSIWYG 가 구조적으로 보장된다.
 */
const CardCanvas = forwardRef<HTMLDivElement, Props>(function CardCanvas(
  { card, brand, index, total, watermark = true },
  ref,
) {
  const { colors } = brand;
  const isCover = card.role === 'cover';
  const isCta = card.role === 'cta';

  return (
    <div
      ref={ref}
      style={{
        width: CARD_W,
        height: CARD_H,
        position: 'relative',
        overflow: 'hidden',
        background: colors.bg,
        fontFamily: 'var(--font-pretendard), system-ui, sans-serif',
      }}
    >
      {card.backgroundUrl ? (
        <img
          src={card.backgroundUrl}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(140deg, ${colors.primary}, ${colors.secondary})`,
          }}
        />
      )}

      {/* 텍스트 가독성 확보용 그라데이션 — QC 대비 검사와 짝을 이룬다 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isCover
            ? `linear-gradient(90deg, ${colors.bg}F2 0%, ${colors.bg}E0 46%, ${colors.bg}00 78%)`
            : isCta
              ? `${colors.bg}D9`
              : `linear-gradient(180deg, ${colors.bg}F0 0%, ${colors.bg}D9 58%, ${colors.bg}00 100%)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: SAFE,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: isCta ? 'center' : isCover ? 'flex-end' : 'flex-start',
          alignItems: isCta ? 'center' : 'flex-start',
          textAlign: isCta ? 'center' : 'left',
          // 상단 로고·페이지 표시와 본문이 겹치지 않도록 헤더 높이만큼 비운다
          paddingTop: isCover ? 0 : 130,
        }}
      >
        {!isCta && (
          <div
            style={{
              height: 10,
              width: 96,
              borderRadius: 999,
              background: colors.primary,
              marginBottom: 36,
            }}
          />
        )}

        <h1
          style={{
            margin: 0,
            color: colors.text,
            fontSize: isCover ? 104 : isCta ? 76 : 76,
            lineHeight: 1.18,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            maxWidth: isCover ? '78%' : '100%',
            wordBreak: 'keep-all',
          }}
        >
          {card.title}
        </h1>

        {card.body && (
          <p
            style={{
              marginTop: 32,
              marginBottom: 0,
              color: colors.text,
              opacity: 0.78,
              fontSize: 42,
              lineHeight: 1.6,
              fontWeight: 500,
              maxWidth: isCover ? '74%' : '86%',
              wordBreak: 'keep-all',
            }}
          >
            {card.body}
          </p>
        )}

        {isCta && (
          <div
            style={{
              marginTop: 52,
              borderRadius: 999,
              background: colors.primary,
              color: '#fff',
              padding: '26px 64px',
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            @{brand.name}
          </div>
        )}
      </div>

      {/* 로고 · 페이지 인디케이터 */}
      <div
        style={{
          position: 'absolute',
          top: SAFE,
          left: SAFE,
          right: SAFE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {brand.logoDataUrl ? (
          <img src={brand.logoDataUrl} alt="" style={{ height: 64, objectFit: 'contain' }} />
        ) : (
          <span style={{ color: colors.text, opacity: 0.62, fontSize: 32, fontWeight: 700 }}>{brand.name}</span>
        )}
        <span style={{ color: colors.text, opacity: 0.45, fontSize: 30, fontWeight: 600 }}>
          {index + 1} / {total}
        </span>
      </div>

      {watermark && (
        <span
          style={{
            position: 'absolute',
            bottom: 28,
            right: 34,
            fontSize: 24,
            fontWeight: 600,
            color: colors.text,
            opacity: 0.34,
          }}
        >
          Free 체험으로 제작
        </span>
      )}
    </div>
  );
});

export default CardCanvas;
