'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';

interface Headline {
  id: number;
  nicheId: number | null;
  headline: string;
  subHeadlines: string[];
  faqQuestions: string[];
  status: string;
  priority: number;
  sourceType: string;
  articleId: number | null;
  createdAt: string;
}

interface Niche {
  id: number;
  name: string;
}

export default function HeadlinesPage() {
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHeadline, setSelectedHeadline] = useState<Headline | null>(null);
  const [formData, setFormData] = useState({
    nicheId: '',
    headline: '',
    subHeadlines: '',
  });
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      
      const [headlinesRes, nichesRes] = await Promise.all([
        fetch(`/api/headlines?${params}`),
        fetch('/api/niches'),
      ]);
      
      const headlinesData = await headlinesRes.json();
      const nichesData = await nichesRes.json();
      
      if (headlinesData.success) setHeadlines(headlinesData.data);
      if (nichesData.success) setNiches(nichesData.data);
    } catch (error) {
      console.error('Error:', error);
      showToast('فشل في تحميل البيانات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateArticle = async (headlineId: number) => {
    showToast('جاري توليد المقال...', 'info');
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-article', headlineId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('تم توليد المقال بنجاح!', 'success');
        fetchData();
      } else {
        showToast(data.error || 'فشل في التوليد', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('حدث خطأ', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    
    try {
      const res = await fetch(`/api/headlines?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('تم الحذف بنجاح', 'success');
        fetchData();
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('فشل في الحذف', 'error');
    }
  };

  const handleAddHeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/headlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nicheId: parseInt(formData.nicheId) || null,
          headline: formData.headline,
          subHeadlines: formData.subHeadlines.split('\n').filter(Boolean),
          sourceType: 'manual',
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('تم إضافة العنوان بنجاح', 'success');
        setIsModalOpen(false);
        setFormData({ nicheId: '', headline: '', subHeadlines: '' });
        fetchData();
      } else {
        showToast(data.error || 'حدث خطأ', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('حدث خطأ', 'error');
    }
  };

  const getNicheName = (nicheId: number | null) => {
    if (!nicheId) return '-';
    return niches.find(n => n.id === nicheId)?.name || '-';
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; label: string }> = {
      pending: { class: 'badge-warning', label: 'في الانتظار' },
      running: { class: 'badge-info', label: 'قيد التنفيذ' },
      completed: { class: 'badge-success', label: 'مكتمل' },
      failed: { class: 'badge-danger', label: 'فشل' },
    };
    return badges[status] || { class: 'badge-gray', label: status };
  };

  const columns = [
    { 
      key: 'headline', 
      label: 'العنوان',
      render: (item: Headline) => (
        <div className="max-w-md">
          <p className="font-medium text-gray-900 truncate">{item.headline}</p>
          <p className="text-xs text-gray-500 mt-1">
            {item.subHeadlines?.length || 0} عنوان فرعي • {item.faqQuestions?.length || 0} FAQ
          </p>
        </div>
      )
    },
    { 
      key: 'nicheId', 
      label: 'النيش',
      render: (item: Headline) => getNicheName(item.nicheId)
    },
    { 
      key: 'sourceType', 
      label: 'المصدر',
      render: (item: Headline) => (
        <span className={`badge ${item.sourceType === 'faq' ? 'badge-info' : item.sourceType === 'generated' ? 'badge-success' : 'badge-gray'}`}>
          {item.sourceType === 'faq' ? 'FAQ' : item.sourceType === 'generated' ? 'AI' : 'يدوي'}
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'الحالة',
      render: (item: Headline) => {
        const badge = getStatusBadge(item.status);
        return <span className={`badge ${badge.class}`}>{badge.label}</span>;
      }
    },
    { 
      key: 'createdAt', 
      label: 'التاريخ',
      render: (item: Headline) => (
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
          <h1 className="text-2xl font-bold text-gray-900">قائمة العناوين</h1>
          <p className="text-gray-500 mt-1">إدارة العناوين في قائمة الانتظار</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          <span>+</span>
          إضافة عنوان يدوي
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'الكل' },
            { value: 'pending', label: 'في الانتظار' },
            { value: 'running', label: 'قيد التنفيذ' },
            { value: 'completed', label: 'مكتمل' },
            { value: 'failed', label: 'فشل' },
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
          <p className="text-2xl font-bold text-gray-900">{headlines.length}</p>
          <p className="text-sm text-gray-500">إجمالي العناوين</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-amber-600">
            {headlines.filter(h => h.status === 'pending').length}
          </p>
          <p className="text-sm text-gray-500">في الانتظار</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {headlines.filter(h => h.status === 'completed').length}
          </p>
          <p className="text-sm text-gray-500">مكتمل</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-600">
            {headlines.filter(h => h.status === 'failed').length}
          </p>
          <p className="text-sm text-gray-500">فشل</p>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={headlines}
          loading={loading}
          emptyMessage="لا توجد عناوين في القائمة"
          onRowClick={(item) => setSelectedHeadline(item)}
          actions={(item) => (
            <div className="flex gap-2">
              {item.status === 'pending' && (
                <button
                  onClick={() => handleGenerateArticle(item.id)}
                  className="btn btn-success text-xs py-1 px-2"
                >
                  إنشاء مقال
                </button>
              )}
              {item.status === 'failed' && (
                <button
                  onClick={() => handleGenerateArticle(item.id)}
                  className="btn btn-warning text-xs py-1 px-2"
                >
                  إعادة المحاولة
                </button>
              )}
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

      {/* Add Headline Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="إضافة عنوان يدوي"
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              إلغاء
            </button>
            <button onClick={handleAddHeadline} className="btn btn-primary">
              إضافة
            </button>
          </>
        }
      >
        <form onSubmit={handleAddHeadline} className="space-y-4">
          <div>
            <label className="label">النيش</label>
            <select
              className="select"
              value={formData.nicheId}
              onChange={(e) => setFormData({ ...formData, nicheId: e.target.value })}
            >
              <option value="">-- اختر النيش --</option>
              {niches.map((niche) => (
                <option key={niche.id} value={niche.id}>{niche.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">العنوان الرئيسي *</label>
            <input
              type="text"
              className="input"
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">العناوين الفرعية (سطر لكل عنوان)</label>
            <textarea
              className="textarea"
              rows={6}
              value={formData.subHeadlines}
              onChange={(e) => setFormData({ ...formData, subHeadlines: e.target.value })}
              placeholder="عنوان فرعي 1&#10;عنوان فرعي 2&#10;عنوان فرعي 3..."
            />
          </div>
        </form>
      </Modal>

      {/* Headline Details Modal */}
      <Modal
        isOpen={!!selectedHeadline}
        onClose={() => setSelectedHeadline(null)}
        title="تفاصيل العنوان"
        size="lg"
      >
        {selectedHeadline && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">العنوان الرئيسي</h3>
              <p className="text-lg">{selectedHeadline.headline}</p>
            </div>
            
            {selectedHeadline.subHeadlines?.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 mb-2">العناوين الفرعية ({selectedHeadline.subHeadlines.length})</h3>
                <ul className="list-disc list-inside space-y-1">
                  {selectedHeadline.subHeadlines.map((sub, i) => (
                    <li key={i} className="text-gray-700">{sub}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {selectedHeadline.faqQuestions?.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 mb-2">أسئلة FAQ ({selectedHeadline.faqQuestions.length})</h3>
                <ul className="list-disc list-inside space-y-1">
                  {selectedHeadline.faqQuestions.map((q, i) => (
                    <li key={i} className="text-gray-700">{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>

      {ToastComponent}
    </div>
  );
}
