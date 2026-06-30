'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';

interface SEOSetting {
  id: number;
  key: string;
  value: string | null;
  description: string | null;
}

interface SitemapConfig {
  id: number;
  entityType: string;
  changeFreq: string;
  priority: string;
  isIncluded: boolean;
}

export default function SEOPage() {
  const [settings, setSettings] = useState<SEOSetting[]>([]);
  const [sitemapConfig, setSitemapConfig] = useState<SitemapConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [robotsTxt, setRobotsTxt] = useState('');
  const { showToast, ToastComponent } = useToast();

  // Default SEO settings
  const defaultSettings = [
    { key: 'site_title', label: 'عنوان الموقع', value: '' },
    { key: 'site_description', label: 'وصف الموقع', value: '' },
    { key: 'site_keywords', label: 'الكلمات المفتاحية', value: '' },
    { key: 'google_analytics', label: 'Google Analytics ID', value: '' },
    { key: 'google_search_console', label: 'Google Search Console', value: '' },
    { key: 'bing_webmaster', label: 'Bing Webmaster', value: '' },
    { key: 'og_image', label: 'صورة Open Graph الافتراضية', value: '' },
    { key: 'twitter_handle', label: 'Twitter Handle', value: '' },
    { key: 'canonical_url', label: 'الرابط الأساسي', value: '' },
    { key: 'schema_org_type', label: 'نوع Schema.org', value: 'Organization' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/seo');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data.settings);
        setSitemapConfig(data.data.sitemapConfig);
        
        // Get robots.txt value
        const robotsSetting = data.data.settings.find((s: SEOSetting) => s.key === 'robots_txt');
        if (robotsSetting) {
          setRobotsTxt(robotsSetting.value || '');
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSettingValue = (key: string): string => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || '';
  };

  const handleSaveSetting = async (key: string, value: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'setting', key, value }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('تم الحفظ بنجاح', 'success');
        fetchData();
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('فشل في الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSitemap = async (entityType: string, field: string, value: string | boolean) => {
    try {
      const existing = sitemapConfig.find(s => s.entityType === entityType);
      const res = await fetch('/api/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sitemap',
          entityType,
          changeFreq: field === 'changeFreq' ? value : existing?.changeFreq || 'weekly',
          priority: field === 'priority' ? value : existing?.priority || '0.5',
          isIncluded: field === 'isIncluded' ? value : existing?.isIncluded ?? true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('تم الحفظ', 'success');
        fetchData();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSaveRobots = async () => {
    await handleSaveSetting('robots_txt', robotsTxt);
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">إعدادات SEO</h1>
        <p className="text-gray-500 mt-1">تحسين محركات البحث وإعدادات Sitemap</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General SEO Settings */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">الإعدادات العامة</h2>
          
          <div className="space-y-4">
            {defaultSettings.slice(0, 5).map((setting) => (
              <div key={setting.key}>
                <label className="label">{setting.label}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input flex-1"
                    defaultValue={getSettingValue(setting.key)}
                    onBlur={(e) => handleSaveSetting(setting.key, e.target.value)}
                    placeholder={setting.label}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social & Analytics */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">التحليلات والتواصل الاجتماعي</h2>
          
          <div className="space-y-4">
            {defaultSettings.slice(5).map((setting) => (
              <div key={setting.key}>
                <label className="label">{setting.label}</label>
                <input
                  type="text"
                  className="input"
                  defaultValue={getSettingValue(setting.key)}
                  onBlur={(e) => handleSaveSetting(setting.key, e.target.value)}
                  placeholder={setting.label}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sitemap Configuration */}
      <div className="card mt-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">إعدادات Sitemap</h2>
        
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>النوع</th>
                <th>التكرار</th>
                <th>الأولوية</th>
                <th>مضمن</th>
              </tr>
            </thead>
            <tbody>
              {['articles', 'categories', 'pages'].map((entityType) => {
                const config = sitemapConfig.find(s => s.entityType === entityType) || {
                  entityType,
                  changeFreq: 'weekly',
                  priority: '0.5',
                  isIncluded: true,
                };
                
                return (
                  <tr key={entityType}>
                    <td className="font-medium">
                      {entityType === 'articles' ? 'المقالات' : 
                       entityType === 'categories' ? 'التصنيفات' : 'الصفحات'}
                    </td>
                    <td>
                      <select
                        className="select text-sm"
                        value={config.changeFreq}
                        onChange={(e) => handleSaveSitemap(entityType, 'changeFreq', e.target.value)}
                      >
                        <option value="always">دائماً</option>
                        <option value="hourly">كل ساعة</option>
                        <option value="daily">يومياً</option>
                        <option value="weekly">أسبوعياً</option>
                        <option value="monthly">شهرياً</option>
                        <option value="yearly">سنوياً</option>
                        <option value="never">أبداً</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="select text-sm"
                        value={config.priority}
                        onChange={(e) => handleSaveSitemap(entityType, 'priority', e.target.value)}
                      >
                        <option value="1.0">1.0</option>
                        <option value="0.9">0.9</option>
                        <option value="0.8">0.8</option>
                        <option value="0.7">0.7</option>
                        <option value="0.6">0.6</option>
                        <option value="0.5">0.5</option>
                        <option value="0.4">0.4</option>
                        <option value="0.3">0.3</option>
                        <option value="0.2">0.2</option>
                        <option value="0.1">0.1</option>
                      </select>
                    </td>
                    <td>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.isIncluded}
                          onChange={(e) => handleSaveSitemap(entityType, 'isIncluded', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">مضمن</span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Robots.txt */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Robots.txt</h2>
          <button
            onClick={handleSaveRobots}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
        
        <textarea
          className="textarea font-mono text-sm"
          rows={10}
          value={robotsTxt}
          onChange={(e) => setRobotsTxt(e.target.value)}
          placeholder={`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://yoursite.com/sitemap.xml`}
        />
      </div>

      {ToastComponent}
    </div>
  );
}
