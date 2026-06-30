'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import DataTable from '@/components/DataTable';
import { useToast } from '@/components/Toast';

interface Niche {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  keywords: string[];
  isActive: boolean;
  articleCount: number;
  createdAt: string;
}

export default function NichesPage() {
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNiche, setEditingNiche] = useState<Niche | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    keywords: '',
  });
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    fetchNiches();
  }, []);

  const fetchNiches = async () => {
    try {
      const res = await fetch('/api/niches');
      const data = await res.json();
      if (data.success) {
        setNiches(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('فشل في تحميل النيشات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const keywords = formData.keywords.split(',').map(k => k.trim()).filter(Boolean);
      
      const res = await fetch('/api/niches', {
        method: editingNiche ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingNiche?.id,
          name: formData.name,
          description: formData.description,
          keywords,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(editingNiche ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح', 'success');
        setIsModalOpen(false);
        setEditingNiche(null);
        setFormData({ name: '', description: '', keywords: '' });
        fetchNiches();
      } else {
        showToast(data.error || 'حدث خطأ', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('حدث خطأ أثناء الحفظ', 'error');
    }
  };

  const handleEdit = (niche: Niche) => {
    setEditingNiche(niche);
    setFormData({
      name: niche.name,
      description: niche.description || '',
      keywords: niche.keywords?.join(', ') || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    
    try {
      const res = await fetch(`/api/niches?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('تم الحذف بنجاح', 'success');
        fetchNiches();
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('فشل في الحذف', 'error');
    }
  };

  const handleToggleActive = async (niche: Niche) => {
    try {
      const res = await fetch('/api/niches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: niche.id, isActive: !niche.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        fetchNiches();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleGenerateHeadlines = async (nicheId: number) => {
    showToast('جاري توليد العناوين...', 'info');
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-headlines', nicheId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('تم توليد العناوين بنجاح!', 'success');
      } else {
        showToast(data.error || 'فشل في التوليد', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('حدث خطأ', 'error');
    }
  };

  const columns = [
    { key: 'name', label: 'الاسم' },
    { 
      key: 'keywords', 
      label: 'الكلمات المفتاحية',
      render: (item: Niche) => (
        <div className="flex flex-wrap gap-1">
          {item.keywords?.slice(0, 3).map((k, i) => (
            <span key={i} className="badge badge-info">{k}</span>
          ))}
          {item.keywords?.length > 3 && (
            <span className="badge badge-gray">+{item.keywords.length - 3}</span>
          )}
        </div>
      )
    },
    { 
      key: 'articleCount', 
      label: 'المقالات',
      render: (item: Niche) => <span className="font-bold">{item.articleCount || 0}</span>
    },
    { 
      key: 'isActive', 
      label: 'الحالة',
      render: (item: Niche) => (
        <button
          onClick={() => handleToggleActive(item)}
          className={`badge ${item.isActive ? 'badge-success' : 'badge-gray'}`}
        >
          {item.isActive ? 'نشط' : 'معطل'}
        </button>
      )
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة النيشات</h1>
          <p className="text-gray-500 mt-1">إدارة النيشات والمجالات المستهدفة</p>
        </div>
        <button
          onClick={() => {
            setEditingNiche(null);
            setFormData({ name: '', description: '', keywords: '' });
            setIsModalOpen(true);
          }}
          className="btn btn-primary"
        >
          <span>+</span>
          إضافة نيش جديد
        </button>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={niches}
          loading={loading}
          emptyMessage="لا توجد نيشات بعد"
          actions={(item) => (
            <div className="flex gap-2">
              <button
                onClick={() => handleGenerateHeadlines(item.id)}
                className="btn btn-success text-xs py-1 px-2"
                title="توليد عناوين"
              >
                🤖
              </button>
              <button
                onClick={() => handleEdit(item)}
                className="btn btn-secondary text-xs py-1 px-2"
              >
                تعديل
              </button>
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingNiche ? 'تعديل النيش' : 'إضافة نيش جديد'}
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              إلغاء
            </button>
            <button onClick={handleSubmit} className="btn btn-primary">
              {editingNiche ? 'حفظ التغييرات' : 'إضافة'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">اسم النيش *</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: التقنية، الصحة، السفر..."
              required
            />
          </div>
          <div>
            <label className="label">الوصف</label>
            <textarea
              className="textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="وصف مختصر للنيش..."
            />
          </div>
          <div>
            <label className="label">الكلمات المفتاحية (مفصولة بفواصل)</label>
            <input
              type="text"
              className="input"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              placeholder="كلمة1, كلمة2, كلمة3..."
            />
          </div>
        </form>
      </Modal>

      {ToastComponent}
    </div>
  );
}
