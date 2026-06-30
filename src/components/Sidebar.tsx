'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuItem {
  href: string;
  label: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  { href: '/', label: 'لوحة التحكم', icon: '📊' },
  { href: '/niches', label: 'إدارة النيشات', icon: '🎯' },
  { href: '/categories', label: 'التصنيفات', icon: '📁' },
  { href: '/articles', label: 'المقالات', icon: '📝' },
  { href: '/headlines', label: 'قائمة العناوين', icon: '📋' },
  { href: '/ai', label: 'الذكاء الاصطناعي', icon: '🤖' },
  { href: '/ads', label: 'الإعلانات', icon: '📢' },
  { href: '/scripts', label: 'السكريبتات', icon: '💻' },
  { href: '/pages', label: 'الصفحات الثابتة', icon: '📄' },
  { href: '/seo', label: 'إعدادات SEO', icon: '🔍' },
  { href: '/networks', label: 'شبكة المقالات', icon: '🔗' },
  { href: '/tasks', label: 'المهام المجدولة', icon: '⏰' },
  { href: '/plugins', label: 'الإضافات', icon: '🧩' },
  { href: '/settings', label: 'الإعدادات', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          مدير المحتوى
        </h1>
        <p className="text-xs text-gray-400 mt-1">نظام إدارة المحتوى بالذكاء الاصطناعي</p>
      </div>
      
      <nav className="py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            م
          </div>
          <div>
            <p className="text-sm font-medium text-white">مدير النظام</p>
            <p className="text-xs text-gray-400">admin@site.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
