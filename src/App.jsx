import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AuctionRoom from './pages/AuctionRoom';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import MyTeams from './pages/MyTeams';
import Profile from './pages/Profile';
import PlayerDatabase from './pages/PlayerDatabase';
import AuctionHistory from './pages/AuctionHistory';
import AdminPlayers from './pages/AdminPlayers';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-stitch"><div className="spinner-stitch"></div></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-stitch"><div className="spinner-stitch"></div></div>;
  if (user) return <Navigate to="/dashboard" />;
  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="create-room" element={<CreateRoom />} />
        <Route path="join-room" element={<JoinRoom />} />
        <Route path="room/:id" element={<AuctionRoom />} />
        <Route path="my-teams" element={<MyTeams />} />
        <Route path="profile" element={<Profile />} />
        <Route path="players" element={<PlayerDatabase />} />
        <Route path="history/:roomId" element={<AuctionHistory />} />
        <Route path="admin/players" element={<AdminPlayers />} />
      </Route>
    </Routes>
  );
}
