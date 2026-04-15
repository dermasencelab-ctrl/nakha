// إعدادات Cloudinary
const CLOUD_NAME = 'dozzyeh79';
const UPLOAD_PRESET = 'nakha_unsigned';

/**
 * يرفع صورة إلى Cloudinary ويرجّع الرابط المباشر
 * @param {File} file - ملف الصورة من input
 * @param {string} folder - اسم المجلد (اختياري، مثل 'dishes' أو 'cooks')
 * @returns {Promise<string>} رابط الصورة
 */
export const uploadImage = async (file, folder = 'nakha') => {
  if (!file) throw new Error('لا يوجد ملف للرفع');

  // التحقق من نوع الملف
  if (!file.type.startsWith('image/')) {
    throw new Error('يجب أن يكون الملف صورة');
  }

  // التحقق من الحجم (أقل من 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('حجم الصورة يجب أن يكون أقل من 5 ميغابايت');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', `nakha/${folder}`);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('فشل رفع الصورة');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('حدث خطأ أثناء رفع الصورة');
  }
};