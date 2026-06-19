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
      nodeHoverBg: 'rgba(255, 255, 255, 0.06)',
      nodeHoverColor: palette.text,
      nodeSelectedBg: 'rgba(255, 107, 0, 0.2)',
      nodeSelectedColor: palette.text,
      directoryNodeSelectedBg: 'rgba(255, 107, 0, 0.2)',
      directoryNodeSelectedColor: palette.text,
    },
  },
};

export default theme;
