import React from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, googleSignInRedirect, logout, setAccessToken } from './auth';
import { Settings } from './types';
import { DEFAULT_SETTINGS } from './presets';
import Header from './components/Header';
import ShareTab from './components/ShareTab';
import GalleryTab from './components/GalleryTab';
import SettingsTab from './components/SettingsTab';
import ImagePreviewModal from './components/ImagePreviewModal';
import PWAInstallModal from './components/PWAInstallModal';
import { DriveImage } from './googleDrive';
import { HelpCircle, AlertCircle, Info, Smartphone, ExternalLink, X } from 'lucide-react';

export default function App() {
  // Global App States
  const [activeTab, setActiveTab] = React.useState<'share' | 'gallery' | 'settings'>('share');
  const [settings, setSettings] = React.useState<Settings>(() => {
    const saved = localStorage.getItem('um_ruha_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [user, setUser] = React.useState<User | null>(null);
  const [accessToken, setAccessTokenState] = React.useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = React.useState(true);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  // Sharing original description text
  const [sharedText, setSharedText] = React.useState('');

  // Image zoom/preview modal
  const [previewImage, setPreviewImage] = React.useState<DriveImage | null>(null);

  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [isPWAInstallOpen, setIsPWAInstallOpen] = React.useState(false);
  const [isAlreadyInstalled, setIsAlreadyInstalled] = React.useState(false);

  // Listen to PWA installation events
  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if running in standalone display mode
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
      setIsAlreadyInstalled(standalone);
    };
    checkStandalone();

    const handleAppInstalled = () => {
      setIsAlreadyInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  // Handle incoming shared target items from PWA Share Target API
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const textParam = urlParams.get('text');
    const urlParam = urlParams.get('url');
    const titleParam = urlParams.get('title');

    if (textParam || urlParam || titleParam) {
      let combined = '';
      if (titleParam) combined += `${titleParam}\n`;
      if (textParam) combined += `${textParam}\n`;
      if (urlParam) combined += `${urlParam}`;

      setSharedText(combined.trim());
      setActiveTab('share');

      // Clear the query parameters from URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Initialize Firebase Auth & cached OAuth tokens
  React.useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessTokenState(token);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setAccessTokenState(null);
        setNeedsAuth(true);
      }
    );

    return () => unsubscribe();
  }, []);

  // Login handler
  const handleLogin = async (useRedirect = false) => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      if (useRedirect) {
        await googleSignInRedirect();
        return;
      }
      const result = await googleSignIn();
      if (result) {
        setAccessTokenState(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
        setAuthError(null);
      }
    } catch (err: any) {
      console.error('Auth login failed:', err);
      const errMsg = err.toString() || '';
      if (errMsg.includes('popup-closed-by-user') || errMsg.includes('popup_closed_by_user') || errMsg.includes('closed-by-user')) {
        setAuthError('popup_closed');
      } else if (errMsg.includes('popup-blocked') || errMsg.includes('popup_blocked')) {
        setAuthError('popup_blocked');
      } else {
        setAuthError(errMsg || 'فشل تسجيل الدخول. يرجى التحقق من اتصالك بالإنترنت وصلاحية الإعدادات.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    const confirmed = window.confirm('هل أنت متأكد من إلغاء ربط حساب جوجل درايف وتسجيل الخروج؟');
    if (confirmed) {
      await logout();
      setUser(null);
      setAccessTokenState(null);
      setNeedsAuth(true);
    }
  };

  // Save Settings handler
  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem('um_ruha_settings', JSON.stringify(newSettings));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-teal-500/10 selection:text-teal-900" id="app-root-container">
      {/* Header */}
      <Header
        user={user}
        needsAuth={needsAuth}
        isLoggingIn={isLoggingIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        deferredPrompt={deferredPrompt}
        onInstall={() => setIsPWAInstallOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" id="app-main-content">
        
        {/* Helper Alert for Shared Target Target explanation */}
        <div className="mb-6 p-4 bg-teal-50/70 border border-teal-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3 text-teal-950 text-xs sm:text-sm font-semibold" id="top-info-banner">
          <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1" id="banner-description">
            <span className="text-teal-900">ميزة المشاركة السريعة مفعلة! </span> 
            عند تصفحك لمتجرك ومشاركة أي منتج عبر متصفحك أو هاتفك، يمكنك اختيار <strong className="text-teal-800">"مساعد النشر"</strong> من قائمة التطبيقات لتفتح الأداة تلقائياً مع ملء الوصف والرابط فوراً!
          </div>
          <button
            onClick={() => setIsPWAInstallOpen(true)}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition-all whitespace-nowrap active:scale-95 shrink-0"
            id="btn-banner-install"
          >
            تثبيت التطبيق على جهازك 📱
          </button>
        </div>

        {/* Auth Error & Actionable Advice Panel */}
        {authError && (
          <div className="mb-6 p-5 bg-red-50 border border-red-200 rounded-3xl space-y-4 shadow-xs animate-fade-in" id="auth-error-alert" dir="rtl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-5.5 h-5.5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-red-950">فشل ربط حساب جوجل درايف</h4>
                  <p className="text-xs text-red-800 leading-relaxed font-semibold">
                    {authError === 'popup_closed' || authError === 'popup_blocked' ? (
                      <span>تم إغلاق نافذة الاتصال المنبثقة أو حظرها من قبل المتصفح.</span>
                    ) : (
                      <span>حدث خطأ أثناء الاتصال: {authError}</span>
                    )}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setAuthError(null)}
                className="p-1.5 hover:bg-red-100 rounded-xl text-red-400 hover:text-red-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-white/70 rounded-2xl p-4 border border-red-100/60 space-y-3" id="auth-error-solutions">
              <span className="font-bold text-slate-700 block">💡 الحلول السريعة والفعالة لحل هذه المشكلة فوراً:</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="solutions-grid">
                {/* Solution 1: Direct Redirect Login */}
                <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-teal-800 text-[11px] block">الخيار الأول: الربط عبر إعادة التوجيه (موصى به ومضمون 100%)</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                      يقوم بتحويل الصفحة بالكامل لتسجيل الدخول ثم العودة بأمان، مما يتفادى حظر النوافذ المنبثقة تماماً على الهواتف والآيفون.
                    </p>
                  </div>
                  <button
                    onClick={() => handleLogin(true)}
                    disabled={isLoggingIn}
                    className="w-full mt-2 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-[11px] rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isLoggingIn ? 'جاري الاتصال...' : 'تسجيل دخول آمن بالتحويل المباشر 🔗'}
                  </button>
                </div>

                {/* Solution 2: API Key Bypass */}
                <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-amber-800 text-[11px] block">الخيار الثاني: استخدام مفتاح API (تصفح فوري دون تسجيل دخول)</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                      يمكنك إدخال مفتاح API عام في الإعدادات لتصفح وعرض جميع صور المجلدات فوراً دون الحاجة لتسجيل دخولك بجوجل في كل مرة.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setAuthError(null);
                      setActiveTab('settings');
                      setTimeout(() => {
                        const inputEl = document.getElementById('input-gdrive-api-key');
                        if (inputEl) inputEl.focus();
                        const configEl = document.getElementById('api-key-config');
                        if (configEl) configEl.scrollIntoView({ behavior: 'smooth' });
                      }, 200);
                    }}
                    className="w-full mt-2 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                  >
                    الانتقال لضبط مفتاح API في الإعدادات ⚙️
                  </button>
                </div>
              </div>

              {/* Hint about Authorized Redirect Domains */}
              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1" id="authorized-domains-info">
                <span className="font-bold text-amber-950 text-[10px] block">⚠️ لمطوري ومسؤولي متجر أم روح:</span>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  إذا كنت مالك مشروع الفايربيس، تأكد من إضافة نطاق هذا الموقع الحالي (<code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-600">{window.location.hostname}</code>) إلى <strong className="text-amber-800">"نطاقات إعادة التوجيه المعتمدة" (Authorized Domains)</strong> في إعدادات Firebase Auth وفي Google Cloud Console للسماح بالربط السلس.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content Tabs */}
        {activeTab === 'share' ? (
          <ShareTab
            settings={settings}
            accessToken={accessToken}
            needsAuth={needsAuth}
            onLogin={handleLogin}
            sharedText={sharedText}
            onSharedTextChange={setSharedText}
            onPreviewImage={setPreviewImage}
          />
        ) : activeTab === 'gallery' ? (
          <GalleryTab
            settings={settings}
            accessToken={accessToken}
            needsAuth={needsAuth}
            onLogin={handleLogin}
            onPreviewImage={setPreviewImage}
          />
        ) : (
          <SettingsTab
            settings={settings}
            onSaveSettings={handleSaveSettings}
          />
        )}
      </main>

      {/* PWA Manual & Native Install Modal */}
      <PWAInstallModal
        isOpen={isPWAInstallOpen}
        onClose={() => setIsPWAInstallOpen(false)}
        onInstallNatively={handleInstallApp}
        hasNativePrompt={!!deferredPrompt}
        isAlreadyInstalled={isAlreadyInstalled}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      {/* Simple elegant footer */}
      <footer className="py-6 border-t border-slate-100 bg-white text-center text-xs text-slate-400 font-medium" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1">
          <p>© 2026 متجر أم روح. جميع الحقوق محفوظة.</p>
          <p className="text-[10px] text-slate-300">تم التطوير لتسهيل العمليات التسويقية ومشاركة المحتوى بكفاءة عالية.</p>
        </div>
      </footer>
    </div>
  );
}
