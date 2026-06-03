'use client';

import Image from 'next/image';
import { Typography } from 'antd';
import {
  BRAND_LOGO_ALT,
  BRAND_LOGO_ASPECT,
  BRAND_LOGO_INCLUDES_WORDMARK,
  BRAND_LOGO_SRC,
  BRAND_NAME,
  BRAND_TAGLINE,
} from '@/constants/brand';

const { Text } = Typography;

export type AppBrandVariant =
  | 'login'
  | 'marketing'
  | 'sider'
  | 'sider-collapsed'
  | 'header';

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
      }}
    >
      LOGO
    </div>
  );
}

type BrandLogoProps = {
  height: number;
  /** Show only the left (icon) portion — for collapsed sidebar. */
  iconOnly?: boolean;
  light?: boolean;
};

function BrandLogo({ height, iconOnly = false, light }: BrandLogoProps) {
  if (!BRAND_LOGO_SRC) {
    return light ? <LogoPlaceholderLight size={height} /> : <LogoPlaceholder size={height} />;
  }

  const width = Math.round(height * BRAND_LOGO_ASPECT);

  if (iconOnly) {
    return (
      <div
        style={{
          width: height,
          height,
          overflow: 'hidden',
          flexShrink: 0,
          borderRadius: 6,
        }}
      >
        <Image
          src={BRAND_LOGO_SRC}
          alt={BRAND_LOGO_ALT}
          width={width}
          height={height}
          style={{ objectFit: 'contain', objectPosition: 'left center' }}
          priority={light}
        />
      </div>
    );
  }

  return (
    <Image
      src={BRAND_LOGO_SRC}
      alt={BRAND_LOGO_ALT}
      width={width}
      height={height}
      style={{ objectFit: 'contain', objectPosition: 'left center', maxWidth: '100%' }}
      priority={light}
    />
  );
}

function WordmarkText({
  color,
  taglineColor,
  showTagline,
}: {
  color: string;
  taglineColor: string;
  showTagline: boolean;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <Text
        style={{
          color,
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
            color: taglineColor,
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
  );
}

export default function AppBrand({
  variant = 'login',
  showTagline = variant === 'login',
}: AppBrandProps) {
  const showTextBesideLogo = !BRAND_LOGO_INCLUDES_WORDMARK;

  if (variant === 'sider-collapsed') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <BrandLogo height={36} iconOnly />
      </div>
    );
  }

  if (variant === 'header') {
    return <BrandLogo height={32} />;
  }

  if (variant === 'marketing') {
    return (
      <div style={{ marginBottom: 8 }}>
        <BrandLogo height={44} />
        {showTextBesideLogo ? (
          <div style={{ marginTop: 12 }}>
            <WordmarkText
              color="#fff"
              taglineColor="rgba(240, 246, 252, 0.7)"
              showTagline={showTagline}
            />
          </div>
        ) : showTagline ? (
          <Text
            style={{
              color: 'rgba(240, 246, 252, 0.7)',
              fontSize: 13,
              display: 'block',
              marginTop: 10,
            }}
          >
            {BRAND_TAGLINE}
          </Text>
        ) : null}
      </div>
    );
  }

  if (variant === 'sider') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
        <BrandLogo height={34} />
        {showTextBesideLogo ? (
          <div style={{ marginLeft: 10, minWidth: 0, flex: 1 }}>
            <WordmarkText
              color="#fff"
              taglineColor="rgba(255,255,255,0.55)"
              showTagline={showTagline}
            />
          </div>
        ) : null}
      </div>
    );
  }

  if (variant === 'login') {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: showTagline ? 20 : 12,
        }}
      >
        <BrandLogo height={48} light />
        {showTextBesideLogo ? (
          <>
            <Text
              style={{
                marginTop: 14,
                fontSize: 26,
                fontWeight: 700,
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
          </>
        ) : showTagline ? (
          <Text type="secondary" style={{ marginTop: 10, fontSize: 13, maxWidth: 320 }}>
            {BRAND_TAGLINE}
          </Text>
        ) : null}
      </div>
    );
  }

  return null;
}
