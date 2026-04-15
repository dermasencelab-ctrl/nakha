import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react';
import { uploadImage } from '../utils/cloudinary';

/**
 * مكوّن رفع صورة مع preview
 * @param {string} value - رابط الصورة الحالي
 * @param {function} onChange - دالة تستدعى عند تغيير الصورة (تمرّر الرابط الجديد)
 * @param {string} folder - اسم مجلد Cloudinary (مثل 'dishes')
 * @param {string} label - نص فوق الحقل
 */
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
      // إعادة تعيين input عشان نقدر نرفع نفس الصورة مرة ثانية
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
        <label className="block text-gray-700 mb-2 font-medium">{label}</label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {value ? (
        // عرض الصورة المرفوعة
        <div className="relative group">
          <img
            src={value}
            alt="معاينة"
            className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleClick}
              disabled={uploading}
              className="bg-white text-gray-800 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-100"
            >
              تغيير
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-700"
            >
              حذف
            </button>
          </div>
        </div>
      ) : (
        // منطقة الرفع
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-orange-400 hover:bg-orange-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader className="w-10 h-10 text-orange-500 animate-spin mb-2" />
              <p className="text-gray-600 font-medium">جاري الرفع...</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                <Upload className="w-7 h-7 text-orange-500" />
              </div>
              <p className="text-gray-700 font-medium mb-1">اضغط لرفع صورة</p>
              <p className="text-xs text-gray-500">PNG, JPG حتى 5MB</p>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
          ❌ {error}
        </p>
      )}
    </div>
  );
};

export default ImageUploader;