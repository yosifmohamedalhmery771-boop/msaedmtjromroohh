import React from 'react';
import { Download, LogOut, User as UserIcon, Settings as SettingsIcon } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
  needsAuth: boolean;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  deferredPrompt: any;
  onInstall: () => void;
  activeTab: 'share' | 'gallery' | 'settings';
  setActiveTab: (tab: 'share' | 'gallery' | 'settings') => void;
}

export default function Header({
  user,
  needsAuth,
  isLoggingIn,
  onLogin,
  onLogout,
  deferredPrompt,
  onInstall,
  activeTab,
  setActiveTab
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20" id="header-content-wrapper">
          {/* Logo & Title */}
          <div className="flex items-center gap-3" id="header-logo-section">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shadow-xs">
              <img 
                src="/icon.png" 
                alt="متجر أم روح" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg"
                onError={(e) => {
                  // Fallback if image not ready
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-teal-950 tracking-tight" id="header-app-title">
                مساعد النشر لمتجر أم روح
              </h1>
              <p className="text-xs text-slate-500 font-medium hidden sm:block" id="header-app-subtitle">
                تجهيز ومشاركة المنتجات على قنوات الواتساب بنقرة واحدة
              </p>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3" id="header-actions-section">
            {/* Install App button (Always visible to allow manual installation guide) */}
            <button
              onClick={onInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
              id="btn-install-app"
            >
              <Download className="w-4 h-4" />
              <span>تثبيت التطبيق 📱</span>
            </button>

            {/* Auth section */}
            {needsAuth ? (
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="gsi-material-button flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-medium text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                id="btn-google-login"
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper flex items-center gap-2">
                  <div className="gsi-material-button-icon w-4 h-4 flex items-center justify-center">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents font-semibold">{isLoggingIn ? 'جاري تسجيل الدخول...' : 'ربط جوجل درايف'}</span>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-2" id="user-logged-in-panel">
                <div className="flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-slate-50 border border-slate-100 rounded-xl" id="user-badge">
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'مستخدم'} 
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-teal-100 referrer-policy='no-referrer'" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                  <span className="text-xs sm:text-sm font-semibold text-slate-700 max-w-[80px] sm:max-w-[120px] truncate">
                    {user?.displayName?.split(' ')[0] || 'متصل'}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="تسجيل الخروج من جوجل"
                  id="btn-logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs bar inside the header area */}
        <div className="flex border-t border-slate-100" id="header-nav-tabs">
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-3 sm:py-4 px-2 sm:px-4 text-center font-bold text-xs sm:text-sm md:text-base border-b-2 transition-all flex items-center justify-center gap-1 sm:gap-2 ${
              activeTab === 'share'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            id="tab-btn-share"
          >
            <span>✨ تجهيز ومشاركة المنتجات</span>
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 py-3 sm:py-4 px-2 sm:px-4 text-center font-bold text-xs sm:text-sm md:text-base border-b-2 transition-all flex items-center justify-center gap-1 sm:gap-2 ${
              activeTab === 'gallery'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            id="tab-btn-gallery"
          >
            <span>🖼️ مستودع وإدارة الصور</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 sm:py-4 px-2 sm:px-4 text-center font-bold text-xs sm:text-sm md:text-base border-b-2 transition-all flex items-center justify-center gap-1 sm:gap-2 ${
              activeTab === 'settings'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
            id="tab-btn-settings"
          >
            <SettingsIcon className="w-4 h-4" />
            <span>⚙️ إعدادات المتجر والدرايف</span>
          </button>
        </div>
      </div>
    </header>
  );
}
