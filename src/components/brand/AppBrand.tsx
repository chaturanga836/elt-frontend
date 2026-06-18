'use client';

import { Typography } from 'antd';
import DtOrchLogo from '@/components/brand/DtOrchLogo';
import {
  BRAND_LOGO_INCLUDES_WORDMARK,
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

type BrandLogoProps = {
  height: number;
  /** Show only the left (icon) portion — for collapsed sidebar. */
  iconOnly?: boolean;
  light?: boolean;
};

function BrandLogo({ height, iconOnly = false, light }: BrandLogoProps) {
  return (
    <DtOrchLogo
      height={height}
      iconOnly={iconOnly}
      light={light}
      className="brand-logo"
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
