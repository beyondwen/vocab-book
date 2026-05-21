'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, BookOpen, FileText, Home, Import, KeyRound, RotateCcw, Target } from 'lucide-react';
import LogoutButton from '@/app/components/LogoutButton';

const navItems = [
  { href: '/', label: '首页', icon: Home },
  { href: '/words', label: '单词', icon: BookOpen },
  { href: '/content', label: '内容', icon: FileText },
  { href: '/review', label: '复习', icon: RotateCcw },
  { href: '/quiz', label: '测试', icon: Target },
  { href: '/stats', label: '统计', icon: BarChart3 },
  { href: '/import', label: '导入', icon: Import },
  { href: '/settings/api', label: '设置', icon: KeyRound },
];

function isActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppNav() {
  const pathname = usePathname();

  if (pathname === '/login') {
    return null;
  }

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-indigo-700">
            <BookOpen size={24} />
            Vocab Book
          </Link>
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-700'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
            <LogoutButton />
          </div>
        </div>
        <div className="md:hidden flex gap-1 overflow-x-auto border-t py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-700'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
