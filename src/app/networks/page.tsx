'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import DataTable from '@/components/DataTable';
import { useToast } from '@/components/Toast';

interface Network {
  id: number;
  name: string;
  description: string | null;
  nicheId: number | null;
  pillarArticleId: number | null;
  clusterArticles: number[];
  linkingStrategy: string;
  isActive: boolean;
  createdAt: string;
}

interface Niche {
  id: number;
  name: string;
}

interface Article {
  id: number;
  title: string;
}

export default function NetworksPage() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<Network | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    nicheId: '',
    pillarArticleId: '',
    linkingStrategy: 'hub-spoke',
  });
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [networksRes, nichesRes, articlesRes] = await Promise.all([
        fetch('/api/networks'),
        fetch('/api/niches'),
        fetch('/api/articles?status=published'),
      ]);
      
      const networksData = await networksRes.json();
      const nichesData = await nichesRes.json();
      const articlesData = await articlesRes.json();
      
      if (networksData.success) setNetworks(networksData.data);
      if (nichesData.success) setNiches(nichesData.data);
      if (articlesData.success) setArticles(articlesData.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/networks', {
        method: editingNetwork ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingNetwork?.id,
          name: formData.name,
          description: formData.description,
          nicheId: formData.nicheId ? parseInt(formData.nicheId) : null,
          pillarArticleId: formData.pillarArticleId ? parseInt(formData.pillarArticleId) : null,
          linkingStrategy: formData.linkingStrategy,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(editingNetwork ? 'تم التحديث بنجاح' : 'تم الإضافة بنجاح', 'success');
        closeModal();
        fetchData();
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('حدث خطأ', 'error');
    }
  };

  const handleEdit = (network: Network) => {
    setEditingNetwork(network);
    setFormData({
      name: network.name,
      description: network.description || '',
      nicheId: network.nicheId?.toString() || '',
      pillarArticleId: network.pillarArticleId?.toString() || '',
      linkingStrategy: network.linkingStrategy,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    
    try {
      const res = await fetch(`/api/networks?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('تم الحذف بنجاح', 'success');
        fetchData();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleToggle = async (network: Network) => {
    try {
      const res = await fetch('/api/networks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: network.id, isActive: !network.isActive }),
      });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNetwork(null);
    setFormData({
      name: '',
      description: '',
      nicheId: '',
      pillarArticleId: '',
      linkingStrategy: 'hub-spoke',
    });
  };

  const getNicheName = (nicheId: number | null) => {
    if (!nicheId) return '-';
    return niches.find(n => n.id === nicheId)?.name || '-';
  };

  const getArticleTitle = (articleId: number | null) => {
    if (!articleId) return '-';
    return articles.find(a => a.id === articleId)?.title || '-';
  };

  const strategies: Record<string, string> = {
    'hub-spoke': 'Hub & Spoke',
    'silo': 'Silo',
    'cluster': 'Topic Cluster',
    'mesh': 'Mesh Network',
  };

  const columns = [
    { key: 'name', label: 'الاسم' },
    { 
      key: 'nicheId', 
      label: 'النيش',
      render: (item: Network) => getNicheName(item.nicheId)
    },
    { 
      key: 'pillarArticleId', 
      label: 'المقال الأساسي',
      render: (item: Network) => (
        <span className="truncate max-w-xs block">{getArticleTitle(item.pillarArticleId)}</span>
      )
    },
    { 
      key: 'linkingStrategy', 
      label: 'الاستراتيجية',
      render: (item: Network) => (
        <span className="badge badge-info">{strategies[item.linkingStrategy] || item.linkingStrategy}</span>
      )
    },
    { 
      key: 'clusterArticles', 
      label: 'المقالات',
      render: (item: Network) => (
        <span className="font-bold">{item.clusterArticles?.length || 0}</span>
      )
    },
    { 
      key: 'isActive', 
      label: 'الحالة',
      render: (item: Network) => (
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
          <h1 className="text-2xl font-bold text-gray-900">شبكة المقالات</h1>
          <p className="text-gray-500 mt-1">بناء وإدارة شبكات الربط الداخلي</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <span>+</span>
          إضافة شبكة
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <span className="text-3xl mb-2 block">🎯</span>
          <h3 className="font-bold">Hub & Spoke</h3>
          <p className="text-xs text-gray-500 mt-1">مقال رئيسي مع مقالات فرعية مرتبطة</p>
        </div>
        <div className="card text-center">
          <span className="text-3xl mb-2 block">📊</span>
          <h3 className="font-bold">Silo</h3>
          <p className="text-xs text-gray-500 mt-1">تنظيم هرمي للمحتوى</p>
        </div>
        <div className="card text-center">
          <span className="text-3xl mb-2 block">🔗</span>
          <h3 className="font-bold">Topic Cluster</h3>
          <p className="text-xs text-gray-500 mt-1">مجموعة مواضيع مترابطة</p>
        </div>
        <div className="card text-center">
          <span className="text-3xl mb-2 block">🕸️</span>
          <h3 className="font-bold">Mesh Network</h3>
          <p className="text-xs text-gray-500 mt-1">ربط متشابك بين المقالات</p>
        </div>
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={networks}
          loading={loading}
          emptyMessage="لا توجد شبكات"
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
        title={editingNetwork ? 'تعديل الشبكة' : 'إضافة شبكة جديدة'}
        footer={
          <>
            <button onClick={closeModal} className="btn btn-secondary">إلغاء</button>
            <button onClick={handleSubmit} className="btn btn-primary">
              {editingNetwork ? 'حفظ' : 'إضافة'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">اسم الشبكة *</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
              <label className="label">استراتيجية الربط</label>
              <select
                className="select"
                value={formData.linkingStrategy}
                onChange={(e) => setFormData({ ...formData, linkingStrategy: e.target.value })}
              >
                {Object.entries(strategies).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">المقال الأساسي (Pillar)</label>
            <select
              className="select"
              value={formData.pillarArticleId}
              onChange={(e) => setFormData({ ...formData, pillarArticleId: e.target.value })}
            >
              <option value="">-- اختر المقال --</option>
              {articles.map((article) => (
                <option key={article.id} value={article.id}>{article.title}</option>
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
        </form>
      </Modal>

      {ToastComponent}
    </div>
  );
}
