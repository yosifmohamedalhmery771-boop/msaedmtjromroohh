import React from 'react';
import { 
  Upload, 
  Folder, 
  Image as ImageIcon, 
  FileText, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  Loader2, 
  Plus, 
  X, 
  Link2,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Settings, FolderConfig } from '../types';
import { 
  DriveImage, 
  fetchDriveImages, 
  uploadDriveFile, 
  renameDriveFile, 
  deleteDriveFile 
} from '../googleDrive';

interface GalleryTabProps {
  settings: Settings;
  accessToken: string | null;
  needsAuth: boolean;
  onLogin: () => void;
  onPreviewImage: (image: DriveImage) => void;
}

export default function GalleryTab({
  settings,
  accessToken,
  needsAuth,
  onLogin,
  onPreviewImage
}: GalleryTabProps) {
  // Navigation folders from settings
  const folders = settings.folders;
  const [activeFolder, setActiveFolder] = React.useState<FolderConfig | null>(
    folders.length > 0 ? folders[0] : null
  );

  // Compute alternative API key connection states
  const isApiKeyUsed = !accessToken && !!settings.googleDriveApiKey;
  const effectiveToken = accessToken || settings.googleDriveApiKey || null;
  const isGalleryNeedsAuth = needsAuth && !settings.googleDriveApiKey;

  // Images state
  const [images, setImages] = React.useState<DriveImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = React.useState(false);
  const [imageError, setImageError] = React.useState('');

  // Upload state
  const [selectedUploadFolder, setSelectedUploadFolder] = React.useState<string>(
    folders.length > 0 ? folders[0].id : ''
  );
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = React.useState<string | null>(null);
  const [uploadName, setUploadName] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadSuccess, setUploadSuccess] = React.useState(false);
  const [uploadError, setUploadError] = React.useState('');

  // File modification states
  const [editingImageId, setEditingImageId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const [isUpdatingName, setIsUpdatingName] = React.useState(false);
  const [deletingImageId, setDeletingImageId] = React.useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = React.useState<string | null>(null);
  const [copiedType, setCopiedType] = React.useState<'cdn' | 'direct' | null>(null);

  // Sync selected folder if folders change
  React.useEffect(() => {
    if (folders.length > 0 && !activeFolder) {
      setActiveFolder(folders[0]);
    }
  }, [folders, activeFolder]);

  // Load images in active folder
  const loadImages = React.useCallback(async () => {
    if (!activeFolder || !effectiveToken) return;
    setIsLoadingImages(true);
    setImageError('');
    try {
      const driveFiles = await fetchDriveImages(activeFolder.id, effectiveToken, isApiKeyUsed);
      setImages(driveFiles);
    } catch (err: any) {
      console.error('Error fetching images:', err);
      setImageError(err.message || 'فشل جلب الصور من جوجل درايف. يرجى التأكد من صلاحية المجلد وتسجيل الدخول أو صحة مفتاح API.');
    } finally {
      setIsLoadingImages(false);
    }
  }, [activeFolder, effectiveToken, isApiKeyUsed]);

  React.useEffect(() => {
    loadImages();
  }, [loadImages]);

  // File drop/select handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setUploadError('يرجى اختيار ملف صورة صالح فقط.');
        return;
      }
      setUploadFile(file);
      setUploadError('');
      
      // Extract file name without extension to prefill the name input
      const dotIndex = file.name.lastIndexOf('.');
      const nameWithoutExt = dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
      setUploadName(nameWithoutExt);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) {
        setUploadError('يرجى اختيار ملف صورة صالح فقط.');
        return;
      }
      setUploadFile(file);
      setUploadError('');
      
      const dotIndex = file.name.lastIndexOf('.');
      const nameWithoutExt = dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
      setUploadName(nameWithoutExt);

      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearUpload = () => {
    setUploadFile(null);
    setUploadPreview(null);
    setUploadName('');
    setUploadError('');
    setUploadSuccess(false);
  };

  // Perform upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      setUploadError('يرجى تسجيل الدخول بحساب جوجل أولاً للتمكن من الرفع.');
      return;
    }
    if (!selectedUploadFolder) {
      setUploadError('يرجى اختيار المجلد المستهدف للرفع.');
      return;
    }
    if (!uploadFile) {
      setUploadError('يرجى تحديد ملف صورة للرفع.');
      return;
    }
    if (!uploadName.trim()) {
      setUploadError('يرجى كتابة اسم مناسب للصورة.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess(false);

    try {
      // Keep original file extension
      const dotIndex = uploadFile.name.lastIndexOf('.');
      const ext = dotIndex !== -1 ? uploadFile.name.substring(dotIndex) : '.jpg';
      const finalFileName = uploadName.trim() + ext;

      const newImage = await uploadDriveFile(
        selectedUploadFolder,
        finalFileName,
        uploadFile,
        accessToken
      );

      setUploadSuccess(true);
      clearUpload();

      // If uploaded to currently selected folder, reload current folder images immediately
      if (activeFolder && activeFolder.id === selectedUploadFolder) {
        loadImages();
      } else {
        // Switch view to the folder where image was uploaded to see it
        const uploadedToFolder = folders.find(f => f.id === selectedUploadFolder);
        if (uploadedToFolder) {
          setActiveFolder(uploadedToFolder);
        }
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'فشل رفع الصورة إلى جوجل درايف. يرجى التحقق من الاتصال والصلاحيات.');
    } finally {
      setIsUploading(false);
    }
  };

  // Rename image
  const handleStartRename = (image: DriveImage) => {
    setEditingImageId(image.id);
    const dotIndex = image.name.lastIndexOf('.');
    const nameWithoutExt = dotIndex !== -1 ? image.name.substring(0, dotIndex) : image.name;
    setEditingName(nameWithoutExt);
  };

  const handleSaveRename = async (image: DriveImage) => {
    if (!accessToken || !editingName.trim()) return;

    setIsUpdatingName(true);
    try {
      const dotIndex = image.name.lastIndexOf('.');
      const ext = dotIndex !== -1 ? image.name.substring(dotIndex) : '';
      const finalName = editingName.trim() + ext;

      const updated = await renameDriveFile(image.id, finalName, accessToken);
      
      // Update local state
      setImages(images.map(img => img.id === image.id ? { ...img, name: updated.name } : img));
      setEditingImageId(null);
    } catch (err: any) {
      alert('فشل تعديل الاسم: ' + err.message);
    } finally {
      setIsUpdatingName(false);
    }
  };

  // Delete image
  const handleDeleteImage = async (image: DriveImage) => {
    if (!accessToken) return;
    const confirmed = window.confirm(`هل أنت متأكد تماماً من حذف الصورة "${image.name}" نهائياً من جوجل درايف؟`);
    if (!confirmed) return;

    setDeletingImageId(image.id);
    try {
      await deleteDriveFile(image.id, accessToken);
      setImages(images.filter(img => img.id !== image.id));
    } catch (err: any) {
      alert('فشل حذف الصورة: ' + err.message);
    } finally {
      setDeletingImageId(null);
    }
  };

  // Copy link helpers
  const handleCopyLink = async (fileId: string, type: 'cdn' | 'direct') => {
    // CDN Link structure: high speed, great for online store layouts
    // Direct stream link: official download link format
    const link = type === 'cdn' 
      ? `https://lh3.googleusercontent.com/d/${fileId}`
      : `https://drive.google.com/uc?export=download&id=${fileId}`;

    try {
      await navigator.clipboard.writeText(link);
      setCopiedLinkId(fileId);
      setCopiedType(type);
      setTimeout(() => {
        setCopiedLinkId(null);
        setCopiedType(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Detect if currently loaded inside an iframe (such as AI Studio preview iframe)
  const isInsideIframe = React.useMemo(() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }, []);

  if (isGalleryNeedsAuth) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center max-w-xl mx-auto" id="gallery-auth-needed-container">
        <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center mb-6 shadow-xs" id="auth-icon-wrapper">
          <Folder className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">ربط حساب جوجل درايف مطلوب</h3>
        <p className="text-slate-500 text-xs sm:text-sm leading-relaxed mb-6">
          لتتمكن من رفع الصور مباشرة إلى مجلدات متجرك، وتصفح الملفات المخزنة ونسخ روابطها ونشرها، يرجى تسجيل الدخول بحساب جوجل المرتبط بالدرايف أولاً.
        </p>

        {isInsideIframe ? (
          <div className="w-full bg-amber-50 border border-amber-200 p-5 rounded-2xl mb-6 text-right space-y-3" id="iframe-auth-notice">
            <div className="flex items-center gap-2 text-amber-900 font-black text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>تنبيه بخصوص نظام المعاينة (Iframe)</span>
            </div>
            <p className="text-[11px] sm:text-xs text-amber-950 leading-relaxed font-semibold">
              أنت تتصفح التطبيق حالياً داخل نافذة معاينة AI Studio. لأسباب أمنية، تحظر المتصفحات فتح نوافذ تسجيل الدخول (Google Auth Popups) داخل الإطارات الفرعية (Iframes).
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              يرجى الضغط على الزر أدناه لفتح التطبيق بشكل كامل ومستقل في علامة تبويب جديدة، وهناك سيعمل تسجيل الدخول فورا وتثبيت التطبيق بسلاسة تامة!
            </p>
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-3 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-teal-600/10 active:scale-95 transition-all flex items-center justify-center gap-2 text-center cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>فتح الأداة في علامة تبويب مستقلة لتسجيل الدخول 🚀</span>
            </a>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-6 py-4 rounded-2xl shadow-lg shadow-teal-600/15 active:scale-95 transition-all text-base cursor-pointer"
            id="btn-login-gallery"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>تسجيل الدخول باستخدام جوجل</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in" id="gallery-tab-view">
      
      {/* Upper Grid: Upload Section (Left-ish/Right-ish depending on RTL) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="gallery-upper-grid">
        
        {/* Upload Card (Span 5) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6" id="upload-card">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-50">
            <Upload className="w-6 h-6 text-teal-600" />
            <h3 className="text-lg font-bold text-slate-800">رفع صورة جديدة للمستودع</h3>
          </div>

          {isApiKeyUsed && (
            <div className="p-4 bg-amber-50 border border-amber-200/60 rounded-2xl text-amber-950 text-xs font-semibold space-y-1.5" id="api-key-upload-warning">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 text-amber-600" />
                <span>الرفع معطل (وضع تصفح مفتاح API)</span>
              </div>
              <p className="leading-relaxed text-[11px] text-amber-800 font-medium">
                أنت تستخدم الأداة عبر مفتاح واجهة برمجة للتصفح وجلب الروابط فقط. لرفع وحذف وتعديل أسماء الصور مباشرة، ستحتاج لاستخدام زر تسجيل دخول جوجل النشط.
              </p>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-4" id="upload-form">
            {/* Folder Destination Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                المجلد المستهدف في جوجل درايف
                <span className="text-red-500">*</span>
              </label>
              {folders.length === 0 ? (
                <div className="text-amber-600 text-xs bg-amber-50 p-3 rounded-2xl border border-amber-100 flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>لم تقم بإضافة أي مجلد في الإعدادات بعد.</span>
                </div>
              ) : (
                <select
                  value={selectedUploadFolder}
                  onChange={(e) => setSelectedUploadFolder(e.target.value)}
                  disabled={isApiKeyUsed}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  id="select-upload-target-folder"
                >
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Drag & Drop File Upload Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">ملف الصورة</label>
              
              {!uploadPreview ? (
                <div
                  onDragOver={isApiKeyUsed ? undefined : handleDragOver}
                  onDrop={isApiKeyUsed ? undefined : handleDrop}
                  className={`border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-3 group ${isApiKeyUsed ? 'bg-slate-50/50 opacity-60 cursor-not-allowed border-slate-200' : 'hover:border-teal-400 bg-slate-50/50 hover:bg-teal-50/10 cursor-pointer'}`}
                  id="drop-zone"
                  onClick={isApiKeyUsed ? undefined : () => document.getElementById('gallery-file-input')?.click()}
                >
                  <div className="w-12 h-12 bg-white text-slate-400 group-hover:text-teal-600 group-hover:scale-110 rounded-2xl flex items-center justify-center shadow-xs transition-all border border-slate-100">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">اسحب الصورة وأفلتها هنا، أو اضغط للتصفح</p>
                    <p className="text-[10px] text-slate-400">يدعم صيغ الصور (PNG, JPG, JPEG, WEBP)</p>
                  </div>
                  <input
                    type="file"
                    id="gallery-file-input"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isApiKeyUsed}
                  />
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-150 bg-slate-100 h-48 group shadow-xs" id="upload-preview-container">
                  <img
                    src={uploadPreview}
                    alt="Upload preview"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => document.getElementById('gallery-file-input')?.click()}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg transition-all active:scale-95 shadow-sm"
                    >
                      تغيير الصورة
                    </button>
                    <button
                      type="button"
                      onClick={clearUpload}
                      className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all active:scale-95 shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Name input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                اسم الصورة في جوجل درايف
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="مثال: فستان صيفي حرير أحمر"
                  disabled={!uploadFile || isApiKeyUsed}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  id="input-upload-name"
                />
              </div>
              <p className="text-slate-400 text-[10px]">سيبقى امتداد الصورة الأصلي تلقائياً عند حفظها.</p>
            </div>

            {/* Error & Success Feedback */}
            {uploadError && (
              <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2 animate-shake" id="upload-error-banner">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2" id="upload-success-banner">
                <Check className="w-4.5 h-4.5 shrink-0" />
                <span>تم رفع وحفظ الصورة بنجاح وتحديث القائمة! 🎉</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isUploading || !uploadFile || folders.length === 0 || isApiKeyUsed}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-5 py-3.5 rounded-2xl shadow-lg shadow-teal-600/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-sm"
              id="btn-upload-save"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>جاري رفع الصورة لدرايف...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4.5 h-4.5" />
                  <span>حفظ ورفع الصورة فورا</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Description/Guide Column (Span 7) */}
        <div className="lg:col-span-7 bg-teal-50/40 rounded-3xl p-6 sm:p-8 border border-teal-50/80 flex flex-col justify-between gap-6" id="gallery-info-guide-card">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold" id="gallery-badge">
              <Folder className="w-3.5 h-3.5" />
              مستودع درايف السريع
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-teal-950 leading-tight">سهولة كاملة في إدارة ورفع صور متجرك</h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              هذا التبويب تم تصميمه خصيصاً ليغنيك عن فتح تطبيق Google Drive. يمكنك رفع أي صورة منتج من جهازك، تسميتها كما ترغب، وحفظها مباشرة بضغطة زر داخل أي مجلد مضاف في إعداداتك.
            </p>
            
            <div className="space-y-3 pt-2" id="gallery-features-checklist">
              <div className="flex items-start gap-2.5 text-slate-700 text-xs sm:text-sm font-semibold">
                <div className="w-5 h-5 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">١</div>
                <span>الرفع المباشر بأحجام ممتازة تحافظ على سرعة موقع متجرك.</span>
              </div>
              <div className="flex items-start gap-2.5 text-slate-700 text-xs sm:text-sm font-semibold">
                <div className="w-5 h-5 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">٢</div>
                <span>نسخ روابط صور سريعة وعالية الأداء (روابط CDN وجلب مباشر) متوافقة تماماً مع لوحة تحكم المتجر.</span>
              </div>
              <div className="flex items-start gap-2.5 text-slate-700 text-xs sm:text-sm font-semibold">
                <div className="w-5 h-5 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">٣</div>
                <span>إمكانية تعديل الأسماء أو الحذف الفوري للصورة من درايف مباشرة دون مغادرة الأداة.</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between gap-4 text-xs font-bold text-slate-500" id="gallery-sync-status">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>متصل بحساب درايف النشط</span>
            </div>
            <button
              onClick={loadImages}
              className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-extrabold"
              id="btn-manual-sync"
            >
              <RefreshCw className="w-4 h-4" />
              <span>تحديث البيانات يدوياً</span>
            </button>
          </div>
        </div>

      </div>

      {/* Underneath: Folders Tabs and Images Browser */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6" id="images-browser-section">
        
        {/* Header and horizontal scroll folders list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Folder className="w-5.5 h-5.5 text-teal-600" />
              <h3 className="text-base sm:text-lg font-black text-slate-800">مستعرض المجلدات والملفات</h3>
            </div>
            <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full" id="images-count-badge">
              عدد الصور بالمجلد الحالي: {images.length}
            </span>
          </div>

          {/* Folder tabs list */}
          {folders.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-4">لم تقم بضبط أي مجلدات في الإعدادات بعد.</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent -mx-2 px-2" id="folders-pills-list">
              {folders.map((folder) => {
                const isActive = activeFolder?.id === folder.id;
                return (
                  <button
                    key={folder.id}
                    onClick={() => setActiveFolder(folder)}
                    className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                      isActive 
                        ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-600/10 scale-[1.02]' 
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-150 text-slate-700'
                    }`}
                    id={`folder-pill-${folder.id}`}
                  >
                    <Folder className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-100' : 'text-slate-400'}`} />
                    <span>{folder.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Images Grid */}
        {isLoadingImages ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3" id="images-loading-container">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
            <p className="text-xs font-bold">جاري تحميل صور المجلد من درايف الخاص بك...</p>
          </div>
        ) : imageError ? (
          <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-center max-w-lg mx-auto my-4 space-y-3" id="images-error-container">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
            <p className="text-red-800 text-xs font-bold">{imageError}</p>
            <button
              onClick={loadImages}
              className="px-4 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-700 font-bold rounded-xl text-xs transition-all shadow-xs"
              id="btn-retry-load"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 gap-3" id="images-empty-container">
            <div className="w-14 h-14 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center border border-slate-100">
              <ImageIcon className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700">المجلد الحالي لا يحتوي على أي صور.</p>
              <p className="text-[10px] text-slate-400">يمكنك رفع أول صورة إلى هذا المجلد باستخدام نموذج الرفع أعلاه.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" id="images-browser-grid">
            {images.map((image) => {
              const isEditing = editingImageId === image.id;
              const isDeleting = deletingImageId === image.id;
              
              // Standard copy direct source link used for online stores (lh3 google cdn format is super reliable for store publishing)
              const cdnLink = `https://lh3.googleusercontent.com/d/${image.id}`;
              const directLink = `https://drive.google.com/uc?export=download&id=${image.id}`;

              return (
                <div
                  key={image.id}
                  className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 flex flex-col gap-4 hover:border-teal-300 hover:bg-white transition-all shadow-2xs group"
                  id={`image-card-${image.id}`}
                >
                  {/* Photo area */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-150 h-36 shrink-0" id={`image-photo-${image.id}`}>
                    {image.thumbnailLink ? (
                      <img
                        src={image.thumbnailLink.replace(/=s\d+/, '=s400')}
                        alt={image.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-all duration-300 cursor-zoom-in"
                        onClick={() => onPreviewImage(image)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                    
                    {/* Size indicator or helper */}
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-900/60 rounded-md text-[9px] text-white font-bold backdrop-blur-xs">
                      درايف
                    </div>
                  </div>

                  {/* Info area & actions */}
                  <div className="flex-1 flex flex-col justify-between gap-3" id={`image-info-${image.id}`}>
                    <div className="space-y-1">
                      {isEditing ? (
                        <div className="flex gap-1.5" id={`rename-box-${image.id}`}>
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 bg-white border border-teal-500 rounded-lg focus:outline-none text-xs font-bold text-slate-800"
                            id={`rename-input-${image.id}`}
                          />
                          <button
                            onClick={() => handleSaveRename(image)}
                            disabled={isUpdatingName}
                            className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs shrink-0"
                            id={`rename-btn-save-${image.id}`}
                          >
                            {isUpdatingName ? '...' : 'حفظ'}
                          </button>
                          <button
                            onClick={() => setEditingImageId(null)}
                            className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs"
                            id={`rename-btn-cancel-${image.id}`}
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2" id={`title-box-${image.id}`}>
                          <h4 className="text-xs sm:text-sm font-black text-slate-800 line-clamp-2 leading-relaxed flex-1">
                            {image.name}
                          </h4>
                          {!isApiKeyUsed && (
                            <button
                              onClick={() => handleStartRename(image)}
                              className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                              title="تعديل اسم الصورة"
                              id={`btn-edit-${image.id}`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Copy URLs fields */}
                    <div className="space-y-2 bg-slate-100/50 p-2.5 rounded-xl border border-slate-200/50" id={`copy-links-area-${image.id}`}>
                      {/* CDN Link */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-500">رابط متجر سريع (CDN):</span>
                        <button
                          onClick={() => handleCopyLink(image.id, 'cdn')}
                          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md transition-all active:scale-95 ${
                            copiedLinkId === image.id && copiedType === 'cdn'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-white border border-slate-200 text-teal-700 hover:bg-teal-50'
                          }`}
                          id={`btn-copy-cdn-${image.id}`}
                        >
                          {copiedLinkId === image.id && copiedType === 'cdn' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>تم نسخ الرابط!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>نسخ الرابط</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Direct Stream Link */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-500">رابط تنزيل مباشر:</span>
                        <button
                          onClick={() => handleCopyLink(image.id, 'direct')}
                          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md transition-all active:scale-95 ${
                            copiedLinkId === image.id && copiedType === 'direct'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-white border border-slate-200 text-teal-700 hover:bg-teal-50'
                          }`}
                          id={`btn-copy-direct-${image.id}`}
                        >
                          {copiedLinkId === image.id && copiedType === 'direct' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>تم نسخ الرابط!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>نسخ الرابط</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Bottom action panel */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100" id={`bottom-panel-${image.id}`}>
                      {/* Zoom button */}
                      <button
                        onClick={() => onPreviewImage(image)}
                        className="text-[11px] font-bold text-slate-500 hover:text-teal-600 flex items-center gap-1"
                        id={`btn-zoom-${image.id}`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>عرض الصورة مكبرة</span>
                      </button>

                      {/* Delete button */}
                      {!isApiKeyUsed && (
                        <button
                          onClick={() => handleDeleteImage(image)}
                          disabled={isDeleting}
                          className="text-[11px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded-md transition-all"
                          id={`btn-delete-${image.id}`}
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span>حذف</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
