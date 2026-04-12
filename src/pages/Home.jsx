import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ChefHat, Utensils, MessageCircle } from 'lucide-react';

function Home() {
  const [cooks, setCooks] = useState([]);

  useEffect(() => {
    const fetchCooks = async () => {
      const snapshot = await getDocs(collection(db, 'cooks'));
      const cooksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCooks(cooksData);
    };
    fetchCooks();
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary to-orange-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            نَكهة 🍲
          </h1>
          <p className="text-2xl md:text-3xl mb-8">
            اطلب أكل منزلي موثوق في بشار
          </p>
          <Link
            to="/cooks"
            className="inline-block bg-white text-primary px-10 py-4 rounded-full text-xl font-bold hover:bg-cream transition shadow-lg"
          >
            ابدأ الطلب
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-dark mb-12">
            كيف يعمل؟
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-md text-center">
              <ChefHat className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">1. اختر الطباخة</h3>
              <p className="text-gray-600">تصفح أفضل الطباخات المنزليات في بشار</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-md text-center">
              <Utensils className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">2. اختر وجبتك</h3>
              <p className="text-gray-600">شاهد الأطباق واختر ما يعجبك</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-md text-center">
              <MessageCircle className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">3. اطلب مباشرة</h3>
              <p className="text-gray-600">أرسل طلبك عبر واتساب بضغطة زر</p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Cooks */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-dark mb-12">
            أفضل الطباخات
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {cooks.map(cook => (
              <div key={cook.id} className="bg-cream rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition">
                <img src={cook.image} alt={cook.name} className="w-full h-56 object-cover" />
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-dark mb-2">{cook.name}</h3>
                  <p className="text-gray-600 mb-3">{cook.description}</p>
                  <span className="inline-block bg-primary text-white px-4 py-1 rounded-full text-sm">
                    {cook.cuisineType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-8 text-center">
        <p>© 2026 نَكهة - منصة الأكل المنزلي في بشار</p>
      </footer>
    </div>
  );
}

export default Home;
