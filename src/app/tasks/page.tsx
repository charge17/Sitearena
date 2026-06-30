'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import DataTable from '@/components/DataTable';
import { useToast } from '@/components/Toast';

interface Task {
  id: number;
  name: string;
  description: string | null;
  taskType: string;
  cronExpression: string;
  isActive: boolean;
  lastRun: string | null;
  nextRun: string | null;
  status: string;
  runCount: number;
  failureCount: number;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    taskType: 'generate-articles',
    cronExpression: '0 */6 * * *',
  });
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/scheduled-tasks');
      const data = await res.json();
      if (data.success) setTasks(data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/scheduled-tasks', {
        method: editingTask ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTask?.id,
          ...formData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(editingTask ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح', 'success');
        closeModal();
        fetchTasks();
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('حدث خطأ', 'error');
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description || '',
      taskType: task.taskType,
      cronExpression: task.cronExpression,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    
    try {
      const res = await fetch(`/api/scheduled-tasks?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('تم الحذف بنجاح', 'success');
        fetchTasks();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleToggle = async (task: Task) => {
    try {
      const res = await fetch('/api/scheduled-tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, isActive: !task.isActive }),
      });
      const data = await res.json();
      if (data.success) fetchTasks();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleRun = async (taskId: number) => {
    showToast('جاري تنفيذ المهمة...', 'info');
    try {
      const res = await fetch('/api/scheduled-tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, action: 'run' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('تم تنفيذ المهمة بنجاح', 'success');
        fetchTasks();
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('فشل في تنفيذ المهمة', 'error');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setFormData({
      name: '',
      description: '',
      taskType: 'generate-articles',
      cronExpression: '0 */6 * * *',
    });
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('ar-SA');
  };

  const taskTypes: Record<string, string> = {
    'generate-articles': 'توليد مقالات',
    'generate-headlines': 'توليد عناوين',
    'publish-articles': 'نشر المقالات',
    'update-sitemap': 'تحديث Sitemap',
    'cleanup': 'تنظيف',
    'backup': 'نسخ احتياطي',
  };

  const columns = [
    { key: 'name', label: 'الاسم' },
    { 
      key: 'taskType', 
      label: 'النوع',
      render: (item: Task) => (
        <span className="badge badge-info">{taskTypes[item.taskType] || item.taskType}</span>
      )
    },
    { 
      key: 'cronExpression', 
      label: 'الجدولة',
      render: (item: Task) => (
        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{item.cronExpression}</code>
      )
    },
    { 
      key: 'lastRun', 
      label: 'آخر تنفيذ',
      render: (item: Task) => <span className="text-sm text-gray-500">{formatDate(item.lastRun)}</span>
    },
    { 
      key: 'stats', 
      label: 'الإحصائيات',
      render: (item: Task) => (
        <div className="text-sm">
          <span className="text-emerald-600">{item.runCount} نجاح</span>
          <span className="mx-2">•</span>
          <span className="text-red-600">{item.failureCount} فشل</span>
        </div>
      )
    },
    { 
      key: 'isActive', 
      label: 'الحالة',
      render: (item: Task) => (
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
          <h1 className="text-2xl font-bold text-gray-900">المهام المجدولة</h1>
          <p className="text-gray-500 mt-1">إدارة المهام التلقائية (Cron Jobs)</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <span>+</span>
          إضافة مهمة
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
          <p className="text-sm text-gray-500">إجمالي المهام</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {tasks.filter(t => t.isActive).length}
          </p>
          <p className="text-sm text-gray-500">نشط</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-600">
            {tasks.reduce((sum, t) => sum + t.runCount, 0)}
          </p>
          <p className="text-sm text-gray-500">التنفيذات</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-600">
            {tasks.reduce((sum, t) => sum + t.failureCount, 0)}
          </p>
          <p className="text-sm text-gray-500">الفشل</p>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={tasks}
          loading={loading}
          emptyMessage="لا توجد مهام مجدولة"
          actions={(item) => (
            <div className="flex gap-2">
              <button
                onClick={() => handleRun(item.id)}
                className="btn btn-success text-xs py-1 px-2"
              >
                تنفيذ
              </button>
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
        title={editingTask ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}
        footer={
          <>
            <button onClick={closeModal} className="btn btn-secondary">إلغاء</button>
            <button onClick={handleSubmit} className="btn btn-primary">
              {editingTask ? 'حفظ' : 'إضافة'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">اسم المهمة *</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">نوع المهمة</label>
            <select
              className="select"
              value={formData.taskType}
              onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
            >
              {Object.entries(taskTypes).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">تعبير Cron *</label>
            <input
              type="text"
              className="input font-mono"
              value={formData.cronExpression}
              onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
              placeholder="0 */6 * * *"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              دقيقة ساعة يوم شهر يوم_الأسبوع (مثال: 0 */6 * * * = كل 6 ساعات)
            </p>
          </div>
          <div>
            <label className="label">الوصف</label>
            <textarea
              className="textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {ToastComponent}
    </div>
  );
}
