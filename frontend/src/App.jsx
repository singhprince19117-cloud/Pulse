import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Landing from './pages/Landing.jsx';
import { Login, Signup } from './pages/AuthPages.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Meeting from './pages/Meeting.jsx';
import History from './pages/History.jsx';
import Profile from './pages/Profile.jsx';
import Transcript from './pages/Transcript.jsx';
import NotFound from './pages/NotFound.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="grid min-h-screen place-items-center text-muted">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/meeting/:code" element={<Protected><Meeting /></Protected>} />
      <Route path="/transcript/:code" element={<Protected><Transcript /></Protected>} />
      <Route path="/history" element={<Protected><History /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
