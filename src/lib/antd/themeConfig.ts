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
  },
};

export default theme;
