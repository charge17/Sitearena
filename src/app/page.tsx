'use client';

import { useEffect, useState } from 'react';
import StatCard from '@/components/StatCard';
import Link from 'next/link';

interface Stats {
  articles: {
    total: number;
    published: number;
    draft: number;
    generating: number;
    totalWords: number;
    totalViews: number;
  };
  niches: number;
  categories: number;
  queue: {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  };
  ai: {
    total: number;
    active: number;
    totalRequests: number;
    successfulRequests: number;
  };
  ads: {
    total: number;
    active: number;
    totalImpressions: number;
    totalClicks: number;
  };
  pages: number;
  tasks: {
    total: number;
    active: number;
  };
  recentArticles: {
    id: number;
    title: string;
    status: string;
    createdAt: string;
    wordCount: number;
  }[];
  pendingHeadlines: {
    id: number;
    headline: string;
    nicheId: number;
  }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateArticle = async (headlineId: number) => {
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-article', headlineId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStats();
      }
    } catch (error) {
      console.error('Error generating article:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">لوحة التحكم</h1>
        <p className="text-gray-500">مرحباً بك في نظام إدارة المحتوى بالذكاء الاصطناعي</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="إجمالي المقالات"
          value={stats?.articles.total || 0}
          icon="📝"
          color="blue"
        />
        <StatCard
          title="المقالات المنشورة"
          value={stats?.articles.published || 0}
          icon="✅"
          color="green"
        />
        <StatCard
          title="في قائمة الانتظار"
          value={stats?.queue.pending || 0}
          icon="⏳"
          color="yellow"
        />
        <StatCard
          title="النيشات النشطة"
          value={stats?.niches || 0}
          icon="🎯"
          color="purple"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="إجمالي الكلمات"
          value={stats?.articles.totalWords?.toLocaleString() || 0}
          icon="📊"
          color="blue"
        />
        <StatCard
          title="المشاهدات"
          value={stats?.articles.totalViews?.toLocaleString() || 0}
          icon="👁️"
          color="green"
        />
        <StatCard
          title="الإعلانات النشطة"
          value={stats?.ads.active || 0}
          icon="📢"
          color="yellow"
        />
        <StatCard
          title="طلبات AI"
          value={stats?.ai.totalRequests || 0}
          icon="🤖"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Articles */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-bold text-gray-900">أحدث المقالات</h2>
            <Link href="/articles" className="text-blue-600 hover:text-blue-700 text-sm">
              عرض الكل ←
            </Link>
          </div>
          
          {stats?.recentArticles && stats.recentArticles.length > 0 ? (
            <div className="space-y-3">
              {stats.recentArticles.map((article) => (
                <div 
                  key={article.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{article.title}</p>
                    <p className="text-sm text-gray-500">
                      {article.wordCount} كلمة • {new Date(article.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <span className={`badge ${
                    article.status === 'published' ? 'badge-success' :
                    article.status === 'draft' ? 'badge-gray' :
                    article.status === 'generating' ? 'badge-info' : 'badge-warning'
                  }`}>
                    {article.status === 'published' ? 'منشور' :
                     article.status === 'draft' ? 'مسودة' :
                     article.status === 'generating' ? 'قيد الإنشاء' : article.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد مقالات بعد</p>
              <Link href="/niches" className="text-blue-600 hover:underline mt-2 inline-block">
                ابدأ بإضافة نيش جديد
              </Link>
            </div>
          )}
        </div>

        {/* Pending Headlines */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-bold text-gray-900">عناوين في الانتظار</h2>
            <Link href="/headlines" className="text-blue-600 hover:text-blue-700 text-sm">
              عرض الكل ←
            </Link>
          </div>
          
          {stats?.pendingHeadlines && stats.pendingHeadlines.length > 0 ? (
            <div className="space-y-3">
              {stats.pendingHeadlines.map((headline) => (
                <div 
                  key={headline.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <p className="font-medium text-gray-900 flex-1 truncate ml-4">
                    {headline.headline}
                  </p>
                  <button
                    onClick={() => handleGenerateArticle(headline.id)}
                    className="btn btn-primary text-sm"
                  >
                    إنشاء مقال
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد عناوين في الانتظار</p>
              <Link href="/ai" className="text-blue-600 hover:underline mt-2 inline-block">
                توليد عناوين جديدة
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 card">
        <div className="card-header">
          <h2 className="text-lg font-bold text-gray-900">إجراءات سريعة</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/niches" className="p-4 bg-blue-50 rounded-xl text-center hover:bg-blue-100 transition-colors">
            <span className="text-3xl block mb-2">🎯</span>
            <span className="font-medium text-blue-900">إضافة نيش</span>
          </Link>
          <Link href="/ai" className="p-4 bg-emerald-50 rounded-xl text-center hover:bg-emerald-100 transition-colors">
            <span className="text-3xl block mb-2">🤖</span>
            <span className="font-medium text-emerald-900">توليد محتوى</span>
          </Link>
          <Link href="/articles" className="p-4 bg-amber-50 rounded-xl text-center hover:bg-amber-100 transition-colors">
            <span className="text-3xl block mb-2">📝</span>
            <span className="font-medium text-amber-900">إدارة المقالات</span>
          </Link>
          <Link href="/seo" className="p-4 bg-purple-50 rounded-xl text-center hover:bg-purple-100 transition-colors">
            <span className="text-3xl block mb-2">🔍</span>
            <span className="font-medium text-purple-900">إعدادات SEO</span>
          </Link>
        </div>
      </div>

      {/* AI Status */}
      <div className="mt-8 card">
        <div className="card-header">
          <h2 className="text-lg font-bold text-gray-900">حالة الذكاء الاصطناعي</h2>
          <Link href="/ai" className="text-blue-600 hover:text-blue-700 text-sm">
            الإعدادات ←
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats?.ai.active || 0}</p>
            <p className="text-sm text-gray-500">نماذج نشطة</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats?.ai.totalRequests || 0}</p>
            <p className="text-sm text-gray-500">إجمالي الطلبات</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats?.ai.successfulRequests || 0}</p>
            <p className="text-sm text-gray-500">طلبات ناجحة</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {stats?.ai.totalRequests ? 
                Math.round((stats.ai.successfulRequests / stats.ai.totalRequests) * 100) : 0}%
            </p>
            <p className="text-sm text-gray-500">معدل النجاح</p>
          </div>
        </div>
      </div>
    </div>
  );
}
