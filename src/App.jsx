import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Story from './pages/Story/Story';
import Memories from './pages/Memories/Memories';
import Gallery from './pages/Gallery/Gallery';
import Members from './pages/Members/Members';
import MemberProfile from './pages/MemberProfile/MemberProfile';
import NotFound from './pages/NotFound/NotFound';
import AdminLogin from './pages/Admin/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminRoute from './components/AdminRoute/AdminRoute';
import { AuthProvider } from './context/AuthContext';

function AppContent() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <>
      <ScrollToTop />
      {!isAdminPath && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/story" element={<Story />} />
        <Route path="/memories" element={<Memories />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/members" element={<Members />} />
        <Route path="/members/:memberId" element={<MemberProfile />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAdminPath && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
