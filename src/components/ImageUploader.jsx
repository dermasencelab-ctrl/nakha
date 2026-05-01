import { useState, useRef } from 'react';
import { Upload, X, Loader, ImagePlus } from 'lucide-react';
import { uploadImage } from '../utils/cloudinary';

const ImageUploader = ({ value, onChange, folder = 'nakha', label = 'صورة' }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch (err) {
      setError(err.message || 'حدث خطأ');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
    setError('');
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-stone-700 mb-2 font-bold text-sm">{label}</label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {value ? (
        <div className="relative group rounded-2xl overflow-hidden">
          <img
            src={value}
            alt="معاينة"
            className="w-full h-48 object-cover"
          />
          {/* hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center gap-2.5 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleClick}
              disabled={uploading}
              className="flex items-center gap-1.5 bg-white text-stone-800 px-4 py-2 rounded-xl font-black text-xs hover:bg-stone-100 transition active:scale-95 shadow-lg"
            >
              <Upload className="w-3.5 h-3.5" strokeWidth={2.5} />
              تغيير
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="flex items-center gap-1.5 bg-red-500 text-white px-4 py-2 rounded-xl font-black text-xs hover:bg-red-600 transition active:scale-95 shadow-lg"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              حذف
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="w-full h-48 border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center hover:border-orange-400 hover:bg-orange-50/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {uploading ? (
            <>
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-3">
                <Loader className="w-6 h-6 text-orange-500 animate-spin" strokeWidth={2.3} />
              </div>
              <p className="text-stone-500 font-semibold text-sm">جاري الرفع...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-orange-50 group-hover:bg-orange-100 rounded-2xl flex items-center justify-center mb-3 transition-colors">
                <ImagePlus className="w-6 h-6 text-orange-500" strokeWidth={2.2} />
              </div>
              <p className="text-stone-700 font-black text-sm mb-1">اضغطي لرفع صورة</p>
              <p className="text-xs text-stone-400 font-semibold">PNG أو JPG — حتى 5 ميجابايت</p>
            </>
          )}
        </button>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-3 py-2.5 rounded-2xl text-xs font-semibold">
          <span>❌</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
