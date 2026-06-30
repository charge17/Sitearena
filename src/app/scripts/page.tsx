'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import DataTable from '@/components/DataTable';
import { useToast } from '@/components/Toast';

interface Script {
  id: number;
  name: string;
  code: string;
  position: string;
  isActive: boolean;
  loadAsync: boolean;
  loadDefer: boolean;
  targetPages: string[] | null;
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    position: 'head',
    loadAsync: false,
    loadDefer: false,
    targetPages: '',
  });
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      const res = await fetch('/api/scripts');
      const data = await res.json();
      if (data.success) setScripts(data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/scripts', {
        method: editingScript ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingScript?.id,
          name: formData.name,
          code: formData.code,
          position: formData.position,
          loadAsync: formData.loadAsync,
          loadDefer: formData.loadDefer,
          targetPages: formData.targetPages.split('\n').filter(Boolean),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(editingScript ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح', 'success');
        closeModal();
        fetchScripts();
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('حدث خطأ', 'error');
    }
  };

  const handleEdit = (script: Script) => {
    setEditingScript(script);
    setFormData({
      name: script.name,
      code: script.code,
      position: script.position,
      loadAsync: script.loadAsync,
      loadDefer: script.loadDefer,
      targetPages: script.targetPages?.join('\n') || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    
    try {
      const res = await fetch(`/api/scripts?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('تم الحذف بنجاح', 'success');
        fetchScripts();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleToggle = async (script: Script) => {
    try {
      const res = await fetch('/api/scripts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: script.id, isActive: !script.isActive }),
      });
      const data = await res.json();
      if (data.success) fetchScripts();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingScript(null);
    setFormData({
      name: '',
      code: '',
      position: 'head',
      loadAsync: false,
      loadDefer: false,
      targetPages: '',
    });
  };

  const columns = [
    { key: 'name', label: 'الاسم' },
    { 
      key: 'position', 
      label: 'الموقع',
      render: (item: Script) => {
        const positions: Record<string, string> = {
          head: 'Head',
          body_start: 'بداية Body',
          body_end: 'نهاية Body',
          after_content: 'بعد المحتوى',
        };
        return <span className="badge badge-info">{positions[item.position] || item.position}</span>;
      }
    },
    { 
      key: 'options', 
      label: 'الخيارات',
      render: (item: Script) => (
        <div className="flex gap-1">
          {item.loadAsync && <span className="badge badge-gray">Async</span>}
          {item.loadDefer && <span className="badge badge-gray">Defer</span>}
        </div>
      )
    },
    { 
      key: 'isActive', 
      label: 'الحالة',
      render: (item: Script) => (
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
          <h1 className="text-2xl font-bold text-gray-900">إدارة السكريبتات</h1>
          <p className="text-gray-500 mt-1">إدارة أكواد JavaScript و CSS</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <span>+</span>
          إضافة سكريبت
        </button>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={scripts}
          loading={loading}
          emptyMessage="لا توجد سكريبتات"
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
        title={editingScript ? 'تعديل السكريبت' : 'إضافة سكريبت جديد'}
        size="lg"
        footer={
          <>
            <button onClick={closeModal} className="btn btn-secondary">إلغاء</button>
            <button onClick={handleSubmit} className="btn btn-primary">
              {editingScript ? 'حفظ' : 'إضافة'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">اسم السكريبت *</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: Google Analytics"
                required
              />
            </div>
            <div>
              <label className="label">موقع التحميل</label>
              <select
                className="select"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              >
                <option value="head">Head</option>
                <option value="body_start">بداية Body</option>
                <option value="body_end">نهاية Body</option>
                <option value="after_content">بعد المحتوى</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.loadAsync}
                onChange={(e) => setFormData({ ...formData, loadAsync: e.target.checked })}
                className="w-4 h-4"
              />
              <span>Async</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.loadDefer}
                onChange={(e) => setFormData({ ...formData, loadDefer: e.target.checked })}
                className="w-4 h-4"
              />
              <span>Defer</span>
            </label>
          </div>

          <div>
            <label className="label">الكود *</label>
            <textarea
              className="textarea font-mono text-sm"
              rows={10}
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="<script>...</script>"
              required
            />
          </div>

          <div>
            <label className="label">الصفحات المستهدفة (سطر لكل صفحة، اتركه فارغاً لجميع الصفحات)</label>
            <textarea
              className="textarea"
              rows={3}
              value={formData.targetPages}
              onChange={(e) => setFormData({ ...formData, targetPages: e.target.value })}
              placeholder="/articles/*&#10;/pages/contact"
            />
          </div>
        </form>
      </Modal>

      {ToastComponent}
    </div>
  );
}
