import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-cream py-12 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-orange-600 hover:underline mb-6">
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </Link>

        <div className="bg-white rounded-2xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">سياسة الخصوصية 🔒</h1>
          <p className="text-gray-500 text-sm mb-8">آخر تحديث: أبريل 2026</p>

          <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3">1. المقدمة</h2>
              <p>
                نحن في نَكهة نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضّح هذه السياسة كيف نجمع ونستخدم ونحمي معلوماتك عند استخدام منصتنا.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3">2. البيانات التي نجمعها</h2>
              <p>نجمع البيانات التالية عند استخدامك لمنصة نَكهة:</p>
              <p className="mr-4">
                <strong>للطباخات:</strong> الاسم الكامل، البريد الإلكتروني، رقم الهاتف، الحي، الصور الشخصية وصور الأطباق، معلومات الدفع (BaridiMob).
              </p>
              <p className="mr-4">
                <strong>للزبائن:</strong> الاسم، رقم الهاتف، العنوان (اختياري)، سجل الطلبات والتقييمات.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3">3. كيف نستخدم بياناتك</h2>
              <p>نستخدم بياناتك فقط لتوفير خدمات المنصة، وتشمل: معالجة الطلبات وتوصيلها، التواصل بين الطباخات والزبائن، تحسين تجربة المستخدم، ومنع الاحتيال والأمان.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3">4. حماية البيانات</h2>
              <p>
                نستخدم تقنيات أمان متقدمة لحماية بياناتك، بما في ذلك التشفير عند النقل والتخزين، وأنظمة مصادقة آمنة (Firebase Authentication).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3">5. مشاركة البيانات</h2>
              <p>
                لا نبيع بياناتك الشخصية لأي طرف ثالث. قد نشارك بيانات محدودة مع: الطباخة المعنية بطلبك (اسمك ورقم هاتفك)، ومقدّمي الخدمات التقنية (Firebase, Cloudinary) لتشغيل المنصة.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3">6. حقوقك</h2>
              <p>يحق لك: طلب الاطلاع على بياناتك المخزّنة، طلب تعديل أو حذف بياناتك، إلغاء الاشتراك في المنصة في أي وقت. للتواصل بشأن بياناتك، راسلنا على: contact@nakha.dz</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3">7. ملفات تعريف الارتباط (Cookies)</h2>
              <p>
                نستخدم ملفات تعريف الارتباط وتقنيات مشابهة لحفظ تفضيلاتك (مثل محتويات السلة) وتحسين تجربة الاستخدام.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3">8. التحديثات</h2>
              <p>
                قد نحدّث هذه السياسة من وقت لآخر. ننصحك بمراجعتها بشكل دوري. عند إجراء تغييرات جوهرية، سنُعلمك عبر المنصة.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;