'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import DataTable from '@/components/DataTable';
import { useToast } from '@/components/Toast';

interface Page {
  id: number;
  title: string;
  slug: string;
  content: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isActive: boolean;
  template: string;
  sortOrder: number;
  createdAt: string;
}

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    template: 'default',
    sortOrder: 0,
  });
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/pages');
      const data = await res.json();
      if (data.success) setPages(data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/pages', {
        method: editingPage ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPage?.id,
          ...formData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(editingPage ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح', 'success');
        closeModal();
        fetchPages();
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('حدث خطأ', 'error');
    }
  };

  const handleEdit = (page: Page) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      content: page.content || '',
      metaTitle: page.metaTitle || '',
      metaDescription: page.metaDescription || '',
      template: page.template,
      sortOrder: page.sortOrder,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    
    try {
      const res = await fetch(`/api/pages?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('تم الحذف بنجاح', 'success');
        fetchPages();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleToggle = async (page: Page) => {
    try {
      const res = await fetch('/api/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: page.id, isActive: !page.isActive }),
      });
      const data = await res.json();
      if (data.success) fetchPages();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPage(null);
    setFormData({
      title: '',
      content: '',
      metaTitle: '',
      metaDescription: '',
      template: 'default',
      sortOrder: 0,
    });
  };

  const columns = [
    { key: 'title', label: 'العنوان' },
    { 
      key: 'slug', 
      label: 'الرابط',
      render: (item: Page) => <code className="text-sm">/{item.slug}</code>
    },
    { 
      key: 'template', 
      label: 'القالب',
      render: (item: Page) => <span className="badge badge-info">{item.template}</span>
    },
    { key: 'sortOrder', label: 'الترتيب' },
    { 
      key: 'isActive', 
      label: 'الحالة',
      render: (item: Page) => (
        <button
          onClick={() => handleToggle(item)}
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
          <h1 className="text-2xl font-bold text-gray-900">الصفحات الثابتة</h1>
          <p className="text-gray-500 mt-1">إدارة صفحات مثل من نحن، اتصل بنا، سياسة الخصوصية</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <span>+</span>
          إضافة صفحة
        </button>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={pages}
          loading={loading}
          emptyMessage="لا توجد صفحات"
          actions={(item) => (
            <div className="flex gap-2">
              <button onClick={() => handleEdit(item)} className="btn btn-secondary text-xs py-1 px-2">
                تعديل
              </button>
              <button onClick={() => handleDelete(item.id)} className="btn btn-danger text-xs py-1 px-2">
                حذف
              </button>
            </div>
          )}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingPage ? 'تعديل الصفحة' : 'إضافة صفحة جديدة'}
        size="xl"
        footer={
          <>
            <button onClick={closeModal} className="btn btn-secondary">إلغاء</button>
            <button onClick={handleSubmit} className="btn btn-primary">
              {editingPage ? 'حفظ' : 'إضافة'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">عنوان الصفحة *</label>
              <input
                type="text"
                className="input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">القالب</label>
              <select
                className="select"
                value={formData.template}
                onChange={(e) => setFormData({ ...formData, template: e.target.value })}
              >
                <option value="default">افتراضي</option>
                <option value="full-width">عرض كامل</option>
                <option value="sidebar">مع شريط جانبي</option>
                <option value="landing">صفحة هبوط</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">المحتوى</label>
            <textarea
              className="textarea"
              rows={12}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="محتوى الصفحة بتنسيق HTML..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">عنوان Meta</label>
              <input
                type="text"
                className="input"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                maxLength={60}
              />
            </div>
            <div>
              <label className="label">الترتيب</label>
              <input
                type="number"
                className="input"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label className="label">وصف Meta</label>
            <textarea
              className="textarea"
              rows={2}
              value={formData.metaDescription}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
              maxLength={160}
            />
          </div>
        </form>
      </Modal>

      {ToastComponent}
    </div>
  );
}
