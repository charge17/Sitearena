'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import DataTable from '@/components/DataTable';
import { useToast } from '@/components/Toast';

interface Plugin {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  version: string;
  isActive: boolean;
  config: Record<string, unknown> | null;
  hooks: string[] | null;
  createdAt: string;
}

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlugin, setEditingPlugin] = useState<Plugin | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '1.0.0',
    hooks: '',
  });
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    try {
      const res = await fetch('/api/plugins');
      const data = await res.json();
      if (data.success) setPlugins(data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/plugins', {
        method: editingPlugin ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPlugin?.id,
          name: formData.name,
          description: formData.description,
          version: formData.version,
          hooks: formData.hooks.split('\n').filter(Boolean),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(editingPlugin ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح', 'success');
        closeModal();
        fetchPlugins();
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('حدث خطأ', 'error');
    }
  };

  const handleEdit = (plugin: Plugin) => {
    setEditingPlugin(plugin);
    setFormData({
      name: plugin.name,
      description: plugin.description || '',
      version: plugin.version,
      hooks: plugin.hooks?.join('\n') || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    
    try {
      const res = await fetch(`/api/plugins?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('تم الحذف بنجاح', 'success');
        fetchPlugins();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleToggle = async (plugin: Plugin) => {
    try {
      const res = await fetch('/api/plugins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plugin.id, isActive: !plugin.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(plugin.isActive ? 'تم تعطيل الإضافة' : 'تم تفعيل الإضافة', 'success');
        fetchPlugins();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlugin(null);
    setFormData({
      name: '',
      description: '',
      version: '1.0.0',
      hooks: '',
    });
  };

  const columns = [
    { 
      key: 'name', 
      label: 'الاسم',
      render: (item: Plugin) => (
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-xs text-gray-500">{item.slug}</p>
        </div>
      )
    },
    { 
      key: 'version', 
      label: 'الإصدار',
      render: (item: Plugin) => <span className="badge badge-gray">v{item.version}</span>
    },
    { 
      key: 'hooks', 
      label: 'الخطافات',
      render: (item: Plugin) => (
        <div className="flex flex-wrap gap-1">
          {item.hooks?.slice(0, 2).map((hook, i) => (
            <span key={i} className="badge badge-info text-xs">{hook}</span>
          ))}
          {(item.hooks?.length || 0) > 2 && (
            <span className="badge badge-gray text-xs">+{(item.hooks?.length || 0) - 2}</span>
          )}
        </div>
      )
    },
    { 
      key: 'isActive', 
      label: 'الحالة',
      render: (item: Plugin) => (
        <button
          onClick={() => handleToggle(item)}
          className={`badge ${item.isActive ? 'badge-success' : 'badge-gray'}`}
        >
          {item.isActive ? 'مفعل' : 'معطل'}
        </button>
      )
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الإضافات</h1>
          <p className="text-gray-500 mt-1">تثبيت وإدارة الإضافات</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <span>+</span>
          إضافة Plugin
        </button>
      </div>

      {/* Available Hooks */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">الخطافات المتاحة (Hooks)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { hook: 'before_article_save', label: 'قبل حفظ المقال' },
            { hook: 'after_article_save', label: 'بعد حفظ المقال' },
            { hook: 'before_publish', label: 'قبل النشر' },
            { hook: 'after_publish', label: 'بعد النشر' },
            { hook: 'on_ai_generate', label: 'عند توليد AI' },
            { hook: 'on_seo_update', label: 'عند تحديث SEO' },
            { hook: 'on_sitemap_generate', label: 'عند إنشاء Sitemap' },
            { hook: 'on_page_render', label: 'عند عرض الصفحة' },
          ].map((item) => (
            <div key={item.hook} className="p-3 bg-gray-50 rounded-lg">
              <code className="text-xs text-blue-600">{item.hook}</code>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={plugins}
          loading={loading}
          emptyMessage="لا توجد إضافات"
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
        title={editingPlugin ? 'تعديل الإضافة' : 'إضافة Plugin جديد'}
        footer={
          <>
            <button onClick={closeModal} className="btn btn-secondary">إلغاء</button>
            <button onClick={handleSubmit} className="btn btn-primary">
              {editingPlugin ? 'حفظ' : 'إضافة'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">اسم الإضافة *</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">الإصدار</label>
              <input
                type="text"
                className="input"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">الوصف</label>
            <textarea
              className="textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div>
            <label className="label">الخطافات (سطر لكل hook)</label>
            <textarea
              className="textarea font-mono text-sm"
              rows={4}
              value={formData.hooks}
              onChange={(e) => setFormData({ ...formData, hooks: e.target.value })}
              placeholder="before_article_save&#10;after_publish&#10;on_seo_update"
            />
          </div>
        </form>
      </Modal>

      {ToastComponent}
    </div>
  );
}
