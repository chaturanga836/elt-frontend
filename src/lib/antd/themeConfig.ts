import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';
import { palette } from '@/constants/theme';

const theme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    fontSize: 14,
    colorPrimary: palette.primary,
    colorInfo: palette.accentCyan,
    colorLink: palette.accentCyan,
    colorBgBase: palette.bgBase,
    colorBgContainer: palette.bgSurface,
    colorBgElevated: palette.bgElevated,
    colorBgLayout: palette.bgBase,
    colorText: palette.text,
    colorTextSecondary: palette.textSecondary,
    colorTextTertiary: palette.textMuted,
    colorBorder: palette.borderSubtle,
    borderRadius: 8,
  },
  components: {
    Layout: {
      headerBg: palette.bgSurface,
      bodyBg: palette.bgBase,
      siderBg: palette.bgMuted,
      triggerBg: palette.bgElevated,
    },
    Button: {
      fontWeight: 500,
      primaryShadow: palette.glowOrange,
    },
    Card: {
      colorBgContainer: palette.bgSurface,
    },
    Menu: {
      darkItemBg: palette.bgMuted,
      darkSubMenuItemBg: palette.bgBase,
    },
    Tree: {
      nodeHoverBg: palette.hoverOverlay,
      nodeHoverColor: palette.text,
      nodeSelectedBg: palette.selectedBg,
      nodeSelectedColor: palette.text,
      directoryNodeSelectedBg: palette.selectedBg,
      directoryNodeSelectedColor: palette.text,
    },
    Table: {
      headerBg: palette.bgElevated,
      headerColor: palette.textSecondary,
      rowHoverBg: palette.hoverOverlay,
      borderColor: palette.borderSubtle,
      colorBgContainer: palette.bgSurface,
    },
    Tabs: {
      inkBarColor: palette.primary,
      itemActiveColor: palette.primary,
      itemSelectedColor: palette.primary,
      itemHoverColor: palette.accentCyan,
    },
    Divider: {
      colorSplit: palette.borderSubtle,
    },
    Input: {
      activeBorderColor: palette.accentCyan,
      hoverBorderColor: palette.border,
    },
    Badge: {
      colorPrimary: palette.primary,
    },
    // Alerts keep light semantic backgrounds; darkAlgorithm text tokens are white and unreadable on them.
    Alert: {
      colorText: 'rgba(0, 0, 0, 0.88)',
      colorTextHeading: 'rgba(0, 0, 0, 0.88)',
      colorIcon: 'rgba(0, 0, 0, 0.45)',
      colorIconHover: 'rgba(0, 0, 0, 0.88)',
      colorInfoBg: '#e6f4ff',
      colorInfoBorder: '#91caff',
      colorSuccessBg: '#f6ffed',
      colorSuccessBorder: '#b7eb8f',
      colorWarningBg: '#fffbe6',
      colorWarningBorder: '#ffe58f',
      colorErrorBg: '#fff2f0',
      colorErrorBorder: '#ffccc7',
    },
  },
};

export default theme;
