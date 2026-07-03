import React from 'react';
import { 
  FolderPlus, 
  Trash2, 
  ExternalLink, 
  Save, 
  HelpCircle, 
  Check, 
  AlertCircle,
  MessageCircle,
  Smartphone,
  BookOpen
} from 'lucide-react';
import { Settings, FolderConfig, ClosingMessagePreset } from '../types';
import { CLOSING_MESSAGE_PRESETS } from '../presets';
import { extractFolderId } from '../googleDrive';

interface SettingsTabProps {
  settings: Settings;
  onSaveSettings: (settings: Settings) => void;
}

export default function SettingsTab({ settings, onSaveSettings }: SettingsTabProps) {
  const [folders, setFolders] = React.useState<FolderConfig[]>(settings.folders);
  const [whatsappChannelLink, setWhatsappChannelLink] = React.useState(settings.whatsappChannelLink);
  const [whatsappOrderLink, setWhatsappOrderLink] = React.useState(settings.whatsappOrderLink);
  const [closingMessage, setClosingMessage] = React.useState(settings.closingMessage);
  const [googleDriveApiKey, setGoogleDriveApiKey] = React.useState(settings.googleDriveApiKey || '');
  
  // Local state for adding a folder
  const [newFolderName, setNewFolderName] = React.useState('');
  const [newFolderLink, setNewFolderLink] = React.useState('');
  const [folderError, setFolderError] = React.useState('');
  const [showSavedToast, setShowSavedToast] = React.useState(false);

  // Apply a preset message
  const handleSelectPreset = (preset: ClosingMessagePreset) => {
    setClosingMessage(preset.text);
  };

  // Add folder to local state
  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    setFolderError('');

    if (!newFolderName.trim()) {
      setFolderError('يرجى إدخال اسم المجلد.');
      return;
    }
    if (!newFolderLink.trim()) {
      setFolderError('يرجى إدخال رابط أو معرف مجلد جوجل درايف.');
      return;
    }

    const folderId = extractFolderId(newFolderLink);
    if (!folderId) {
      setFolderError('رابط مجلد جوجل درايف غير صالح. تأكد من نسخ الرابط بشكل صحيح.');
      return;
    }

    // Check if folder ID already exists
    if (folders.some(f => f.id === folderId)) {
      setFolderError('هذا المجلد مضاف بالفعل.');
      return;
    }

    const newFolder: FolderConfig = {
      id: folderId,
      name: newFolderName.trim(),
      link: newFolderLink.trim()
    };

    setFolders([...folders, newFolder]);
    setNewFolderName('');
    setNewFolderLink('');
  };

  // Remove folder from local state
  const handleRemoveFolder = (id: string, name: string) => {
    const confirmed = window.confirm(`هل أنت متأكد من حذف مجلد "${name}" من الإعدادات؟`);
    if (confirmed) {
      setFolders(folders.filter(f => f.id !== id));
    }
  };

  // Save all settings to parent state (which saves to localStorage)
  const handleSaveAll = () => {
    const updatedSettings: Settings = {
      folders,
      whatsappChannelLink: whatsappChannelLink.trim(),
      whatsappOrderLink: whatsappOrderLink.trim(),
      closingMessage: closingMessage.trim(),
      googleDriveApiKey: googleDriveApiKey.trim()
    };

    onSaveSettings(updatedSettings);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in" id="settings-tab-view">
      
      {/* Toast Notification */}
      {showSavedToast && (
        <div className="fixed bottom-5 left-5 z-50 bg-emerald-600 text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 font-bold border border-emerald-500/20 animate-bounce" id="saved-toast">
          <Check className="w-5 h-5 text-emerald-100" />
          <span>تم حفظ جميع الإعدادات بنجاح! 🎉</span>
        </div>
      )}

      {/* Intro info card */}
      <div className="bg-gradient-to-br from-teal-900 to-emerald-950 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6" id="settings-welcome-card">
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">إعدادات متجرك والمشاركة السريعة</h2>
          <p className="text-teal-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
            من هنا يمكنك ضبط روابط مجلدات درايف الخاصة بمنتجاتك وتخزين روابط واتساب الخاصة بالمتجر لتنسيق رسائل تسويقية احترافية ومشاركتها في ثوانٍ.
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          className="flex items-center gap-2 bg-white text-teal-950 hover:bg-teal-50 px-5 py-3 rounded-2xl font-extrabold text-sm sm:text-base shadow-lg transition-all active:scale-95 shrink-0"
          id="btn-save-settings-hero"
        >
          <Save className="w-5 h-5 text-teal-700" />
          <span>حفظ التغييرات</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="settings-sections-grid">
        
        {/* Left Column - Store Connections & Links (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Main Links Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6" id="store-links-config">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-50">
              <MessageCircle className="w-6 h-6 text-teal-600" />
              <h3 className="text-lg font-bold text-slate-800">روابط منصات المتجر والتواصل</h3>
            </div>

            <div className="space-y-5">
              {/* WhatsApp Channel Link */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                  رابط قناة المتجر على الواتساب
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={whatsappChannelLink}
                    onChange={(e) => setWhatsappChannelLink(e.target.value)}
                    placeholder="https://whatsapp.com/channel/..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm font-medium pl-10"
                    id="input-wa-channel"
                  />
                  <div className="absolute left-3.5 top-3.5 text-slate-400 text-xs font-mono">Channel</div>
                </div>
                <p className="text-slate-400 text-xs">
                  سيظهر هذا الرابط تلقائياً تحت عبارة "قناة متجر أم روح على واتساب"
                </p>
              </div>

              {/* WhatsApp Order Link / Phone */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
                  رابط طلب المنتج عبر الواتساب
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={whatsappOrderLink}
                    onChange={(e) => setWhatsappOrderLink(e.target.value)}
                    placeholder="https://wa.me/967..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm font-medium pl-10"
                    id="input-wa-order"
                  />
                  <div className="absolute left-3.5 top-3.5 text-slate-400 text-xs font-mono">wa.me</div>
                </div>
                <p className="text-slate-400 text-xs">
                  يمكنك استخدام صيغة رابط الواتساب المباشر لرقم هاتفك، مثلاً: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">https://wa.me/967XXXXXXXXX</code>
                </p>
              </div>
            </div>
          </div>

          {/* Elegant closing message editor */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6" id="closing-message-config">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-50">
              <BookOpen className="w-6 h-6 text-teal-600" />
              <h3 className="text-lg font-bold text-slate-800">رسالة تذييل المنتج (الخاتمة الأنيقة)</h3>
            </div>

            <div className="space-y-4">
              <p className="text-slate-500 text-xs leading-relaxed">
                اختر رسالة شكر وتقدير تعبر عن جودة منتجاتكم لدمجها تلقائياً في نهاية منشورات الواتساب:
              </p>

              {/* Preset buttons */}
              <div className="flex flex-wrap gap-2" id="preset-buttons-container">
                {CLOSING_MESSAGE_PRESETS.map((preset) => {
                  const isSelected = closingMessage === preset.text;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`text-xs px-3.5 py-2 rounded-xl border transition-all font-semibold ${
                        isSelected 
                          ? 'bg-teal-50 border-teal-200 text-teal-700 font-bold shadow-xs' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                      id={`preset-btn-${preset.id}`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Editor text area */}
              <div className="space-y-1.5">
                <textarea
                  value={closingMessage}
                  onChange={(e) => setClosingMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm font-medium leading-relaxed"
                  placeholder="اكتب رسالتك المخصصة هنا..."
                  id="textarea-closing-msg"
                />
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>سيتم دمج هذه الخاتمة في أسفل الرسالة تلقائياً.</span>
                  <span className="font-mono">{closingMessage.length} حرف</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Google Drive Folders Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Google Drive API Key Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6" id="api-key-config">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-50">
              <svg className="w-6 h-6 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
              <h3 className="text-lg font-bold text-slate-800">تصفح درايف دون تسجيل دخول (اختياري)</h3>
            </div>

            <div className="space-y-4">
              <p className="text-slate-500 text-xs leading-relaxed">
                إذا قمت بضبط مجلدات درايف لتكون <strong className="text-teal-700">"عامة - التحرير لمن لديه الرابط"</strong>، يمكنك إدخال مفتاح API لمتصفح جوجل هنا لتصفح وعرض الصور فورا دون الحاجة لربط حساب أو تسجيل الدخول بجوجل في كل مرة.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">مفتاح واجهة برمجة جوجل درايف (Google Drive API Key)</label>
                <input
                  type="password"
                  value={googleDriveApiKey}
                  onChange={(e) => setGoogleDriveApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-xs font-mono"
                  id="input-gdrive-api-key"
                />
              </div>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                * وضع مفتاح API يدعم عرض الصور ونسخ الروابط فقط. للرفع، الحذف، أو تعديل الأسماء مباشرة من الأداة، ستحتاج لاستخدام زر تسجيل دخول جوجل القياسي.
              </p>
            </div>
          </div>

          {/* Add Folder Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6" id="add-folders-config">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-50">
              <FolderPlus className="w-6 h-6 text-teal-600" />
              <h3 className="text-lg font-bold text-slate-800">إضافة مجلد منتجات جديد</h3>
            </div>

            <form onSubmit={handleAddFolder} className="space-y-4" id="add-folder-form">
              {folderError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-2xl text-xs font-semibold flex items-center gap-2 border border-red-100" id="folder-error-alert">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{folderError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">اسم المجلد (مثال: فساتين، عبايات)</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="اسم يسهل عليك معرفة المحتوى"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm font-semibold"
                  id="input-new-folder-name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">رابط المجلد أو معرفه على درايف</label>
                <input
                  type="text"
                  value={newFolderLink}
                  onChange={(e) => setNewFolderLink(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-sm font-medium"
                  id="input-new-folder-link"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                id="btn-add-folder-submit"
              >
                <FolderPlus className="w-4 h-4" />
                <span>إضافة إلى قائمتي</span>
              </button>
            </form>
          </div>

          {/* Configured Folders List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4" id="folders-list-config">
            <h4 className="text-sm font-bold text-slate-800">مجلدات درايف المضافة ({folders.length})</h4>
            
            {folders.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2 border-2 border-dashed border-slate-100 rounded-2xl" id="no-folders-placeholder">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">لم تقم بإضافة أي مجلدات حتى الآن.</p>
                <p className="text-[10px] text-slate-400">أضف مجلدات في النموذج أعلاه لتتمكن من تصفح صورها.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1" id="folders-scroll-area">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/70 transition-colors group"
                    id={`folder-item-${folder.id}`}
                  >
                    <div className="min-w-0 flex-1 pl-2">
                      <p className="text-sm font-bold text-slate-700 truncate">{folder.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate" title={folder.id}>ID: {folder.id}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={folder.link.startsWith('http') ? folder.link : `https://drive.google.com/drive/folders/${folder.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-white transition-all"
                        title="فتح في جوجل درايف"
                        id={`btn-open-folder-drive-${folder.id}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleRemoveFolder(folder.id, folder.name)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white transition-all"
                        title="حذف المجلد"
                        id={`btn-delete-folder-${folder.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Persistent action bar at bottom of settings */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100" id="settings-footer-actions">
        <button
          onClick={handleSaveAll}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
          id="btn-save-settings-footer"
        >
          <Save className="w-5 h-5 text-teal-100" />
          <span>حفظ التغييرات بالكامل</span>
        </button>
      </div>

    </div>
  );
}
