'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  status: string;
  nicheId: number | null;
  categoryId: number | null;
  keywords: string[] | null;
  faqSchema: { question: string; answer: string }[] | null;
}

interface Category {
  id: number;
  name: string;
  nicheId: number | null;
}

interface Niche {
  id: number;
  name: string;
}

export default function ArticleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === 'new';
  
  const [article, setArticle] = useState<Partial<Article>>({
    title: '',
    content: '',
    excerpt: '',
    metaTitle: '',
    metaDescription: '',
    status: 'draft',
    keywords: [],
  });
  const [niches, setNiches] = useState<Niche[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    fetchNichesAndCategories();
    if (!isNew) {
      fetchArticle();
    }
  }, [id, isNew]);

  const fetchArticle = async () => {
    try {
      const res = await fetch(`/api/articles?id=${id}`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setArticle(data.data.find((a: Article) => a.id === parseInt(id)) || {});
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('فشل في تحميل المقال', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchNichesAndCategories = async () => {
    try {
      const [nichesRes, categoriesRes] = await Promise.all([
        fetch('/api/niches'),
        fetch('/api/categories'),
      ]);
      const nichesData = await nichesRes.json();
      const categoriesData = await categoriesRes.json();
      
      if (nichesData.success) setNiches(nichesData.data);
      if (categoriesData.success) setCategories(categoriesData.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await fetch('/api/articles', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isNew ? article : { ...article, id: parseInt(id) }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(isNew ? 'تم إنشاء المقال بنجاح' : 'تم حفظ التغييرات', 'success');
        if (isNew) {
          router.push(`/articles/${data.data.id}`);
        }
      } else {
        showToast(data.error || 'حدث خطأ', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isNew ? 'مقال جديد' : 'تعديل المقال'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isNew ? 'إنشاء مقال جديد' : article.title}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="btn btn-secondary"
          >
            رجوع
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-4">المحتوى</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="label">العنوان *</label>
                  <input
                    type="text"
                    className="input text-lg"
                    value={article.title || ''}
                    onChange={(e) => setArticle({ ...article, title: e.target.value })}
                    placeholder="عنوان المقال..."
                    required
                  />
                </div>

                <div>
                  <label className="label">المقتطف</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    value={article.excerpt || ''}
                    onChange={(e) => setArticle({ ...article, excerpt: e.target.value })}
                    placeholder="مقتطف مختصر للمقال..."
                  />
                </div>

                <div>
                  <label className="label">المحتوى</label>
                  <textarea
                    className="textarea"
                    rows={20}
                    value={article.content || ''}
                    onChange={(e) => setArticle({ ...article, content: e.target.value })}
                    placeholder="محتوى المقال بتنسيق HTML..."
                  />
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-4">الأسئلة الشائعة (FAQ)</h2>
              
              {article.faqSchema && article.faqSchema.length > 0 ? (
                <div className="space-y-4">
                  {article.faqSchema.map((faq, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="mb-2">
                        <label className="label">السؤال</label>
                        <input
                          type="text"
                          className="input"
                          value={faq.question}
                          onChange={(e) => {
                            const newFaq = [...(article.faqSchema || [])];
                            newFaq[index].question = e.target.value;
                            setArticle({ ...article, faqSchema: newFaq });
                          }}
                        />
                      </div>
                      <div>
                        <label className="label">الإجابة</label>
                        <textarea
                          className="textarea"
                          rows={2}
                          value={faq.answer}
                          onChange={(e) => {
                            const newFaq = [...(article.faqSchema || [])];
                            newFaq[index].answer = e.target.value;
                            setArticle({ ...article, faqSchema: newFaq });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">لا توجد أسئلة شائعة</p>
              )}
              
              <button
                type="button"
                onClick={() => {
                  setArticle({
                    ...article,
                    faqSchema: [...(article.faqSchema || []), { question: '', answer: '' }]
                  });
                }}
                className="btn btn-secondary mt-4"
              >
                + إضافة سؤال
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publishing */}
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-4">النشر</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="label">الحالة</label>
                  <select
                    className="select"
                    value={article.status || 'draft'}
                    onChange={(e) => setArticle({ ...article, status: e.target.value })}
                  >
                    <option value="draft">مسودة</option>
                    <option value="pending">في الانتظار</option>
                    <option value="published">منشور</option>
                    <option value="archived">مؤرشف</option>
                  </select>
                </div>

                <div>
                  <label className="label">النيش</label>
                  <select
                    className="select"
                    value={article.nicheId || ''}
                    onChange={(e) => setArticle({ ...article, nicheId: parseInt(e.target.value) || null })}
                  >
                    <option value="">-- اختر النيش --</option>
                    {niches.map((niche) => (
                      <option key={niche.id} value={niche.id}>{niche.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">التصنيف</label>
                  <select
                    className="select"
                    value={article.categoryId || ''}
                    onChange={(e) => setArticle({ ...article, categoryId: parseInt(e.target.value) || null })}
                  >
                    <option value="">-- اختر التصنيف --</option>
                    {categories
                      .filter(c => !article.nicheId || c.nicheId === article.nicheId)
                      .map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SEO */}
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-4">SEO</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="label">عنوان Meta</label>
                  <input
                    type="text"
                    className="input"
                    value={article.metaTitle || ''}
                    onChange={(e) => setArticle({ ...article, metaTitle: e.target.value })}
                    placeholder="عنوان الصفحة لمحركات البحث"
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {(article.metaTitle?.length || 0)}/60 حرف
                  </p>
                </div>

                <div>
                  <label className="label">وصف Meta</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    value={article.metaDescription || ''}
                    onChange={(e) => setArticle({ ...article, metaDescription: e.target.value })}
                    placeholder="وصف الصفحة لمحركات البحث"
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {(article.metaDescription?.length || 0)}/160 حرف
                  </p>
                </div>

                <div>
                  <label className="label">الكلمات المفتاحية</label>
                  <input
                    type="text"
                    className="input"
                    value={article.keywords?.join(', ') || ''}
                    onChange={(e) => setArticle({ 
                      ...article, 
                      keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                    })}
                    placeholder="كلمة1, كلمة2, كلمة3..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {ToastComponent}
    </div>
  );
}
