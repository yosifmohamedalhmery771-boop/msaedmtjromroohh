import React from 'react';
import { 
  Share2, 
  Copy, 
  Download, 
  RefreshCw, 
  Grid, 
  FileText, 
  Check, 
  Eye, 
  HelpCircle, 
  AlertTriangle,
  FolderOpen,
  ArrowLeftRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, FolderConfig } from '../types';
import { DriveImage, fetchDriveImages, downloadDriveFile } from '../googleDrive';

interface ShareTabProps {
  settings: Settings;
  accessToken: string | null;
  needsAuth: boolean;
  onLogin: (useRedirect?: boolean) => void;
  sharedText: string;
  onSharedTextChange: (text: string) => void;
  onPreviewImage: (image: DriveImage) => void;
}

export default function ShareTab({
  settings,
  accessToken,
  needsAuth,
  onLogin,
  sharedText,
  onSharedTextChange,
  onPreviewImage
}: ShareTabProps) {
  const [selectedFolder, setSelectedFolder] = React.useState<FolderConfig | null>(
    settings.folders.length > 0 ? settings.folders[0] : null
  );

  // Compute alternative API key connection states
  const isApiKeyUsed = !accessToken && !!settings.googleDriveApiKey;
  const effectiveToken = accessToken || settings.googleDriveApiKey || null;
  const isShareNeedsAuth = needsAuth && !settings.googleDriveApiKey;
  
  const [images, setImages] = React.useState<DriveImage[]>([]);
  const [selectedImages, setSelectedImages] = React.useState<DriveImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = React.useState(false);
  const [imageError, setImageError] = React.useState('');
  const [showShareTutorial, setShowShareTutorial] = React.useState(false);
  
  // Share processing states
  const [isPreparingShare, setIsPreparingShare] = React.useState(false);
  const [shareProgress, setShareProgress] = React.useState('');
  const [copiedText, setCopiedText] = React.useState(false);
  const [fallbackActive, setFallbackActive] = React.useState(false);

  // Sync selected folder if settings folders change
  React.useEffect(() => {
    if (settings.folders.length > 0 && !selectedFolder) {
      setSelectedFolder(settings.folders[0]);
    }
  }, [settings.folders, selectedFolder]);

  // Load images when selected folder or effectiveToken changes
  const loadFolderImages = React.useCallback(async () => {
    if (!selectedFolder || !effectiveToken) return;
    
    setIsLoadingImages(true);
    setImageError('');
    setImages([]);
    setSelectedImages([]); // Clear previous selections

    try {
      const driveFiles = await fetchDriveImages(selectedFolder.id, effectiveToken, isApiKeyUsed);
      setImages(driveFiles);
    } catch (err: any) {
      console.error('Error loading images:', err);
      setImageError(err.message || 'حدث خطأ أثناء تحميل الصور من المجلد. يرجى التأكد من صلاحية المجلد وإعادة تسجيل الدخول أو صحة مفتاح API.');
    } finally {
      setIsLoadingImages(false);
    }
  }, [selectedFolder, effectiveToken, isApiKeyUsed]);

  React.useEffect(() => {
    loadFolderImages();
  }, [loadFolderImages]);

  // Handle Multi-Selection
  const toggleSelectImage = (img: DriveImage) => {
    if (selectedImages.some(item => item.id === img.id)) {
      setSelectedImages(selectedImages.filter(item => item.id !== img.id));
    } else {
      setSelectedImages([...selectedImages, img]);
    }
  };

  const handleSelectAll = () => {
    if (selectedImages.length === images.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages([...images]);
    }
  };

  // Construct the formatted WhatsApp message text
  const getFormattedMessage = () => {
    let msg = '';
    
    // 1. Product original description
    if (sharedText.trim()) {
      msg += `${sharedText.trim()}\n\n`;
    } else {
      msg += `(يرجى كتابة أو لصق وصف المنتج هنا)\n\n`;
    }

    // 2. WhatsApp Channel Info
    if (settings.whatsappChannelLink) {
      msg += `📢 تابعوا جديدنا على قناة متجر أم روح على واتساب:\n${settings.whatsappChannelLink}\n\n`;
    }

    // 4. WhatsApp Order Info
    if (settings.whatsappOrderLink) {
      msg += `🛒 نتشرف باستقبال طلباتكم واستفساراتكم على:\n${settings.whatsappOrderLink}\n\n`;
    }

    // 5. Beautiful closing message
    if (settings.closingMessage) {
      msg += `${settings.closingMessage}`;
    }

    return msg;
  };

  // Copy text to clipboard helper
  const handleCopyText = async () => {
    const text = getFormattedMessage();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Primary share & download operation
  const handleShareAndPublish = async () => {
    if (selectedImages.length === 0) {
      alert('يرجى تحديد صورة واحدة على الأقل للمشاركة.');
      return;
    }

    if (!effectiveToken) {
      alert('يرجى تسجيل الدخول أو ضبط مفتاح API في الإعدادات أولاً.');
      return;
    }

    setIsPreparingShare(true);
    setShareProgress('جاري تحضير الملفات...');
    setFallbackActive(false);

    try {
      const filesArray: File[] = [];

      for (let i = 0; i < selectedImages.length; i++) {
        const img = selectedImages[i];
        setShareProgress(`جاري تحميل الصورة ${i + 1} من ${selectedImages.length}...`);
        
        const blob = await downloadDriveFile(img.id, effectiveToken, isApiKeyUsed, img.thumbnailLink);
        // Determine correct file extension from MIME type
        const ext = img.mimeType.split('/')[1] || 'jpeg';
        const file = new File([blob], `product_${i + 1}.${ext}`, { type: img.mimeType });
        filesArray.push(file);
      }

      setShareProgress('تجهيز النص والروابط التلقائية...');
      const formattedText = getFormattedMessage();

      // Check if browser supports sharing files natively (Web Share API)
      const shareData = {
        files: filesArray,
        title: 'منتجات متجر أم روح',
        text: formattedText
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        setShareProgress('جاري فتح قائمة المشاركة بالنظام...');
        await navigator.share(shareData);
        setIsPreparingShare(false);
      } else {
        // Fallback for browsers that don't support file sharing
        triggerDownloadAndCopyFallback(filesArray, formattedText);
      }

    } catch (err: any) {
      console.error('Error during sharing:', err);
      // If sharing aborted or failed, fallback to copy text + download files
      if (err.name !== 'AbortError') {
        alert('حدث خطأ أثناء المشاركة المباشرة. سيتم الآن تفعيل خيار التحميل اليدوي للصور ونسخ النص لسهولة مشاركته.');
        triggerDownloadAndCopyFallback([], getFormattedMessage());
      } else {
        setIsPreparingShare(false);
      }
    }
  };

  // Fallback for devices without Web Share API or for desktop
  const triggerDownloadAndCopyFallback = async (files: File[], text: string) => {
    setShareProgress('تنزيل الصور ونسخ النص تلقائياً...');
    
    // Copy the text to clipboard
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    } catch (e) {
      console.error('Failed to copy text in fallback:', e);
    }

    // Trigger downloads for each selected image
    if (files.length > 0) {
      files.forEach((file) => {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    } else {
      // If files weren't loaded, download using direct URL or fetch on-the-fly
      for (let i = 0; i < selectedImages.length; i++) {
        const img = selectedImages[i];
        try {
          const blob = await downloadDriveFile(img.id, effectiveToken!, isApiKeyUsed, img.thumbnailLink);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = img.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error('Download fail for image', img.name, e);
        }
      }
    }

    setFallbackActive(true);
    setIsPreparingShare(false);
  };

  const handleWhatsAppManualShare = async () => {
    if (selectedImages.length === 0) {
      alert('يرجى تحديد صورة واحدة على الأقل للمشاركة.');
      return;
    }

    if (!effectiveToken) {
      alert('يرجى تسجيل الدخول أو ضبط مفتاح API في الإعدادات أولاً.');
      return;
    }

    setIsPreparingShare(true);
    setShareProgress('جاري تجهيز النص والتحميل السريع...');
    setFallbackActive(false);

    try {
      const formattedText = getFormattedMessage();

      // 1. Try to copy text to clipboard
      try {
        await navigator.clipboard.writeText(formattedText);
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 3000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }

      // 2. Download each selected image using the super-fast canvas utility
      for (let i = 0; i < selectedImages.length; i++) {
        const img = selectedImages[i];
        setShareProgress(`تنزيل الصورة ${i + 1} من ${selectedImages.length}...`);
        try {
          const blob = await downloadDriveFile(img.id, effectiveToken, isApiKeyUsed, img.thumbnailLink);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const ext = img.mimeType.split('/')[1] || 'jpeg';
          a.download = `${img.name || `product_${i + 1}`}.${ext}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error('Download failed for:', img.name, e);
        }
      }

      // 3. Launch WhatsApp directly with prefilled message
      setShareProgress('جاري تحويلك إلى واتساب...');
      let waLink = '';
      if (settings.whatsappOrderLink) {
        const baseLink = settings.whatsappOrderLink.trim();
        if (baseLink.includes('wa.me')) {
          const separator = baseLink.includes('?') ? '&' : '?';
          waLink = `${baseLink}${separator}text=${encodeURIComponent(formattedText)}`;
        } else if (baseLink.startsWith('http')) {
          waLink = baseLink;
        } else {
          // It's probably a raw phone number, construct a valid wa.me link
          waLink = `https://wa.me/${baseLink.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(formattedText)}`;
        }
      } else {
        waLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(formattedText)}`;
      }

      window.open(waLink, '_blank', 'noopener,noreferrer');
      setFallbackActive(true);
    } catch (error) {
      console.error('Manual WA sharing failed:', error);
      alert('حدث خطأ أثناء إرسال البيانات للواتساب.');
    } finally {
      setIsPreparingShare(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 animate-fade-in" id="share-tab-view">
      
      {/* LEFT COLUMN: Preparation Controls (7 Cols) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Step 1: Product Description Box */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4" id="prepare-step-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center">١</span>
              <h3 className="font-extrabold text-slate-800 text-base">وصف المنتج من المتجر</h3>
            </div>
            {sharedText && (
              <button 
                onClick={() => onSharedTextChange('')} 
                className="text-xs text-red-500 hover:text-red-700 font-semibold"
                id="btn-clear-desc"
              >
                مسح المحتوى
              </button>
            )}
          </div>

          <textarea
            value={sharedText}
            onChange={(e) => onSharedTextChange(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm font-semibold leading-relaxed"
            placeholder="ألصق وصف المنتج هنا مع رابط المتجر (أو سيتم ملؤه تلقائياً عند مشاركة الصنف من تطبيق المتجر)..."
            id="textarea-product-desc"
          />

          {/* Collapsible auto-share guide */}
          <div className="pt-1">
            <button
              onClick={() => setShowShareTutorial(!showShareTutorial)}
              className="text-xs text-teal-600 hover:text-teal-800 font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
              id="btn-toggle-share-tutorial"
            >
              <span>💡 كيف أشارك المنتجات مباشرة من المتجر (سلة) دون نسخ ولصق؟</span>
              <span className="text-[10px] bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-100 font-bold">
                {showShareTutorial ? 'إغلاق الإرشاد ✕' : 'عرض التفاصيل ←'}
              </span>
            </button>

            <AnimatePresence>
              {showShareTutorial && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                  id="share-tutorial-body"
                >
                  <div className="mt-3 p-4 bg-teal-50/60 border border-teal-100 rounded-2xl space-y-3 text-right text-xs" dir="rtl">
                    <span className="font-extrabold text-teal-900 block">📲 ميزة المشاركة الفورية المباشرة (Web Share Target):</span>
                    <p className="text-slate-600 font-semibold leading-relaxed">
                      لقد قمنا ببرمجة وتفعيل هذه الميزة خصيصاً لك لكيلا تتعبي في نسخ ولصق الروابط! إليك كيف تشغلينها فوراً:
                    </p>
                    
                    <div className="space-y-2 text-[11px] text-slate-700 pr-2 border-r-2 border-teal-200">
                      <div>
                        <span className="font-bold text-teal-800">1. تثبيت التطبيق أولاً: </span>
                        اضغطي على زر <strong className="text-slate-950 font-black">"تثبيت التطبيق 📱"</strong> في أعلى الشاشة لتنزيل الأداة كتطبيق مستقل على هاتفك.
                      </div>
                      <div>
                        <span className="font-bold text-teal-800">2. مشاركة صنف من المتجر: </span>
                        اذهبي إلى لوحة تحكم متجرك (سلة) أو صفحة أي منتج في متصفح هاتفك، واضغطي على زر <strong className="text-slate-950 font-black">"مشاركة" (Share)</strong> الخاص بالهاتف أو المتصفح.
                      </div>
                      <div>
                        <span className="font-bold text-teal-800">3. اختيار مساعد النشر: </span>
                        ستجدين <strong className="text-slate-950 font-black">"مساعد النشر لمتجر أم روح"</strong> ظاهراً كأيقونة من ضمن خيارات تطبيقات المشاركة (بجانب واتساب وتليجرام). اضغطي عليه!
                      </div>
                      <div className="font-extrabold text-emerald-850">
                        ✨ سيفتح مساعد النشر فوراً ويقوم بتعبئة وصف المنتج مع رابط الطلب والروابط المخصصة في هذا الصندوق تلقائياً!
                      </div>
                    </div>

                    <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-900 leading-relaxed font-semibold">
                      ⚠️ <strong className="text-amber-950">تنويه هام للآيفون:</strong> ميزة استقبال المشاركة التلقائية (Share Target) مدعومة بالكامل على هواتف <strong className="text-amber-950">أندرويد عبر متصفح Chrome</strong>. للأسف، نظام iOS (الآيفون) يمنع تماماً جميع المواقع والـ PWAs من استقبال الروابط عبر قائمة مشاركة النظام لأسباب أمنية خاصة بشركة آبل، ولذلك سيضطر مستخدمو الآيفون لاستخدام طريقة النسخ واللصق التقليدية.
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Step 2: Select Folder and Images */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-5" id="prepare-step-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center">٢</span>
              <h3 className="font-extrabold text-slate-800 text-base">اختر مجلد الصور وتحديدها</h3>
            </div>
            
            {/* Folder Selection Dropdown / Buttons */}
            {settings.folders.length > 0 && (
              <div className="flex items-center gap-2" id="folder-selection-dropdown-wrapper">
                <select
                  value={selectedFolder ? selectedFolder.id : ''}
                  onChange={(e) => {
                    const folder = settings.folders.find(f => f.id === e.target.value);
                    if (folder) setSelectedFolder(folder);
                  }}
                  className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                  id="select-drive-folder"
                >
                  {settings.folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>

                {effectiveToken && !isLoadingImages && (
                  <button
                    onClick={loadFolderImages}
                    className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-teal-600 transition-all"
                    title="تحديث قائمة الصور"
                    id="btn-refresh-images"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Warnings and Login Prompts if disconnected */}
          {isShareNeedsAuth ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 space-y-4" id="google-disconnected-warning">
              <AlertTriangle className="w-10 h-10 mx-auto text-amber-500" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">لم يتم ربط جوجل درايف بعد</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  يرجى ربط حساب جوجل درايف الخاص بك لتتمكن من تحميل الصور وعرضها وتحديدها مباشرة داخل الأداة.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-sm mx-auto pt-2">
                <button
                  onClick={() => onLogin(true)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  id="btn-login-prompt-share-tab-redirect"
                >
                  تسجيل بالتحويل المباشر 🔗 (للهاتف)
                </button>
                <button
                  onClick={() => onLogin(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer"
                  id="btn-login-prompt-share-tab-popup"
                >
                  نافذة منبثقة 💻
                </button>
              </div>
            </div>
          ) : settings.folders.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 space-y-3" id="no-folders-warning">
              <FolderOpen className="w-10 h-10 mx-auto text-slate-400" />
              <p className="text-sm font-bold text-slate-700">لا توجد مجلدات مضافة في الإعدادات</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                اذهب إلى صفحة الإعدادات وأضف روابط مجلدات درايف الخاصة بمنتجاتك لتتمكن من تصفح صورها وتحديدها هنا.
              </p>
            </div>
          ) : isLoadingImages ? (
            <div className="py-16 text-center space-y-3" id="images-loader">
              <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-semibold text-slate-500">جاري تحميل الصور من جوجل درايف...</p>
            </div>
          ) : imageError ? (
            <div className="p-5 bg-red-50 text-red-600 rounded-2xl text-xs font-semibold space-y-3 border border-red-100" id="google-images-error">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{imageError}</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={loadFolderImages}
                  className="px-3 py-1.5 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-colors cursor-pointer text-[11px]"
                  id="btn-retry-images"
                >
                  إعادة المحاولة
                </button>
                <button
                  onClick={() => onLogin(true)}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer text-[11px]"
                  id="btn-relogin-fix-redirect"
                >
                  تجديد تسجيل الدخول (تحويل مباشر)
                </button>
                <button
                  onClick={() => onLogin(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors cursor-pointer text-[11px]"
                  id="btn-relogin-fix-popup"
                >
                  تجديد (نافذة منبثقة)
                </button>
              </div>
            </div>
          ) : images.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2" id="empty-folder-placeholder">
              <Grid className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold">المجلد فارغ أو لا يحتوي على صور</p>
              <p className="text-xs text-slate-400">تأكد من رفع صور المنتجات في هذا المجلد على جوجل درايف ثم اضغط تحديث.</p>
            </div>
          ) : (
            <div className="space-y-4" id="images-explorer-wrapper">
              {/* Select Actions header */}
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold" id="images-selection-status">
                <span>تم تحديد ({selectedImages.length} من {images.length}) صورة</span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-teal-600 hover:text-teal-700 transition-colors cursor-pointer"
                  id="btn-select-all"
                >
                  {selectedImages.length === images.length ? 'إلغاء تحديد الكل' : 'تحديد جميع الصور'}
                </button>
              </div>

              {/* Images Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto p-1" id="images-grid">
                {images.map((img) => {
                  const isSelected = selectedImages.some(item => item.id === img.id);
                  return (
                    <div
                      key={img.id}
                      onClick={() => toggleSelectImage(img)}
                      className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all group select-none ${
                        isSelected 
                          ? 'border-teal-500 ring-2 ring-teal-500/20' 
                          : 'border-slate-100 hover:border-slate-300'
                      }`}
                      id={`image-card-${img.id}`}
                    >
                      {/* Image Thumbnail */}
                      <img
                        src={img.thumbnailLink}
                        alt={img.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />

                      {/* Selection Checkbox indicator overlay */}
                      <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        isSelected ? 'bg-teal-600 text-white' : 'bg-black/40 text-transparent border border-white/50'
                      }`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>

                      {/* Preview Overlay Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewImage(img);
                        }}
                        className="absolute bottom-2 left-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="معاينة الصورة"
                        id={`btn-preview-img-${img.id}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* File Name tooltip on hover */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <p className="text-[9px] text-white font-medium truncate text-center">{img.name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: Real-Time Structured Output Live Preview & Publish (5 Cols) */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Step 3: Structured Live Preview */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4 flex flex-col max-h-[600px]" id="prepare-step-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              <h3 className="font-extrabold text-slate-800 text-base">معاينة الرسالة النهائية</h3>
            </div>
            
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-bold bg-teal-50 px-3 py-1.5 rounded-xl transition-all"
              id="btn-copy-live-preview"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ النص</span>
                </>
              )}
            </button>
          </div>

          {/* Formatted Text Preview Area */}
          <div className="flex-1 overflow-y-auto bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-700 space-y-4 leading-relaxed whitespace-pre-line text-right" id="live-preview-content">
            {/* Image Selection thumbnails inside the preview */}
            {selectedImages.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">الصور المرفقة ({selectedImages.length}):</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedImages.map((img) => (
                    <div key={img.id} className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                      <img src={img.thumbnailLink} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="h-[1px] bg-slate-200/60 my-2"></div>
              </div>
            )}

            {/* Generated structured text preview */}
            <div className="font-semibold text-slate-800" id="preview-text-body">
              {getFormattedMessage()}
            </div>
          </div>

          {/* Fallback success panel */}
          {fallbackActive && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl text-xs space-y-2 border border-emerald-100" id="fallback-publish-notice">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-bold">تم تحميل الصور ونسخ النص بنجاح! 🎉</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                لقد تم تحميل {selectedImages.length} صورة من درايف إلى جهازك ونسخ النص المنسق بالكامل للحافظة. يمكنك الآن الذهاب لقناة الواتساب ولصقها معاً.
              </p>
              {settings.whatsappChannelLink && (
                <a
                  href={settings.whatsappChannelLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-white border border-emerald-200 px-3 py-1.5 rounded-xl font-bold hover:bg-emerald-100 transition-colors mt-1"
                  id="btn-goto-wa-channel"
                >
                  <span>الذهاب لقناة الواتساب الآن 💬</span>
                </a>
              )}
            </div>
          )}

          {/* Action Buttons Grid */}
          <div className="space-y-3 pt-2">
            {/* Primary Option: Manual Fast WA Share (Download + Copy + Open WA) */}
            <button
              onClick={handleWhatsAppManualShare}
              disabled={isPreparingShare || selectedImages.length === 0}
              className={`w-full py-4 text-white rounded-2xl font-extrabold text-xs sm:text-sm md:text-base transition-all flex items-center justify-center gap-2.5 shadow-md active:scale-95 cursor-pointer disabled:cursor-not-allowed ${
                selectedImages.length === 0 
                  ? 'bg-slate-300 text-slate-500 shadow-none hover:bg-slate-300' 
                  : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/10'
              }`}
              id="btn-trigger-wa-manual"
            >
              {isPreparingShare ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">{shareProgress}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-emerald-100 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 1.977 14.07 1.953 11.45 1.951c-5.436 0-9.86 4.37-9.864 9.8a9.705 9.705 0 001.521 5.127l-.993 3.626 3.716-.962-.128-.088-.155-.08z" />
                  </svg>
                  <span>مشاركة سريعة للواتساب (تنزيل صور + فتح المحادثة) 💬</span>
                </>
              )}
            </button>

            {/* Secondary Option: Native System Share */}
            <button
              onClick={handleShareAndPublish}
              disabled={isPreparingShare || selectedImages.length === 0}
              className={`w-full py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border active:scale-95 cursor-pointer disabled:cursor-not-allowed ${
                selectedImages.length === 0 
                  ? 'border-slate-200 text-slate-400 bg-slate-50' 
                  : 'border-teal-200 text-teal-800 bg-teal-50 hover:bg-teal-100/70 hover:border-teal-300'
              }`}
              id="btn-trigger-share"
            >
              <Share2 className="w-4 h-4 text-teal-600" />
              <span>الخيار البديل: مشاركة النظام الذكية (نص وصور معاً) 📱</span>
            </button>
          </div>
          
          {selectedImages.length === 0 && (
            <p className="text-[10px] text-slate-400 text-center font-semibold">
              * حدد صورة منتج واحدة على الأقل لتتمكن من التجهيز والمشاركة.
            </p>
          )}
        </div>

      </div>

    </div>
  );
}
