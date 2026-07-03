import React from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  Chrome, 
  Compass, 
  MoreVertical, 
  Share, 
  PlusSquare, 
  CheckCircle,
  HelpCircle,
  ExternalLink,
  AlertCircle,
  Zap,
  TrendingDown,
  WifiOff,
  ArrowRight
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallNatively: () => void;
  hasNativePrompt: boolean;
  isAlreadyInstalled?: boolean;
}

export default function PWAInstallModal({
  isOpen,
  onClose,
  onInstallNatively,
  hasNativePrompt,
  isAlreadyInstalled = false
}: PWAInstallModalProps) {
  const [showManualGuide, setShowManualGuide] = React.useState(false);
  const [activeGuideTab, setActiveGuideTab] = React.useState<'ios' | 'android'>('ios');

  // Reset states when opened or closed
  React.useEffect(() => {
    if (isOpen) {
      setShowManualGuide(false);
      // Auto detect user agent to select active guide tab
      const ua = navigator.userAgent || '';
      if (/Android/i.test(ua)) {
        setActiveGuideTab('android');
      } else {
        setActiveGuideTab('ios');
      }
    }
  }, [isOpen]);

  // Detect if currently loaded inside an iframe (such as AI Studio preview iframe)
  const isInsideIframe = React.useMemo(() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = () => {
    if (hasNativePrompt && !isInsideIframe) {
      onInstallNatively();
      onClose();
    } else {
      setShowManualGuide(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 animate-fade-in" id="pwa-install-modal">
      <div 
        className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-[430px] shadow-2xl relative select-none flex flex-col max-h-[95vh] overflow-hidden border border-slate-150 transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
        id="pwa-modal-content"
      >
        {/* Top Handle / Drag Indicator for mobile */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mt-3.5 mb-2 block sm:hidden"></div>

        {/* Circular Close Button on Top Left */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer shadow-3xs z-10"
          id="pwa-modal-close"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        <div className="overflow-y-auto" id="pwa-modal-scrollable">
          {!showManualGuide ? (
            /* ========================================================================= */
            /*                         MAIN VIEW (IMAGE 2 DESIGN)                       */
            /* ========================================================================= */
            <div className="p-6 flex flex-col items-center pb-8 animate-fade-in">
              {/* App Icon Centered with Yellow/Orange gradient and Sakura Flower */}
              <div className="relative mt-8 mb-5 w-24 h-24 bg-gradient-to-tr from-amber-400 to-amber-100 rounded-[2.25rem] flex items-center justify-center shadow-lg shadow-amber-500/10 border border-amber-200/30">
                {/* Beautiful vector pink Cherry Blossom (Sakura) Flower */}
                <svg className="w-16 h-16 text-pink-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C11.5 5 8.5 7.5 5.5 7.5C2.5 7.5 2 5.5 4.5 4C7 2.5 10.5 2 12 2Z" fill="#FB7185" />
                  <path d="M12 2C12.5 5 15.5 7.5 18.5 7.5C21.5 7.5 22 5.5 19.5 4C17 2.5 13.5 2 12 2Z" fill="#FB7185" />
                  <path d="M12 22C11.5 19 8.5 16.5 5.5 16.5C2.5 16.5 2 18.5 4.5 20C7 21.5 10.5 22 12 22Z" fill="#F43F5E" />
                  <path d="M12 22C12.5 19 15.5 16.5 18.5 16.5C21.5 16.5 22 18.5 19.5 20C17 21.5 13.5 22 12 22Z" fill="#F43F5E" />
                  <path d="M2 12C5 11.5 7.5 8.5 7.5 5.5C7.5 2.5 5.5 2 4.0 4.5C2.5 7 2 10.5 2 12Z" fill="#FDA4AF" />
                  <path d="M2 12C5 12.5 7.5 15.5 7.5 18.5C7.5 21.5 5.5 22 4.0 19.5C2.5 17 2 13.5 2 12Z" fill="#FB7185" />
                  <path d="M22 12C19 11.5 16.5 8.5 16.5 5.5C16.5 2.5 18.5 2 20.0 4.5C21.5 7 22 10.5 22 12Z" fill="#FDA4AF" />
                  <path d="M22 12C19 12.5 16.5 15.5 16.5 18.5C16.5 21.5 18.5 22 20.0 19.5C21.5 17 22 13.5 22 12Z" fill="#F43F5E" />
                  <circle cx="12" cy="12" r="2.5" fill="#FBBF24" />
                </svg>
                {/* Badge on Bottom-Right of Icon with phone symbol */}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#B25900] rounded-full border-2 border-white flex items-center justify-center text-white shadow-md">
                  <Smartphone className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 text-center mb-2 leading-tight" dir="rtl">
                ✨ تثبيت تطبيق متجر أم روح 🌸
              </h3>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-500 text-center px-4 leading-relaxed mb-6" dir="rtl">
                احصلي على متجر أم روح على شاشتك الرئيسية لتسوق سريع وآمن بنقرة واحدة بدون متصفح! ✨
              </p>

              {/* Status Alert for Standalone Mode / Already Installed */}
              {isAlreadyInstalled && (
                <div className="w-full mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-900 text-xs text-center font-bold" dir="rtl">
                  🎉 التطبيق مثبت ونشط بالفعل على هذا الجهاز كـ PWA!
                </div>
              )}

              {/* Grid with 3 features (RTL order matching screenshot 2) */}
              <div className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[2rem] grid grid-cols-3 divide-x divide-x-reverse divide-slate-200/50" dir="rtl">
                {/* Column 1 (Right): Speed */}
                <div className="flex flex-col items-center text-center px-1">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-1.5 shadow-3xs">
                    <Zap className="w-4.5 h-4.5 fill-amber-500 text-amber-500" />
                  </div>
                  <span className="text-[10.5px] font-black text-slate-800 leading-tight">أسرع بـ ٣ أضعاف</span>
                  <span className="text-[9px] text-slate-400 font-bold mt-0.5 leading-none">تصفح فوري وسلس</span>
                </div>
                
                {/* Column 2 (Middle): Data saver */}
                <div className="flex flex-col items-center text-center px-1">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-1.5 shadow-3xs">
                    <TrendingDown className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[10.5px] font-black text-slate-800 leading-tight">موفر للبيانات</span>
                  <span className="text-[9px] text-slate-400 font-bold mt-0.5 leading-none">استهلاك أقل للإنترنت</span>
                </div>

                {/* Column 3 (Left): Offline */}
                <div className="flex flex-col items-center text-center px-1">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-1.5 shadow-3xs">
                    <WifiOff className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[10.5px] font-black text-slate-800 leading-tight">يعمل بدون إنترنت</span>
                  <span className="text-[9px] text-slate-400 font-bold mt-0.5 leading-none">مزامنة كاش المنتجات</span>
                </div>
              </div>

              {/* Main Primary Button (Orange) */}
              <button
                onClick={handleInstallClick}
                className="w-full mt-6 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                id="btn-pwa-main-install"
                dir="rtl"
              >
                <span>⚡ بدء تثبيت التطبيق وتنزيله</span>
                <Download className="w-4.5 h-4.5" />
              </button>

              {/* Disclaimer */}
              <p className="text-[10.5px] text-slate-400 text-center px-4 mt-3.5 leading-relaxed" dir="rtl">
                إذا لم يظهر مربع التثبيت التلقائي، يمكنك النقر على خيارات المتصفح (⋮) ثم اختيار تثبيت التطبيق (Install App) يدوياً.
              </p>

              {/* Secondary Button (Go back/Close) */}
              <button
                onClick={onClose}
                className="w-full mt-4 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                id="btn-pwa-main-continue"
                dir="rtl"
              >
                <span>🌐 المتابعة من خلال المتصفح</span>
              </button>
            </div>
          ) : (
            /* ========================================================================= */
            /*                MANUAL INSTRUCTION GUIDE (FALLBACK SHEET)                  */
            /* ========================================================================= */
            <div className="p-6 flex flex-col pb-8 animate-fade-in" dir="rtl">
              {/* Header with Back arrow */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 mb-5">
                <button 
                  onClick={() => setShowManualGuide(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors cursor-pointer"
                  title="رجوع"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="text-base font-black text-slate-800">إرشادات التثبيت السريعة</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">خطوات سهلة ومجانية بحسب نوع جهازك</p>
                </div>
              </div>

              {/* WhatsApp / In-app browser warning banner */}
              {isInsideIframe || /WhatsApp/i.test(navigator.userAgent || '') ? (
                <div className="p-4 bg-amber-50 border border-amber-200/70 rounded-2xl text-xs space-y-1.5 mb-5 text-right">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>تنبيه هام جداً لمستخدمي التطبيقات ⚠️</span>
                  </div>
                  <p className="text-amber-800 leading-relaxed font-semibold text-[11px]">
                    إذا كنت تفتح هذا الرابط من داخل تطبيق <strong>واتساب (WhatsApp)</strong> أو نافذة معاينة، يرجى أولاً النقر على النقاط الثلاث في الأعلى واختيار <strong>"الفتح في متصفح خارجي"</strong> أو <strong>"الفتح في Chrome/Safari"</strong>.
                  </p>
                  <p className="text-slate-500 text-[9.5px] leading-relaxed">
                    * المتصفحات المدمجة تحظر تثبيت التطبيقات المستقلة (PWA). يجب تشغيل الرابط في متصفحك الأساسي لتستمتعي بالتثبيت.
                  </p>
                </div>
              ) : null}

              {/* OS Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-5">
                <button
                  type="button"
                  onClick={() => setActiveGuideTab('ios')}
                  className={`py-2 px-3 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    activeGuideTab === 'ios'
                      ? 'bg-white text-slate-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🍎 آيفون / آيباد (Safari)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGuideTab('android')}
                  className={`py-2 px-3 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    activeGuideTab === 'android'
                      ? 'bg-white text-slate-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🤖 أندرويد (Chrome)
                </button>
              </div>

              {/* Instruction Steps */}
              {activeGuideTab === 'ios' ? (
                <div className="space-y-4 text-right animate-fade-in" id="ios-guide-body">
                  <div className="flex items-center gap-2 text-slate-800 mb-2">
                    <Compass className="w-4 h-4 text-sky-600" />
                    <span className="text-xs sm:text-sm font-black">طريقة تثبيت الآيفون (Safari):</span>
                  </div>
                  
                  <div className="space-y-3 text-xs text-slate-600">
                    <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="w-5.5 h-5.5 bg-white border border-slate-200 text-slate-700 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">١</span>
                      <div className="flex-1">
                        تأكدي من فتح رابط المتجر في متصفح <strong className="text-slate-800 font-extrabold">Safari</strong> الأصلي للآيفون وليس أي متصفح مدمج.
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="w-5.5 h-5.5 bg-white border border-slate-200 text-slate-700 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">٢</span>
                      <div className="flex-1">
                        اضغطي على زر <strong className="text-sky-600 inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px] font-extrabold"><Share className="w-3 h-3" /> "مشاركة" (Share)</strong> في شريط الأدوات السفلي للمتصفح.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="w-5.5 h-5.5 bg-white border border-slate-200 text-slate-700 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">٣</span>
                      <div className="flex-1">
                        مرري الخيارات لأسفل قليلاً واختاري <strong className="text-slate-800 inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px] font-extrabold"><PlusSquare className="w-3 h-3 text-slate-500" /> "إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</strong>.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="w-5.5 h-5.5 bg-white border border-slate-200 text-slate-700 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">٤</span>
                      <div className="flex-1">
                        اضغطي على كلمة <strong className="text-teal-600 font-extrabold">"إضافة" (Add)</strong> في الزاوية العلوية اليمنى، لتظهر أيقونة متجر أم روح على شاشتك فوراً!
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-right animate-fade-in" id="android-guide-body">
                  <div className="flex items-center gap-2 text-slate-800 mb-2">
                    <Chrome className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs sm:text-sm font-black">طريقة تثبيت الأندرويد (Chrome):</span>
                  </div>
                  
                  <div className="space-y-3 text-xs text-slate-600">
                    <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="w-5.5 h-5.5 bg-white border border-slate-200 text-slate-700 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">١</span>
                      <div className="flex-1">
                        اضغطي على أيقونة <strong className="text-slate-800 inline-flex items-center gap-0.5 bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px] font-extrabold"><MoreVertical className="w-3 h-3" /> النقاط الثلاث</strong> في أعلى يسار متصفح كروم.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="w-5.5 h-5.5 bg-white border border-slate-200 text-slate-700 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">٢</span>
                      <div className="flex-1">
                        اضغطي على خيار <strong className="text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px] font-extrabold">"إضافة إلى الشاشة الرئيسية"</strong> أو <strong className="text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px] font-extrabold">"تثبيت التطبيق" (Install App)</strong>.
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="w-5.5 h-5.5 bg-white border border-slate-200 text-slate-700 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">٣</span>
                      <div className="flex-1">
                        أكدي التثبيت بالضغط على <strong className="text-teal-600 font-extrabold">"إضافة" أو "تثبيت"</strong> وسيقوم هاتفك بتنزيل المتجر كأيقونة مستقلة فوراً!
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Back to main PWA info Button */}
              <button
                onClick={() => setShowManualGuide(false)}
                className="w-full mt-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
                id="btn-pwa-guide-back"
              >
                <span>حسناً، فهمت طريقة التثبيت 👍</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
