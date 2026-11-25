import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Browse from './pages/Browse';
import CampaignDetail from './pages/CampaignDetail';
import CampaignForm from './pages/CampaignForm';
import CreatorDashboard from './pages/CreatorDashboard';
import MyPledges from './pages/MyPledges';
import Admin from './pages/Admin';
import { Login, Register } from './pages/Auth';
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <a href="#main" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Browse />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/campaigns/new" element={<ProtectedRoute roles={['creator']}><CampaignForm /></ProtectedRoute>} />
          <Route path="/campaigns/:id/edit" element={<ProtectedRoute roles={['creator', 'admin']}><CampaignForm /></ProtectedRoute>} />
          <Route path="/campaigns/:id" element={<CampaignDetail />} />

          <Route path="/dashboard" element={<ProtectedRoute roles={['creator']}><CreatorDashboard /></ProtectedRoute>} />
          <Route path="/my-pledges" element={<ProtectedRoute roles={['supporter']}><MyPledges /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Admin /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
