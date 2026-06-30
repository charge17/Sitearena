'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import DataTable from '@/components/DataTable';
import { useToast } from '@/components/Toast';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  nicheId: number | null;
  parentId: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface Niche {
  id: number;
  name: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    nicheId: '',
    parentId: '',
    metaTitle: '',
    metaDescription: '',
    sortOrder: 0,
  });
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, nichesRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/niches'),
      ]);
      const categoriesData = await categoriesRes.json();
      const nichesData = await nichesRes.json();
      
      if (categoriesData.success) setCategories(categoriesData.data);
      if (nichesData.success) setNiches(nichesData.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/categories', {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory?.id,
          name: formData.name,
          description: formData.description,
          nicheId: formData.nicheId ? parseInt(formData.nicheId) : null,
          parentId: formData.parentId ? parseInt(formData.parentId) : null,
          metaTitle: formData.metaTitle,
          metaDescription: formData.metaDescription,
          sortOrder: formData.sortOrder,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(editingCategory ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح', 'success');
        closeModal();
        fetchData();
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('حدث خطأ', 'error');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      nicheId: category.nicheId?.toString() || '',
      parentId: category.parentId?.toString() || '',
      metaTitle: category.metaTitle || '',
      metaDescription: category.metaDescription || '',
      sortOrder: category.sortOrder,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('تم الحذف بنجاح', 'success');
        fetchData();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      nicheId: '',
      parentId: '',
      metaTitle: '',
      metaDescription: '',
      sortOrder: 0,
    });
  };

  const getNicheName = (nicheId: number | null) => {
    if (!nicheId) return '-';
    return niches.find(n => n.id === nicheId)?.name || '-';
  };

  const columns = [
    { key: 'name', label: 'الاسم' },
    { key: 'slug', label: 'Slug' },
    { 
      key: 'nicheId', 
      label: 'النيش',
      render: (item: Category) => getNicheName(item.nicheId)
    },
    { 
      key: 'isActive', 
      label: 'الحالة',
      render: (item: Category) => (
        <span className={`badge ${item.isActive ? 'badge-success' : 'badge-gray'}`}>
          {item.isActive ? 'نشط' : 'معطل'}
        </span>
      )
    },
    { key: 'sortOrder', label: 'الترتيب' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة التصنيفات</h1>
          <p className="text-gray-500 mt-1">تنظيم المقالات في تصنيفات</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <span>+</span>
          إضافة تصنيف
        </button>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={categories}
          loading={loading}
          emptyMessage="لا توجد تصنيفات"
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
        title={editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
        footer={
          <>
            <button onClick={closeModal} className="btn btn-secondary">إلغاء</button>
            <button onClick={handleSubmit} className="btn btn-primary">
              {editingCategory ? 'حفظ' : 'إضافة'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">اسم التصنيف *</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">النيش</label>
            <select
              className="select"
              value={formData.nicheId}
              onChange={(e) => setFormData({ ...formData, nicheId: e.target.value })}
            >
              <option value="">-- بدون نيش --</option>
              {niches.map((niche) => (
                <option key={niche.id} value={niche.id}>{niche.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">التصنيف الأب</label>
            <select
              className="select"
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
            >
              <option value="">-- بدون أب --</option>
              {categories
                .filter(c => c.id !== editingCategory?.id)
                .map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="label">الوصف</label>
            <textarea
              className="textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            />
          </div>
        </form>
      </Modal>

      {ToastComponent}
    </div>
  );
}
