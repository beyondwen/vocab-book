import type { Metadata } from "next";
import "./globals.css";
import AppNav from "@/app/components/AppNav";

export const metadata: Metadata = {
  title: "Vocab Book - 单词本",
  description: "个人单词本应用，支持艾宾浩斯复习",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen bg-gray-50">
          <AppNav />

          {/* 主内容 */}
          <main className="max-w-7xl mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
