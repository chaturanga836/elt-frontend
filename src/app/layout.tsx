// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App } from 'antd';
import theme from '@/lib/antd/themeConfig';
import "./globals.css";
import StaticHandler from '@/lib/antd/static';
import SideWrapper from "@/components/ui/SideWrapper";
import VariableDropdownPortal from "@/components/ui/VariableDropdownPortal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Data Connections Manager",
  description: "Configure your REST, File, and Database connections",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AntdRegistry>
          <ConfigProvider theme={theme}>
            <App> 
              <StaticHandler />
              <SideWrapper>
                {children}
              </SideWrapper>
              <VariableDropdownPortal />
            </App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}