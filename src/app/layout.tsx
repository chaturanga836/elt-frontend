// src/app/layout.tsx
import type { Metadata } from "next";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App } from 'antd';
import theme from '@/lib/antd/themeConfig';
import "./globals.css";
import StaticHandler from '@/lib/antd/static';
import VariableDropdownPortal from "@/components/ui/VariableDropdownPortal";
import AuthProvider from "@/components/auth/AuthProvider";
import AuthGuard from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Data Connections Manager",
  description: "Configure your REST, File, and Database connections",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AntdRegistry>
          <ConfigProvider theme={theme}>
            <App> 
              <AuthProvider>
                <AuthGuard>
                  <StaticHandler />
                  {children}
                  <VariableDropdownPortal />
                </AuthGuard>
              </AuthProvider>
            </App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}