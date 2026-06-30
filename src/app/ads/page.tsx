'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import DataTable from '@/components/DataTable';
import { useToast } from '@/components/Toast';

interface Ad {
  id: number;
  name: string;
  type: string;
  code: string;
  position: string | null;
  isActive: boolean;
  impressions: number;
  clicks: number;
  startDate: string | null;
  endDate: string | null;
}

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'banner',
    code: '',
    position: '',
  });
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const res = await fetch('/api/ads');
      const data = await res.json();
      if (data.success) setAds(data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/ads', {
        method: editingAd ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAd?.id,
          ...formData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(editingAd ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح', 'success');
        closeModal();
        fetchAds();
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('حدث خطأ', 'error');
    }
  };

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      name: ad.name,
      type: ad.type,
      code: ad.code,
      position: ad.position || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    
    try {
      const res = await fetch(`/api/ads?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('تم الحذف بنجاح', 'success');
        fetchAds();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleToggle = async (ad: Ad) => {
    try {
      const res = await fetch('/api/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ad.id, isActive: !ad.isActive }),
      });
      const data = await res.json();
      if (data.success) fetchAds();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAd(null);
    setFormData({ name: '', type: 'banner', code: '', position: '' });
  };

  const columns = [
    { key: 'name', label: 'الاسم' },
    { 
      key: 'type', 
      label: 'النوع',
      render: (item: Ad) => {
        const types: Record<string, string> = {
          banner: 'بانر',
          popup: 'منبثق',
          inline: 'داخلي',
          sidebar: 'جانبي',
          native: 'أصلي',
        };
        return <span className="badge badge-info">{types[item.type] || item.type}</span>;
      }
    },
    { key: 'position', label: 'الموقع' },
    { 
      key: 'stats', 
      label: 'الإحصائيات',
      render: (item: Ad) => (
        <div className="text-sm">
          <span>{item.impressions} مشاهدة</span>
          <span className="mx-2">•</span>
          <span>{item.clicks} نقرة</span>
        </div>
      )
    },
    { 
      key: 'isActive', 
      label: 'الحالة',
      render: (item: Ad) => (
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
          <h1 className="text-2xl font-bold text-gray-900">إدارة الإعلانات</h1>
          <p className="text-gray-500 mt-1">إدارة جميع أنواع الإعلانات</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <span>+</span>
          إضافة إعلان
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-900">{ads.length}</p>
          <p className="text-sm text-gray-500">إجمالي الإعلانات</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {ads.filter(a => a.isActive).length}
          </p>
          <p className="text-sm text-gray-500">نشط</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-600">
            {ads.reduce((sum, a) => sum + a.impressions, 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">المشاهدات</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-amber-600">
            {ads.reduce((sum, a) => sum + a.clicks, 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">النقرات</p>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={ads}
          loading={loading}
          emptyMessage="لا توجد إعلانات"
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
        title={editingAd ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}
        size="lg"
        footer={
          <>
            <button onClick={closeModal} className="btn btn-secondary">إلغاء</button>
            <button onClick={handleSubmit} className="btn btn-primary">
              {editingAd ? 'حفظ' : 'إضافة'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">اسم الإعلان *</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">نوع الإعلان</label>
              <select
                className="select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="banner">بانر</option>
                <option value="popup">منبثق</option>
                <option value="inline">داخل المحتوى</option>
                <option value="sidebar">جانبي</option>
                <option value="native">إعلان أصلي</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">موقع الإعلان</label>
            <input
              type="text"
              className="input"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="مثال: header, sidebar, after-content..."
            />
          </div>
          <div>
            <label className="label">كود الإعلان *</label>
            <textarea
              className="textarea font-mono text-sm"
              rows={8}
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="<script>...</script> أو HTML code"
              required
            />
          </div>
        </form>
      </Modal>

      {ToastComponent}
    </div>
  );
}
