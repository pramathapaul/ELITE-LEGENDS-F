import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { motion } from 'framer-motion';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const { data } = await authAPI.updateProfile({ username });
      updateUser(data);
      setMessage('Profile updated successfully');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <span className="material-symbols-outlined text-primary" style={{fontSize: '28px'}}>person</span>
          <h1 className="font-headline-lg text-on-surface">Profile</h1>
        </div>

        <div className="glass-panel p-8 rounded-xl">
          <div className="text-center mb-8">
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), rgba(242,202,80,0.3))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', fontWeight: 900, color: 'var(--on-primary)',
              margin: '0 auto 16px',
              fontFamily: 'var(--font-display)',
              boxShadow: '0 0 30px rgba(242,202,80,0.3)',
            }}>
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <h2 className="font-headline-sm text-on-surface">{user?.username}</h2>
            <p className="font-body-md text-on-surface-variant mt-1">{user?.email}</p>
          </div>

          {message && (
            <div className="glass-panel p-4 mb-6 flex items-center gap-3" style={{
              borderColor: message.includes('success') ? 'rgba(46,204,113,0.3)' : 'rgba(255,180,171,0.3)'
            }}>
              <span className="material-symbols-outlined" style={{
                fontSize: '18px',
                color: message.includes('success') ? '#2ecc71' : 'var(--error)'
              }}>
                {message.includes('success') ? 'check_circle' : 'error_outline'}
              </span>
              <span className="font-body-md" style={{
                color: message.includes('success') ? '#2ecc71' : 'var(--error)'
              }}>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="font-label-caps text-on-surface-variant block mb-2">Username</label>
              <input type="text" className="input-glass-plain px-4 py-3 rounded-lg w-full"
                value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
            </div>
            <div>
              <label className="font-label-caps text-on-surface-variant block mb-2">Email</label>
              <input type="email" className="input-glass-plain px-4 py-3 rounded-lg w-full"
                value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
            </div>
            <button type="submit" className="btn-primary-glow w-full rounded-xl" disabled={loading}>
              {loading && <span className="spinner-stitch" style={{width: 18, height: 18, borderWidth: 2}}></span>}
              {loading ? 'SAVING...' : 'UPDATE PROFILE'}
              <span className="material-symbols-outlined" style={{fontSize: '18px'}}>save</span>
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
