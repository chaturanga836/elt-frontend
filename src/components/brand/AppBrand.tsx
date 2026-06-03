'use client';

import Image from 'next/image';
import { Typography } from 'antd';
import {
  BRAND_LOGO_ALT,
  BRAND_LOGO_SRC,
  BRAND_NAME,
  BRAND_TAGLINE,
} from '@/constants/brand';

const { Text } = Typography;

export type AppBrandVariant = 'login' | 'marketing' | 'sider' | 'sider-collapsed';

type AppBrandProps = {
  variant?: AppBrandVariant;
  showTagline?: boolean;
};

function LogoPlaceholder({ size }: { size: number }) {
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        border: '1px dashed rgba(255,255,255,0.35)',
        background: 'rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: 'rgba(255,255,255,0.55)',
        fontSize: Math.max(9, size * 0.22),
        fontWeight: 600,
        letterSpacing: 0.5,
      }}
    >
      LOGO
    </div>
  );
}

function LogoPlaceholderLight({ size }: { size: number }) {
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        border: '1px dashed #d9d9d9',
        background: '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: '#8c8c8c',
        fontSize: Math.max(9, size * 0.22),
        fontWeight: 600,
        letterSpacing: 0.5,
      }}
    >
      LOGO
    </div>
  );
}

function BrandLogo({ size, light }: { size: number; light?: boolean }) {
  if (BRAND_LOGO_SRC) {
    return (
      <Image
        src={BRAND_LOGO_SRC}
        alt={BRAND_LOGO_ALT}
        width={size}
        height={size}
        style={{ objectFit: 'contain', borderRadius: 8 }}
        priority={light}
      />
    );
  }
  return light ? <LogoPlaceholderLight size={size} /> : <LogoPlaceholder size={size} />;
}

export default function AppBrand({
  variant = 'login',
  showTagline = variant === 'login',
}: AppBrandProps) {
  if (variant === 'sider-collapsed') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <BrandLogo size={36} />
        <Text
          style={{
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.5,
            lineHeight: 1,
          }}
        >
          DT
        </Text>
      </div>
    );
  }

  if (variant === 'marketing') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 8,
        }}
      >
        <BrandLogo size={48} />
        <div>
          <Text
            style={{
              color: '#fff',
              fontSize: 24,
              fontWeight: 700,
              display: 'block',
              lineHeight: 1.2,
              letterSpacing: -0.5,
            }}
          >
            {BRAND_NAME}
          </Text>
          {showTagline ? (
            <Text
              style={{
                color: 'rgba(240, 246, 252, 0.7)',
                fontSize: 13,
                display: 'block',
                marginTop: 2,
              }}
            >
              {BRAND_TAGLINE}
            </Text>
          ) : null}
        </div>
      </div>
    );
  }

  if (variant === 'sider') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <BrandLogo size={40} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <Text
            style={{
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              display: 'block',
              lineHeight: 1.2,
            }}
            ellipsis
          >
            {BRAND_NAME}
          </Text>
          {showTagline ? (
            <Text
              style={{
                color: 'rgba(255,255,255,0.55)',
                fontSize: 10,
                display: 'block',
                lineHeight: 1.3,
              }}
              ellipsis
            >
              {BRAND_TAGLINE}
            </Text>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        marginBottom: showTagline ? 28 : 16,
      }}
    >
      <BrandLogo size={56} light />
      <Text
        style={{
          marginTop: 14,
          marginBottom: 0,
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: -0.5,
          color: '#141414',
        }}
      >
        {BRAND_NAME}
      </Text>
      {showTagline ? (
        <Text type="secondary" style={{ marginTop: 6, fontSize: 13, maxWidth: 320 }}>
          {BRAND_TAGLINE}
        </Text>
      ) : null}
    </div>
  );
}
