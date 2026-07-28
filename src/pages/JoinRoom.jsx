import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomAPI } from '../services/api';
import { motion } from 'framer-motion';

export default function JoinRoom() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Room code is required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await roomAPI.join(code.toUpperCase());
      navigate(`/room/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <span className="material-symbols-outlined text-primary mb-4 inline-block" style={{fontSize: '48px'}}>meeting_room</span>
          <h1 className="font-headline-lg text-on-surface">Join Room</h1>
          <p className="font-body-md text-on-surface-variant mt-2">Enter the room code to join an auction</p>
        </div>

        {error && (
          <div className="glass-panel p-4 mb-6 flex items-center gap-3" style={{borderColor: 'rgba(255,180,171,0.3)'}}>
            <span className="material-symbols-outlined text-error" style={{fontSize: '18px'}}>error_outline</span>
            <span className="font-body-md text-error">{error}</span>
          </div>
        )}

        <div className="glass-panel p-6 md:p-8 rounded-xl">
          <form onSubmit={handleSubmit} className="flex flex-col items-center">
            <label className="font-label-caps text-on-surface-variant block mb-3 text-center w-full">Room Code</label>
            <input
              type="text"
              className="input-glass-plain text-center px-4 py-4 rounded-xl w-full"
              style={{
                fontSize: 'clamp(28px, 5vw, 42px)',
                fontWeight: 800,
                letterSpacing: '14px',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
                padding: '20px 16px'
              }}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="------"
              maxLength={6}
              required
            />
            <p className="font-body-md text-on-surface-variant text-center mt-4 mb-6 opacity-60">
              Enter the 6-character room code shared by the admin
            </p>
            <button type="submit" className="btn-primary-glow w-full rounded-xl" disabled={loading}>
              {loading && <span className="spinner-stitch" style={{width: 18, height: 18, borderWidth: 2}}></span>}
              {loading ? 'JOINING...' : 'JOIN ROOM'}
              <span className="material-symbols-outlined" style={{fontSize: '18px'}}>login</span>
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
