import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { DriveImage } from '../googleDrive';

interface ImagePreviewModalProps {
  image: DriveImage | null;
  onClose: () => void;
}

export default function ImagePreviewModal({ image, onClose }: ImagePreviewModalProps) {
  const [scale, setScale] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);

  React.useEffect(() => {
    if (image) {
      setScale(1);
      setRotation(0);
    }
  }, [image]);

  if (!image) return null;

  // Transform standard thumbnail link to high quality view link
  // Google Drive thumbnail link is usually formatted as: https://lh3.googleusercontent.com/...=s220
  // Or: https://drive.google.com/thumbnail?id=FILE_ID&sz=w220
  const highResUrl = image.id 
    ? `https://drive.google.com/thumbnail?id=${image.id}&sz=w1200`
    : image.thumbnailLink;

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation(prev => (prev + 90) % 360);
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        onClick={onClose}
        id="preview-modal-overlay"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
          id="preview-modal-container"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-slate-800 text-white border-b border-slate-700">
            <h3 className="font-semibold text-base truncate max-w-[70%]" id="preview-image-title">
              {image.name}
            </h3>
            
            <div className="flex items-center gap-2">
              {/* Controls */}
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-slate-300"
                title="تصغير"
                id="btn-zoom-out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-slate-300"
                title="تكبير"
                id="btn-zoom-in"
              >
                <ZoomIn className="w-5 h-5" />
              </button>

              <button
                onClick={handleRotate}
                className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-slate-300 animate-none"
                title="تدوير"
                id="btn-rotate"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              <div className="w-[1px] h-6 bg-slate-700 mx-1"></div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-white"
                id="btn-close-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center p-6 min-h-[300px] overflow-auto bg-slate-950">
            <div className="relative overflow-hidden flex items-center justify-center max-h-[60vh] max-w-full">
              <motion.img
                src={highResUrl}
                alt={image.name}
                referrerPolicy="no-referrer"
                animate={{
                  scale: scale,
                  rotate: rotation,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="max-h-[60vh] max-w-full object-contain rounded shadow-lg select-none"
                id="preview-target-image"
              />
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-3 bg-slate-800 text-slate-400 text-xs text-center border-t border-slate-700" id="preview-modal-footer">
            انقر في أي مكان خارج الصورة أو على زر الإغلاق للعودة
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
