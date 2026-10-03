import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home/Home'; // Eagerly loaded for instant first paint
import AdminRoute from './components/AdminRoute/AdminRoute';
import { AuthProvider } from './context/AuthContext';

// Code-split secondary pages and admin dashboard to optimize initial load
const About = lazy(() => import('./pages/About/About'));
const Story = lazy(() => import('./pages/Story/Story'));
const Memories = lazy(() => import('./pages/Memories/Memories'));
const Gallery = lazy(() => import('./pages/Gallery/Gallery'));
const Members = lazy(() => import('./pages/Members/Members'));
const MemberProfile = lazy(() => import('./pages/MemberProfile/MemberProfile'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));
const AdminLogin = lazy(() => import('./pages/Admin/Login'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));

function AppContent() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <>
      <ScrollToTop />
      {!isAdminPath && <Navbar />}
      <Suspense fallback={null}>
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
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
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
