import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createContext, useContext, useState } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import RestaurantsPage from './pages/RestaurantsPage';
import BlogPage from './pages/BlogPage';
import CitiesPage from './pages/CitiesPage';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider } from './context/AuthContext';

// 1. Kayıp Bildirim (Toast) Altyapısını Geri Getiriyoruz
const ToastContext = createContext();

// Bütün uygulamanın aradığı o eksik export:
export const useGlobalToast = () => useContext(ToastContext);

export default function App() {
  // 2. Bildirim State'leri
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000); // 3 saniye sonra kaybolur
  };

  const toastHelpers = {
    info: (msg) => showToast(msg, 'info'),
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error'),
  };

  return (
    <ToastContext.Provider value={toastHelpers}>
      <Router>
        <AuthProvider>
          <Navbar />
          
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/restaurants" element={<RestaurantsPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/cities" element={<CitiesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>

          {/* Ekranda çıkacak zarif bildirim kutusu */}
          {toast && (
            <div className={`fixed bottom-6 right-6 z-[9999] px-6 py-4 rounded-2xl text-white font-bold shadow-2xl transition-all animate-fade-in-up flex items-center gap-3
              ${toast.type === 'success' ? 'bg-gv-emerald' : toast.type === 'error' ? 'bg-red-500' : 'bg-gv-orange'}`}>
              {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
              <span>{toast.msg}</span>
            </div>
          )}
          
        </AuthProvider>
      </Router>
    </ToastContext.Provider>
  );
}