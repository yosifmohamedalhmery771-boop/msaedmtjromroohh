import React from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout, setAccessToken } from './auth';
import { Settings } from './types';
import { DEFAULT_SETTINGS } from './presets';
import Header from './components/Header';
import ShareTab from './components/ShareTab';
import GalleryTab from './components/GalleryTab';
import SettingsTab from './components/SettingsTab';
import ImagePreviewModal from './components/ImagePreviewModal';
import PWAInstallModal from './components/PWAInstallModal';
import { DriveImage } from './googleDrive';
import { HelpCircle, AlertCircle, Info, Smartphone, ExternalLink } from 'lucide-react';

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
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setAccessTokenState(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Auth login failed:', err);
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
