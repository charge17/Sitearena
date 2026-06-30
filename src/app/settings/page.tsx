'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';

interface SettingsState {
  site_name: string;
  site_url: string;
  admin_email: string;
  articles_per_page: string;
  auto_publish: boolean;
  openrouter_api_key: string;
  default_language: string;
  timezone: string;
  date_format: string;
  enable_comments: boolean;
  enable_cache: boolean;
  cache_duration: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
    site_name: '',
    site_url: '',
    admin_email: '',
    articles_per_page: '10',
    auto_publish: false,
    openrouter_api_key: '',
    default_language: 'ar',
    timezone: 'Asia/Riyadh',
    date_format: 'Y-m-d',
    enable_comments: false,
    enable_cache: true,
    cache_duration: '3600',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.data) {
        setSettings(prev => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(data.data).map(([key, value]) => [
              key, 
              typeof value === 'object' ? JSON.stringify(value) : value
            ])
          ),
        }));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: typeof value === 'boolean' ? value : value,
        category: key.includes('api') ? 'api' : 
                  key.includes('cache') ? 'performance' : 'general',
      }));

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('تم حفظ الإعدادات بنجاح', 'success');
      } else {
        showToast('فشل في حفظ الإعدادات', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('حدث خطأ', 'error');
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
          <h1 className="text-2xl font-bold text-gray-900">الإعدادات العامة</h1>
          <p className="text-gray-500 mt-1">إعدادات النظام والتكوين</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">إعدادات الموقع</h2>
          
          <div className="space-y-4">
            <div>
              <label className="label">اسم الموقع</label>
              <input
                type="text"
                className="input"
                value={settings.site_name}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">رابط الموقع</label>
              <input
                type="url"
                className="input"
                value={settings.site_url}
                onChange={(e) => setSettings({ ...settings, site_url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="label">البريد الإلكتروني للمدير</label>
              <input
                type="email"
                className="input"
                value={settings.admin_email}
                onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">عدد المقالات في الصفحة</label>
              <input
                type="number"
                className="input"
                value={settings.articles_per_page}
                onChange={(e) => setSettings({ ...settings, articles_per_page: e.target.value })}
                min="1"
                max="100"
              />
            </div>
          </div>
        </div>

        {/* API Settings */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">إعدادات API</h2>
          
          <div className="space-y-4">
            <div>
              <label className="label">OpenRouter API Key</label>
              <input
                type="password"
                className="input font-mono"
                value={settings.openrouter_api_key}
                onChange={(e) => setSettings({ ...settings, openrouter_api_key: e.target.value })}
                placeholder="sk-..."
              />
              <p className="text-xs text-gray-500 mt-1">
                احصل على مفتاح API من <a href="https://openrouter.ai" target="_blank" className="text-blue-600">openrouter.ai</a>
              </p>
            </div>
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.auto_publish}
                  onChange={(e) => setSettings({ ...settings, auto_publish: e.target.checked })}
                  className="w-5 h-5"
                />
                <span>نشر المقالات تلقائياً بعد الإنشاء</span>
              </label>
            </div>
          </div>
        </div>

        {/* Localization */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">التوطين</h2>
          
          <div className="space-y-4">
            <div>
              <label className="label">اللغة الافتراضية</label>
              <select
                className="select"
                value={settings.default_language}
                onChange={(e) => setSettings({ ...settings, default_language: e.target.value })}
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="label">المنطقة الزمنية</label>
              <select
                className="select"
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              >
                <option value="Asia/Riyadh">الرياض (UTC+3)</option>
                <option value="Asia/Dubai">دبي (UTC+4)</option>
                <option value="Africa/Cairo">القاهرة (UTC+2)</option>
                <option value="Europe/London">لندن (UTC+0)</option>
                <option value="America/New_York">نيويورك (UTC-5)</option>
              </select>
            </div>
            <div>
              <label className="label">تنسيق التاريخ</label>
              <select
                className="select"
                value={settings.date_format}
                onChange={(e) => setSettings({ ...settings, date_format: e.target.value })}
              >
                <option value="Y-m-d">2024-01-15</option>
                <option value="d/m/Y">15/01/2024</option>
                <option value="d M Y">15 يناير 2024</option>
              </select>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">الأداء والتخزين المؤقت</h2>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enable_cache}
                  onChange={(e) => setSettings({ ...settings, enable_cache: e.target.checked })}
                  className="w-5 h-5"
                />
                <span>تفعيل التخزين المؤقت (Cache)</span>
              </label>
            </div>
            <div>
              <label className="label">مدة التخزين المؤقت (بالثواني)</label>
              <input
                type="number"
                className="input"
                value={settings.cache_duration}
                onChange={(e) => setSettings({ ...settings, cache_duration: e.target.value })}
                min="0"
              />
            </div>
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enable_comments}
                  onChange={(e) => setSettings({ ...settings, enable_comments: e.target.checked })}
                  className="w-5 h-5"
                />
                <span>تفعيل التعليقات</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card mt-6 border-red-200">
        <h2 className="text-lg font-bold text-red-600 mb-4">⚠️ منطقة الخطر</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <h3 className="font-medium text-red-900">مسح جميع البيانات</h3>
              <p className="text-sm text-red-600">هذا الإجراء لا يمكن التراجع عنه</p>
            </div>
            <button className="btn btn-danger" disabled>
              مسح البيانات
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <h3 className="font-medium text-red-900">إعادة تعيين الإعدادات</h3>
              <p className="text-sm text-red-600">استعادة الإعدادات الافتراضية</p>
            </div>
            <button className="btn btn-danger" disabled>
              إعادة تعيين
            </button>
          </div>
        </div>
      </div>

      {ToastComponent}
    </div>
  );
}
