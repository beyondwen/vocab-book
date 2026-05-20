'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/app/components/LogoutButton';

const navItems = [
  { href: '/', label: '首页', icon: '📚' },
  { href: '/words', label: '单词', icon: '📝' },
  { href: '/review', label: '复习', icon: '🔄' },
  { href: '/quiz', label: '测试', icon: '✍️' },
  { href: '/stats', label: '统计', icon: '📊' },
  { href: '/import', label: '导入', icon: '📥' },
  { href: '/settings/api', label: '设置', icon: '⚙️' },
];

export default function AppNav() {
  const pathname = usePathname();

  if (pathname === '/login') {
    return null;
  }

  return (
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
            <LogoutButton />
          </div>
        </div>
        <div className="md:hidden flex gap-1 overflow-x-auto border-t py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-indigo-600 transition-colors"
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
