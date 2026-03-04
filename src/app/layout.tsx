// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App } from 'antd'; // Added App here
import theme from '@/lib/antd/themeConfig';
import "./globals.css";
import StaticHandler from '@/lib/antd/static';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Data Connections Manager",
  description: "Configure your REST, File, and Database connections",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AntdRegistry>
          <ConfigProvider theme={theme}>
            {/* The <App> component is required for global hooks like 
              notification.error() to work correctly with your theme 
              and Axios interceptors.
            */}
            <App> 
              <StaticHandler />
              {children}
            </App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}