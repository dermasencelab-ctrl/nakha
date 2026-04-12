import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const ADMIN_PASSWORD = "nakha2026"; // ⚠️ غيّر كلمة السر

function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('isAdmin', 'true');
      navigate('/admin/dashboard');
    } else {
      setError('كلمة السر خاطئة');
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <Lock className="w-16 h-16 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-dark">لوحة التحكم</h1>
          <p className="text-gray-600 mt-2">أدخل كلمة السر للدخول</p>
        </div>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة السر"
            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-primary outline-none mb-3"
          />
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition">
            دخول
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;