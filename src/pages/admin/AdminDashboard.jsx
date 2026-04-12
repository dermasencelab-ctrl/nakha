import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, Utensils, LogOut, Home } from 'lucide-react';

function AdminDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('isAdmin');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-dark text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">لوحة تحكم نَكهة 🍲</h1>
        <div className="flex gap-2">
          <Link to="/" className="bg-white/10 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/20">
            <Home className="w-4 h-4" /> الموقع
          </Link>
          <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700">
            <LogOut className="w-4 h-4" /> خروج
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-dark mb-6">الإدارة</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Link to="/admin/cooks" className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition text-center">
            <ChefHat className="w-20 h-20 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-dark">إدارة الطباخات</h3>
            <p className="text-gray-600 mt-2">إضافة وتعديل وحذف الطباخات</p>
          </Link>
          <Link to="/admin/dishes" className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition text-center">
            <Utensils className="w-20 h-20 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-dark">إدارة الأطباق</h3>
            <p className="text-gray-600 mt-2">إضافة وتعديل وحذف الأطباق</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;