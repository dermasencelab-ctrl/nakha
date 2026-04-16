import { Link } from 'react-router-dom';
import { ChefHat, ShoppingBag, Star, Users, MapPin, Heart } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-cream" dir="rtl">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-orange-600 to-orange-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">🍲 نَكهة</h1>
          <p className="text-xl text-white/90 mb-2">منصة الأكل المنزلي الأولى في بشار</p>
          <p className="text-white/80">نربط بين الطباخات الموهوبات والزبائن اللي يبحثون عن أكل منزلي لذيذ وصحي</p>
        </div>
      </section>

      {/* القصة */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">قصتنا</h2>
          <div className="bg-white rounded-2xl shadow-md p-8">
            <p className="text-gray-700 leading-relaxed text-lg mb-4">
              نَكهة وُلدت من فكرة بسيطة: كل حي في بشار فيه طباخة ماهرة تطبخ أكل لذيذ لعائلتها. ليش ما نشاركه مع الجيران والمجتمع؟
            </p>
            <p className="text-gray-700 leading-relaxed text-lg mb-4">
              نحن نؤمن أن الأكل المنزلي هو أفضل أكل — مطبوخ بحب، بمكونات طازجة، وبوصفات تقليدية توارثتها الأجيال.
            </p>
            <p className="text-gray-700 leading-relaxed text-lg">
              هدفنا هو تمكين الطباخات في بشار من تحويل موهبتهن إلى مصدر دخل، وتوفير أكل منزلي لذيذ وموثوق للجميع.
            </p>
          </div>
        </div>
      </section>

      {/* كيف نعمل */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-10 text-center">كيف نعمل؟</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">للطباخات</h3>
              <p className="text-gray-600">سجّلي حسابك، أضيفي أطباقك، واستقبلي الطلبات مباشرة من جوالك</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">للزبائن</h3>
              <p className="text-gray-600">تصفّح الطباخات، اختر أطباقك المفضلة، واطلب بسهولة تامة</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">جودة مضمونة</h3>
              <p className="text-gray-600">كل طباخة موثّقة ومراجَعة، مع نظام تقييمات شفاف من الزبائن</p>
            </div>
          </div>
        </div>
      </section>

      {/* أرقام */}
      <section className="py-16 px-4 bg-gradient-to-r from-orange-600 to-primary text-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-center">نَكهة بالأرقام</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <Users className="w-10 h-10 mx-auto mb-2 text-white/80" />
              <p className="text-4xl font-bold">🇩🇿</p>
              <p className="text-white/90 mt-1">مدينة بشار</p>
            </div>
            <div className="text-center">
              <ChefHat className="w-10 h-10 mx-auto mb-2 text-white/80" />
              <p className="text-4xl font-bold">👩‍🍳</p>
              <p className="text-white/90 mt-1">طباخات موثوقات</p>
            </div>
            <div className="text-center">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-white/80" />
              <p className="text-4xl font-bold">🍽️</p>
              <p className="text-white/90 mt-1">أطباق متنوعة</p>
            </div>
            <div className="text-center">
              <Heart className="w-10 h-10 mx-auto mb-2 text-white/80" />
              <p className="text-4xl font-bold">❤️</p>
              <p className="text-white/90 mt-1">مطبوخ بحب</p>
            </div>
          </div>
        </div>
      </section>

      {/* تواصل */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">تواصل معنا</h2>
          <p className="text-gray-600 mb-8">عندك سؤال أو اقتراح؟ نحب نسمع منك!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:contact@nakha.dz"
              className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition inline-flex items-center justify-center gap-2"
            >
              📧 راسلنا بالبريد
            </a>
            <Link
              to="/cook/signup"
              className="bg-white border-2 border-orange-600 text-orange-600 px-8 py-3 rounded-xl font-bold hover:bg-orange-50 transition inline-flex items-center justify-center gap-2"
            >
              👩‍🍳 انضمي كطباخة
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;