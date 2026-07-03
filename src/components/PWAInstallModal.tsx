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
  ExternalLink
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallNatively: () => void;
  hasNativePrompt: boolean;
}

export default function PWAInstallModal({
  isOpen,
  onClose,
  onInstallNatively,
  hasNativePrompt
}: PWAInstallModalProps) {
  if (!isOpen) return null;

  // Detect if currently loaded inside an iframe (such as AI Studio preview iframe)
  const isInsideIframe = React.useMemo(() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in animate-none" id="pwa-install-modal">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        id="pwa-modal-content"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800">تثبيت التطبيق على الشاشة الرئيسية</h3>
              <p className="text-[10.5px] text-slate-400 font-semibold">استمتع بتجربة تطبيق مستقلة وسريعة بالكامل</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            id="pwa-modal-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 select-none" id="pwa-modal-body">
          
          {/* Iframe warning section */}
          {isInsideIframe ? (
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl text-center space-y-3" id="iframe-install-prompt-area">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto border border-amber-150">
                <ExternalLink className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-amber-950">تنبيه هام للمعاينة</h4>
                <p className="text-xs text-amber-900 leading-relaxed font-semibold">
                  أنت تتصفح الأداة حالياً داخل نظام معاينة AI Studio (Iframe). هذا يحظر على المتصفح تشغيل وتثبيت تطبيقات الويب المتقدمة (PWA).
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                  لتثبيت التطبيق بشكل حقيقي ومستقل تماماً كأي تطبيق أندرويد على جهازك، اضغط على الزر أدناه لفتحه في نافذة جديدة ثم اضغط "تثبيت التطبيق" هناك!
                </p>
              </div>
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-teal-600/10 active:scale-95 transition-all flex items-center justify-center gap-2 text-center cursor-pointer"
                id="pwa-btn-open-external"
              >
                <ExternalLink className="w-4 h-4" />
                <span>فتح الأداة في نافذة جديدة للتثبيت الفوري 🚀</span>
              </a>
            </div>
          ) : hasNativePrompt ? (
            <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl text-center space-y-3" id="native-install-prompt-area">
              <div className="w-12 h-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-emerald-50">
                <Smartphone className="w-6 h-6 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-emerald-900">تثبيت فوري مدعوم!</h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  متصفحك يدعم التثبيت المباشر بنقرة واحدة كتطبيق مستقل تماماً على جهازك.
                </p>
              </div>
              <button
                onClick={() => {
                  onInstallNatively();
                  onClose();
                }}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                id="pwa-btn-native-trigger"
              >
                <Download className="w-4 h-4" />
                <span>ثبت التطبيق الآن 📱</span>
              </button>
            </div>
          ) : (
            <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3" id="no-prompt-notice">
              <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-900">إذا لم تظهر لك نافذة التثبيت التلقائية:</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                  نظراً لاختلاف المتصفحات وأنظمة التشغيل (مثل Safari على الآيفون)، يرجى اتباع الإرشادات اليدوية السهلة أدناه لتثبيت التطبيق فورا وبشكل مجاني تماماً.
                </p>
              </div>
            </div>
          )}

          {/* Guide steps */}
          <div className="space-y-5" id="pwa-manual-instructions">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">طرق التثبيت اليدوية بحسب نوع جهازك:</h4>

            {/* iOS Safari Guide */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3" id="guide-ios">
              <div className="flex items-center gap-2 text-slate-800">
                <div className="p-1 bg-white rounded-lg border border-slate-200">
                  <Compass className="w-4 h-4 text-sky-600" />
                </div>
                <span className="text-xs sm:text-sm font-black">أجهزة الآيفون والآيباد (متصفح Safari):</span>
              </div>
              
              <div className="space-y-2.5 text-xs text-slate-600 pr-1.5" id="ios-steps">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-white border border-slate-200 text-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">١</span>
                  <div className="flex-1">
                    افتح رابط الأداة في متصفح <strong className="text-slate-800">Safari</strong> الأصلي.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-white border border-slate-200 text-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">٢</span>
                  <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                    اضغط على زر <strong className="text-slate-800 flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-250 text-[10px]"><Share className="w-3 h-3 text-sky-600" /> "مشاركة" (Share)</strong> الموجود في شريط الأدوات السفلي.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-white border border-slate-200 text-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">٣</span>
                  <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                    مرر لأسفل القائمة قليلاً واختر <strong className="text-slate-800 flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-250 text-[10px]"><PlusSquare className="w-3 h-3 text-slate-600" /> "إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</strong>.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-white border border-slate-200 text-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">٤</span>
                  <div className="flex-1">
                    اضغط على كلمة <strong className="text-teal-700">"إضافة" (Add)</strong> في أعلى اليمين ليظهر التطبيق في شاشتك الرئيسية فوراً كأيقونة مستقلة!
                  </div>
                </div>
              </div>
            </div>

            {/* Android Chrome Guide */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3" id="guide-android">
              <div className="flex items-center gap-2 text-slate-800">
                <div className="p-1 bg-white rounded-lg border border-slate-200">
                  <Chrome className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-xs sm:text-sm font-black">أجهزة الأندرويد (متصفح Chrome):</span>
              </div>
              
              <div className="space-y-2.5 text-xs text-slate-600 pr-1.5" id="android-steps">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-white border border-slate-200 text-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">١</span>
                  <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                    اضغط على أيقونة <strong className="text-slate-800 flex items-center gap-0.5 bg-white px-1.5 py-0.5 rounded border border-slate-250 text-[10px]"><MoreVertical className="w-3 h-3" /> النقاط الثلاث</strong> في أعلى يسار متصفح كروم.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-white border border-slate-200 text-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">٢</span>
                  <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                    اضغط على خيار <strong className="text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-250 text-[10px]">"إضافة إلى الشاشة الرئيسية"</strong> أو <strong className="text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-250 text-[10px]">"تثبيت التطبيق"</strong>.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 bg-white border border-slate-200 text-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">٣</span>
                  <div className="flex-1">
                    أكد عملية التثبيت بالضغط على <strong className="text-teal-700">"إضافة" أو "تثبيت"</strong> لتجده فورا مع تطبيقات جهازك.
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Benefits Info badges */}
          <div className="bg-teal-50/30 p-4 rounded-2xl border border-teal-50 flex flex-col sm:flex-row items-center justify-center gap-4 text-teal-950 font-bold text-[11px]" id="pwa-benefits">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>لا يتطلب مساحة تخزينية</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>أسرع وأكثر أماناً</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>ميزة النشر والمشاركة المباشرة</span>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors shadow-2xs active:scale-95"
            id="pwa-close-btn-bottom"
          >
            حسناً، فهمت الطريقة
          </button>
        </div>
      </div>
    </div>
  );
}
