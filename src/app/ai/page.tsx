'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import DataTable from '@/components/DataTable';
import { useToast } from '@/components/Toast';

interface AIModel {
  id: number;
  name: string;
  modelId: string;
  provider: string;
  isActive: boolean;
  isFree: boolean;
  priority: number;
  failureCount: number;
  currentFailures: number;
  totalRequests: number;
  successfulRequests: number;
  lastUsed: string | null;
  lastError: string | null;
}

interface Niche {
  id: number;
  name: string;
}

export default function AIPage() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    modelId: '',
    priority: 0,
  });
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [modelsRes, nichesRes] = await Promise.all([
        fetch('/api/ai/models'),
        fetch('/api/niches'),
      ]);
      
      const modelsData = await modelsRes.json();
      const nichesData = await nichesRes.json();
      
      if (modelsData.success) setModels(modelsData.data);
      if (nichesData.success) setNiches(nichesData.data);
    } catch (error) {
      console.error('Error:', error);
      showToast('فشل في تحميل البيانات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModel = async (model: AIModel) => {
    try {
      const res = await fetch('/api/ai/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: model.id, isActive: !model.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleResetModel = async (modelId: number) => {
    try {
      const res = await fetch('/api/ai/models', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: modelId, action: 'reset' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('تم إعادة تعيين النموذج', 'success');
        fetchData();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleGenerateHeadlines = async () => {
    if (!selectedNiche) {
      showToast('اختر نيش أولاً', 'error');
      return;
    }
    
    setGenerating(true);
    showToast('جاري توليد العناوين...', 'info');
    
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-headlines', nicheId: selectedNiche }),
      });
      
      const data = await res.json();
      if (data.success) {
        showToast('تم توليد العناوين بنجاح! تم إضافتها لقائمة الانتظار', 'success');
      } else {
        showToast(data.error || 'فشل في التوليد', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('حدث خطأ', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateFullArticle = async () => {
    if (!selectedNiche) {
      showToast('اختر نيش أولاً', 'error');
      return;
    }
    
    setGenerating(true);
    showToast('جاري توليد مقال كامل... قد يستغرق هذا بضع دقائق', 'info');
    
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-full', nicheId: selectedNiche }),
      });
      
      const data = await res.json();
      if (data.success) {
        showToast('تم توليد المقال بنجاح!', 'success');
      } else {
        showToast(data.error || 'فشل في التوليد', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('حدث خطأ', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          modelId: formData.modelId,
          priority: formData.priority,
          isActive: true,
          isFree: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('تم إضافة النموذج بنجاح', 'success');
        setIsModalOpen(false);
        setFormData({ name: '', modelId: '', priority: 0 });
        fetchData();
      } else {
        showToast(data.error || 'حدث خطأ', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('حدث خطأ', 'error');
    }
  };

  const columns = [
    { key: 'name', label: 'الاسم' },
    { 
      key: 'modelId', 
      label: 'Model ID',
      render: (item: AIModel) => (
        <code className="text-xs bg-gray-100 px-2 py-1 rounded">{item.modelId}</code>
      )
    },
    { 
      key: 'priority', 
      label: 'الأولوية',
      render: (item: AIModel) => <span className="font-bold">{item.priority}</span>
    },
    { 
      key: 'status', 
      label: 'الحالة',
      render: (item: AIModel) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleToggleModel(item)}
            className={`badge ${item.isActive ? 'badge-success' : 'badge-gray'}`}
          >
            {item.isActive ? 'نشط' : 'معطل'}
          </button>
          {item.currentFailures > 0 && (
            <span className="badge badge-danger">{item.currentFailures} فشل</span>
          )}
        </div>
      )
    },
    { 
      key: 'stats', 
      label: 'الإحصائيات',
      render: (item: AIModel) => (
        <div className="text-sm">
          <span className="text-gray-500">طلبات: </span>
          <span className="font-medium">{item.totalRequests || 0}</span>
          <span className="text-gray-400 mx-1">|</span>
          <span className="text-emerald-600">{item.successfulRequests || 0} ناجح</span>
        </div>
      )
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الذكاء الاصطناعي</h1>
          <p className="text-gray-500 mt-1">إدارة نماذج AI وتوليد المحتوى</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          <span>+</span>
          إضافة نموذج
        </button>
      </div>

      {/* Generation Section */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">توليد المحتوى</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">اختر النيش</label>
            <select
              className="select"
              value={selectedNiche || ''}
              onChange={(e) => setSelectedNiche(parseInt(e.target.value) || null)}
            >
              <option value="">-- اختر النيش --</option>
              {niches.map((niche) => (
                <option key={niche.id} value={niche.id}>{niche.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end gap-2">
            <button
              onClick={handleGenerateHeadlines}
              disabled={generating || !selectedNiche}
              className="btn btn-secondary flex-1"
            >
              {generating ? 'جاري التوليد...' : '📋 توليد عناوين'}
            </button>
          </div>
          
          <div className="flex items-end gap-2">
            <button
              onClick={handleGenerateFullArticle}
              disabled={generating || !selectedNiche}
              className="btn btn-primary flex-1"
            >
              {generating ? 'جاري التوليد...' : '📝 توليد مقال كامل'}
            </button>
          </div>
        </div>

        {generating && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
            <div className="loading-spinner"></div>
            <span className="text-blue-700">جاري التوليد... يرجى الانتظار</span>
          </div>
        )}
      </div>

      {/* AI Workflow */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">آلية عمل الذكاء الاصطناعي</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl text-center">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">1</div>
            <h3 className="font-bold text-blue-900">AI الأول</h3>
            <p className="text-sm text-blue-700 mt-1">عنوان SEO + 20 عنوان فرعي + FAQ</p>
          </div>
          
          <div className="p-4 bg-emerald-50 rounded-xl text-center">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">2</div>
            <h3 className="font-bold text-emerald-900">AI الثاني</h3>
            <p className="text-sm text-emerald-700 mt-1">المقدمة + 6 عناوين فرعية</p>
          </div>
          
          <div className="p-4 bg-amber-50 rounded-xl text-center">
            <div className="w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">3</div>
            <h3 className="font-bold text-amber-900">AI الثالث</h3>
            <p className="text-sm text-amber-700 mt-1">8 عناوين فرعية</p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-xl text-center">
            <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">4</div>
            <h3 className="font-bold text-purple-900">AI الرابع</h3>
            <p className="text-sm text-purple-700 mt-1">6 عناوين + FAQ + الخاتمة</p>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>ملاحظة:</strong> إذا فشل أحد النماذج، يتم استبداله تلقائياً بنموذج آخر. 
            أسئلة FAQ تُضاف لقائمة الانتظار لإنشاء مقالات منفصلة لها.
          </p>
        </div>
      </div>

      {/* Models Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-bold text-gray-900">نماذج الذكاء الاصطناعي (OpenRouter Free)</h2>
        </div>
        
        <DataTable
          columns={columns}
          data={models}
          loading={loading}
          emptyMessage="لا توجد نماذج"
          actions={(item) => (
            <div className="flex gap-2">
              {item.currentFailures > 0 && (
                <button
                  onClick={() => handleResetModel(item.id)}
                  className="btn btn-warning text-xs py-1 px-2"
                  title="إعادة تعيين"
                >
                  🔄
                </button>
              )}
              <button
                onClick={() => handleToggleModel(item)}
                className={`btn text-xs py-1 px-2 ${item.isActive ? 'btn-secondary' : 'btn-success'}`}
              >
                {item.isActive ? 'تعطيل' : 'تفعيل'}
              </button>
            </div>
          )}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="إضافة نموذج AI جديد"
        footer={
          <>
            <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              إلغاء
            </button>
            <button onClick={handleAddModel} className="btn btn-primary">
              إضافة
            </button>
          </>
        }
      >
        <form onSubmit={handleAddModel} className="space-y-4">
          <div>
            <label className="label">اسم النموذج *</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: Llama 3.2"
              required
            />
          </div>
          <div>
            <label className="label">Model ID *</label>
            <input
              type="text"
              className="input"
              value={formData.modelId}
              onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
              placeholder="مثال: meta-llama/llama-3.2-3b-instruct:free"
              required
            />
          </div>
          <div>
            <label className="label">الأولوية</label>
            <input
              type="number"
              className="input"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">كلما كان الرقم أقل، كانت الأولوية أعلى</p>
          </div>
        </form>
      </Modal>

      {ToastComponent}
    </div>
  );
}
