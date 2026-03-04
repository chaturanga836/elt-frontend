import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    fontSize: 14,
    colorPrimary: '#1677ff', // Your main brand blue
    borderRadius: 6,
    // Add other global tokens here
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      bodyBg: '#f5f7fa',
    },
    Button: {
      fontWeight: 500,
    },
  },
};

export default theme;