import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vocab Book - 单词本",
  description: "个人单词本应用，支持艾宾浩斯复习",
};

const navItems = [
  { href: "/", label: "首页", icon: "📚" },
  { href: "/words", label: "单词", icon: "📝" },
  { href: "/review", label: "复习", icon: "🔄" },
  { href: "/quiz", label: "测试", icon: "✍️" },
  { href: "/stats", label: "统计", icon: "📊" },
  { href: "/import", label: "导入", icon: "📥" },
  { href: "/settings/api", label: "设置", icon: "⚙️" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* 导航栏 */}
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                <Link href="/" className="text-xl font-bold text-indigo-600">
                  📚 Vocab Book
                </Link>
                <div className="hidden md:flex space-x-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
                    >
                      <span className="mr-1">{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </div>
                {/* 移动端菜单按钮 */}
                <button className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100">
                  ☰
                </button>
              </div>
            </div>
          </nav>

          {/* 主内容 */}
          <main className="max-w-7xl mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
