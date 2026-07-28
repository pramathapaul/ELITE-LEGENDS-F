import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomAPI } from '../services/api';
import { motion } from 'framer-motion';

export default function CreateRoom() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [settings, setSettings] = useState({
    maxParticipants: 10,
    squadSize: 30,
    startingBudget: 500000000,
    auctionTimer: 30,
    bidIncrement: 2000000,
    bidIncrementType: 'fixed',
    auctionOrder: 'random',
    spectatorMode: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Room name is required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await roomAPI.create({ name, settings });
      navigate(`/room/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <span className="material-symbols-outlined text-primary" style={{fontSize: '28px'}}>add_circle</span>
          <h1 className="font-headline-lg text-on-surface">Create Auction Room</h1>
        </div>

        {error && (
          <div className="glass-panel p-4 mb-6 flex items-center gap-3" style={{borderColor: 'rgba(255,180,171,0.3)'}}>
            <span className="material-symbols-outlined text-error" style={{fontSize: '18px'}}>error_outline</span>
            <span className="font-body-md text-error">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Details */}
          <div className="glass-panel p-6 md:p-8 rounded-xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary" style={{fontSize: '18px'}}>info</span>
              <h2 className="font-headline-sm text-on-surface">Room Details</h2>
            </div>
            <div>
              <label className="font-label-caps text-on-surface-variant block mb-2">Room Name</label>
              <input
                type="text"
                className="input-glass-plain px-4 py-3 rounded-lg"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Friday Night Auction"
                required
              />
            </div>
          </div>

          {/* Auction Settings */}
          <div className="glass-panel p-6 md:p-8 rounded-xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary" style={{fontSize: '18px'}}>tune</span>
              <h2 className="font-headline-sm text-on-surface">Auction Settings</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="font-label-caps text-on-surface-variant block mb-2">Max Participants</label>
                <input type="number" min={2} max={50}
                  className="input-glass-plain px-4 py-3 rounded-lg"
                  value={settings.maxParticipants}
                  onChange={(e) => handleChange('maxParticipants', parseInt(e.target.value))} />
              </div>
              <div>
                <label className="font-label-caps text-on-surface-variant block mb-2">Total Players</label>
                <input type="number" min={5} max={80}
                  className="input-glass-plain px-4 py-3 rounded-lg"
                  value={settings.squadSize}
                  onChange={(e) => handleChange('squadSize', parseInt(e.target.value))} />
              </div>
              <div>
                <label className="font-label-caps text-on-surface-variant block mb-2">Starting Budget ($)</label>
                <input type="number" min={50000000}
                  className="input-glass-plain px-4 py-3 rounded-lg"
                  value={settings.startingBudget}
                  onChange={(e) => handleChange('startingBudget', parseInt(e.target.value))} />
              </div>
              <div>
                <label className="font-label-caps text-on-surface-variant block mb-2">Auction Timer (s)</label>
                <input type="number" min={10} max={120}
                  className="input-glass-plain px-4 py-3 rounded-lg"
                  value={settings.auctionTimer}
                  onChange={(e) => handleChange('auctionTimer', parseInt(e.target.value))} />
              </div>
              <div>
                <label className="font-label-caps text-on-surface-variant block mb-2">Bid Increment ($)</label>
                <input type="number" min={500000}
                  className="input-glass-plain px-4 py-3 rounded-lg"
                  value={settings.bidIncrement}
                  onChange={(e) => handleChange('bidIncrement', parseInt(e.target.value))} />
              </div>
              <div>
                <label className="font-label-caps text-on-surface-variant block mb-2">Increment Type</label>
                <select className="select-glass"
                  value={settings.bidIncrementType}
                  onChange={(e) => handleChange('bidIncrementType', e.target.value)}>
                  <option value="fixed">Fixed</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>
              <div>
                <label className="font-label-caps text-on-surface-variant block mb-2">Auction Order</label>
                <select className="select-glass"
                  value={settings.auctionOrder}
                  onChange={(e) => handleChange('auctionOrder', e.target.value)}>
                  <option value="random">Random</option>
                  <option value="rating_desc">Rating (High to Low)</option>
                  <option value="rating_asc">Rating (Low to High)</option>
                  <option value="position">By Position</option>
                </select>
              </div>
              <div>
                <label className="font-label-caps text-on-surface-variant block mb-2">Spectator Mode</label>
                <select className="select-glass"
                  value={settings.spectatorMode}
                  onChange={(e) => handleChange('spectatorMode', e.target.value === 'true')}>
                  <option value={false}>Disabled</option>
                  <option value={true}>Enabled</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary-glow w-full rounded-xl" disabled={loading}>
            {loading && <span className="spinner-stitch" style={{width: 18, height: 18, borderWidth: 2}}></span>}
            {loading ? 'CREATING...' : 'CREATE ROOM'}
            <span className="material-symbols-outlined" style={{fontSize: '18px'}}>arrow_forward</span>
          </button>
        </form>
      </div>
    </motion.div>
  );
}
