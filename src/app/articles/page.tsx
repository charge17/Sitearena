'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DataTable from '@/components/DataTable';
import { useToast } from '@/components/Toast';

interface Article {
  id: number;
  title: string;
  slug: string;
  status: string;
  wordCount: number;
  views: number;
  nicheId: number | null;
  categoryId: number | null;
  createdAt: string;
  publishedAt: string | null;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    fetchArticles();
  }, [filter]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      
      const res = await fetch(`/api/articles?${params}`);
      const data = await res.json();
      if (data.success) {
        setArticles(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('فشل في تحميل المقالات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المقال؟')) return;
    
    try {
      const res = await fetch(`/api/articles?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('تم الحذف بنجاح', 'success');
        fetchArticles();
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('فشل في الحذف', 'error');
    }
  };

  const handlePublish = async (article: Article) => {
    try {
      const res = await fetch('/api/articles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: article.id, 
          status: article.status === 'published' ? 'draft' : 'published' 
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(article.status === 'published' ? 'تم إلغاء النشر' : 'تم النشر بنجاح', 'success');
        fetchArticles();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; label: string }> = {
      published: { class: 'badge-success', label: 'منشور' },
      draft: { class: 'badge-gray', label: 'مسودة' },
      pending: { class: 'badge-warning', label: 'في الانتظار' },
      generating: { class: 'badge-info', label: 'قيد الإنشاء' },
      archived: { class: 'badge-gray', label: 'مؤرشف' },
    };
    return badges[status] || { class: 'badge-gray', label: status };
  };

  const columns = [
    { 
      key: 'title', 
      label: 'العنوان',
      render: (item: Article) => (
        <div className="max-w-md">
          <p className="font-medium text-gray-900 truncate">{item.title}</p>
          <p className="text-xs text-gray-500 mt-1">/{item.slug}</p>
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'الحالة',
      render: (item: Article) => {
        const badge = getStatusBadge(item.status);
        return <span className={`badge ${badge.class}`}>{badge.label}</span>;
      }
    },
    { 
      key: 'wordCount', 
      label: 'الكلمات',
      render: (item: Article) => <span>{item.wordCount?.toLocaleString() || 0}</span>
    },
    { 
      key: 'views', 
      label: 'المشاهدات',
      render: (item: Article) => <span>{item.views?.toLocaleString() || 0}</span>
    },
    { 
      key: 'createdAt', 
      label: 'التاريخ',
      render: (item: Article) => (
        <span className="text-sm text-gray-500">
          {new Date(item.createdAt).toLocaleDateString('ar-SA')}
        </span>
      )
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المقالات</h1>
          <p className="text-gray-500 mt-1">عرض وإدارة جميع المقالات</p>
        </div>
        <Link href="/articles/new" className="btn btn-primary">
          <span>+</span>
          مقال جديد
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'الكل' },
            { value: 'published', label: 'منشور' },
            { value: 'draft', label: 'مسودة' },
            { value: 'pending', label: 'في الانتظار' },
            { value: 'generating', label: 'قيد الإنشاء' },
            { value: 'archived', label: 'مؤرشف' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`btn ${filter === f.value ? 'btn-primary' : 'btn-secondary'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-900">{articles.length}</p>
          <p className="text-sm text-gray-500">إجمالي المقالات</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {articles.filter(a => a.status === 'published').length}
          </p>
          <p className="text-sm text-gray-500">منشور</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-600">
            {articles.filter(a => a.status === 'draft').length}
          </p>
          <p className="text-sm text-gray-500">مسودة</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-600">
            {articles.reduce((sum, a) => sum + (a.wordCount || 0), 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">إجمالي الكلمات</p>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={articles}
          loading={loading}
          emptyMessage="لا توجد مقالات بعد"
          actions={(item) => (
            <div className="flex gap-2">
              <button
                onClick={() => handlePublish(item)}
                className={`btn text-xs py-1 px-2 ${
                  item.status === 'published' ? 'btn-warning' : 'btn-success'
                }`}
              >
                {item.status === 'published' ? 'إلغاء النشر' : 'نشر'}
              </button>
              <Link
                href={`/articles/${item.id}`}
                className="btn btn-secondary text-xs py-1 px-2"
              >
                تعديل
              </Link>
              <button
                onClick={() => handleDelete(item.id)}
                className="btn btn-danger text-xs py-1 px-2"
              >
                حذف
              </button>
            </div>
          )}
        />
      </div>

      {ToastComponent}
    </div>
  );
}
