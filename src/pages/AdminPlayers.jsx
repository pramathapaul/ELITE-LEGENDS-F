import { useState, useEffect, useRef } from 'react';
import { playerAPI } from '../services/api';
import { motion } from 'framer-motion';
import { getPlayerImageUrl } from '../utils/playerImage';

export default function AdminPlayers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [form, setForm] = useState({
    name: '', nickname: '', country: '', position: 'Midfielder',
    preferredFoot: 'Right', overall: 85, basePrice: 10000000,
    peakClub: '', rarity: 'Legend', description: '',
    image: '', worldCupWinner: false, ballonDor: 0, championsLeague: 0,
    leagueTitles: 0, internationalCaps: 0, internationalGoals: 0,
    ageAtRetirement: 35, height: '', weight: '', jerseyNumber: 10,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageStats, setImageStats] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPlayers();
  }, [search]);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (search) params.search = search;
      const { data } = await playerAPI.getAll(params);
      setPlayers(data.players || data);
    } catch {}
    setLoading(false);
  };

  const fetchImageStats = async () => {
    try {
      const { data } = await playerAPI.getImageStats();
      setImageStats(data);
    } catch {}
  };

  const handleDownloadMissing = async () => {
    setDownloadProgress({ completed: 0, total: '...', current: 'Starting...' });
    try {
      await playerAPI.downloadMissing();
      setMessage('Download started in background');
      const interval = setInterval(async () => {
        try {
          const { data } = await playerAPI.getImageStats();
          setImageStats(data);
          setDownloadProgress(prev => prev ? { ...prev, total: data.pending + data.downloading + data.ready + data.failed } : null);
          if (data.downloading === 0) {
            clearInterval(interval);
            setDownloadProgress(null);
            setMessage('All images processed');
            fetchPlayers();
          }
        } catch {}
      }, 2000);
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.message || err.message));
      setDownloadProgress(null);
    }
  };

  const handleRetryFailed = async () => {
    try {
      const { data } = await playerAPI.retryFailed();
      setMessage(data.message);
      fetchImageStats();
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    fetchImageStats();
  }, []);

  const openCreate = () => {
    setEditPlayer(null);
    setForm({
      name: '', nickname: '', country: '', position: 'Midfielder',
      preferredFoot: 'Right', overall: 85, basePrice: 10000000,
      peakClub: '', rarity: 'Legend', description: '',
      image: '', worldCupWinner: false, ballonDor: 0, championsLeague: 0,
      leagueTitles: 0, internationalCaps: 0, internationalGoals: 0,
      ageAtRetirement: 35, height: '', weight: '', jerseyNumber: 10,
    });
    setShowModal(true);
  };

  const openEdit = (player) => {
    setEditPlayer(player);
    setForm({
      name: player.name || '',
      nickname: player.nickname || '',
      country: player.country || '',
      position: player.position || 'Midfielder',
      preferredFoot: player.preferredFoot || 'Right',
      overall: player.overall || 85,
      basePrice: player.basePrice || 10000000,
      peakClub: player.peakClub || '',
      rarity: player.rarity || 'Legend',
      description: player.description || '',
      image: player.image || '',
      worldCupWinner: player.worldCupWinner || false,
      ballonDor: player.ballonDor || 0,
      championsLeague: player.championsLeague || 0,
      leagueTitles: player.leagueTitles || 0,
      internationalCaps: player.internationalCaps || 0,
      internationalGoals: player.internationalGoals || 0,
      ageAtRetirement: player.ageAtRetirement || 35,
      height: player.height || '',
      weight: player.weight || '',
      jerseyNumber: player.jerseyNumber || 10,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      if (editPlayer) {
        await playerAPI.update(editPlayer._id, form);
        setMessage('Player updated!');
      } else {
        await playerAPI.create(form);
        setMessage('Player created!');
      }
      setShowModal(false);
      fetchPlayers();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error saving player');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this player?')) return;
    try {
      await playerAPI.delete(id);
      fetchPlayers();
    } catch {}
  };

  const handleBulkImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const text = evt.target.result;
          let playersData;
          if (file.name.endsWith('.json')) {
            playersData = JSON.parse(text);
            if (!Array.isArray(playersData)) playersData = [playersData];
          } else {
            return alert('CSV import not implemented in this version. Use JSON.');
          }
          const { data } = await playerAPI.bulkUpload({ players: playersData });
          alert(`Inserted: ${data.inserted}, Skipped: ${data.skipped}${data.errors?.length ? `, Errors: ${data.errors.length}` : ''}`);
          fetchPlayers();
        } catch (err) {
          alert('Error importing: ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExport = async () => {
    try {
      const { data } = await playerAPI.exportPlayers();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `players-export-${Date.now()}.json`;
      a.click();
    } catch {}
  };

  const formatMoney = (n) => {
    if (!n) return '$0';
    if (n >= 1000000000) return `$${(n / 1000000000).toFixed(2)}B`;
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    return `$${n.toLocaleString()}`;
  };

  const getPositionBadge = (pos) => {
    const map = {
      Goalkeeper: { cls: 'badge-gk', label: 'GK' },
      Defender: { cls: 'badge-def', label: 'DEF' },
      Midfielder: { cls: 'badge-mid', label: 'MID' },
      Forward: { cls: 'badge-fwd', label: 'FWD' },
    };
    const m = map[pos] || { cls: '', label: pos };
    return <span className={`badge-position-stitch ${m.cls}`}>{m.label}</span>;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await playerAPI.uploadImage(file);
      setForm(prev => ({ ...prev, image: data.url }));
    } catch (err) {
      setMessage('Upload failed: ' + (err.response?.data?.message || err.message));
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary" style={{fontSize: '28px'}}>admin_panel_settings</span>
          <div>
            <h1 className="font-headline-lg text-on-surface">Admin: Player Management</h1>
            <p className="font-body-md text-on-surface-variant">{players.length} players loaded</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="btn-ghost-stitch" onClick={handleBulkImport}>
            <span className="material-symbols-outlined" style={{fontSize: '14px'}}>upload</span>
            Import
          </button>
          <button className="btn-ghost-stitch" onClick={handleExport}>
            <span className="material-symbols-outlined" style={{fontSize: '14px'}}>download</span>
            Export
          </button>
          <button className="btn-primary-glow" style={{padding: '8px 16px', fontSize: '12px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', borderRadius: '0.25rem'}} onClick={openCreate}>
            <span className="material-symbols-outlined" style={{fontSize: '14px'}}>add</span>
            Add Player
          </button>
        </div>
      </div>

      {/* Image Manager Dashboard */}
      <div className="glass-panel p-5 rounded-xl mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{fontSize: '20px'}}>image</span>
            <h2 className="font-headline-sm text-on-surface">Image Manager</h2>
          </div>
          {downloadProgress && (
            <div className="flex items-center gap-2">
              <span className="spinner-stitch" style={{width: 14, height: 14, borderWidth: 2}}></span>
              <span className="font-label-caps text-primary">{downloadProgress.completed} / {downloadProgress.total}</span>
            </div>
          )}
        </div>

        {downloadProgress && (
          <div className="glass-panel p-3 mb-4 flex items-center gap-3" style={{borderColor: 'rgba(242,202,80,0.3)'}}>
            <span className="material-symbols-outlined text-primary" style={{fontSize: '16px'}}>downloading</span>
            <div>
              <p className="font-label-caps text-on-surface text-[11px]">Downloading images... {downloadProgress.completed} / {downloadProgress.total} completed</p>
              <p className="font-label-caps text-on-surface-variant text-[10px] mt-0.5">Current: {downloadProgress.current}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex gap-6">
            <div className="text-center">
              <p className="font-headline-lg text-on-surface tabular-nums">{imageStats?.total || '—'}</p>
              <p className="font-label-caps text-on-surface-variant text-[10px]">Total</p>
            </div>
            <div className="text-center">
              <p className="font-headline-lg text-secondary-fixed tabular-nums">{imageStats?.ready || '—'}</p>
              <p className="font-label-caps text-on-surface-variant text-[10px]">Ready</p>
            </div>
            <div className="text-center">
              <p className="font-headline-lg text-primary tabular-nums">{imageStats?.pending || '—'}</p>
              <p className="font-label-caps text-on-surface-variant text-[10px]">Pending</p>
            </div>
            <div className="text-center">
              <p className="font-headline-lg text-on-surface-variant tabular-nums">{imageStats?.downloading || '—'}</p>
              <p className="font-label-caps text-on-surface-variant text-[10px]">DL'ing</p>
            </div>
            <div className="text-center">
              <p className="font-headline-lg tabular-nums" style={{color: imageStats?.failed > 0 ? '#e94560' : 'var(--text-on-surface-variant)'}}>{imageStats?.failed || '—'}</p>
              <p className="font-label-caps text-on-surface-variant text-[10px]">Failed</p>
            </div>
          </div>
          <div className="flex gap-2 ml-auto">
            <button className="btn-ghost-stitch" onClick={handleDownloadMissing} disabled={downloadProgress}>
              <span className="material-symbols-outlined" style={{fontSize: '14px'}}>cloud_download</span>
              Download Missing
            </button>
            <button className="btn-ghost-stitch" onClick={handleRetryFailed} disabled={downloadProgress || !imageStats?.failed}>
              <span className="material-symbols-outlined" style={{fontSize: '14px'}}>refresh</span>
              Retry Failed
            </button>
            <button className="btn-ghost-stitch" onClick={fetchImageStats}>
              <span className="material-symbols-outlined" style={{fontSize: '14px'}}>refresh</span>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="glass-panel p-4 rounded-xl mb-6">
        <div className="filter-search-wrap" style={{maxWidth: 400}}>
          <span className="material-symbols-outlined text-on-surface-variant" style={{fontSize: '16px'}}>search</span>
          <input type="text" placeholder="Search players..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
          {search && (
            <span className="material-symbols-outlined text-on-surface-variant" style={{fontSize: '16px', cursor: 'pointer'}}
              onClick={() => setSearch('')}>close</span>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-10"><div className="spinner-stitch"></div></div>
      ) : (
        <div className="glass-panel rounded-xl overflow-hidden">
          <div style={{maxHeight: '600px', overflowY: 'auto'}}>
            <table style={{
              width: '100%', borderCollapse: 'collapse',
              fontFamily: 'var(--font-body)', fontSize: '14px',
            }}>
              <thead>
                <tr style={{borderBottom: '1px solid rgba(77,70,53,0.2)'}}>
                  {['Name', 'Position', 'Country', 'Rating', 'Price', 'Rarity', 'Actions'].map(h => (
                    <th key={h} className="font-label-caps text-on-surface-variant p-4 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr key={p._id} style={{borderBottom: '1px solid rgba(77,70,53,0.1)'}}
                    className="hover:bg-surface-container-low"
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-container-low)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td className="p-4 font-body-md font-bold text-on-surface">{p.name}</td>
                    <td className="p-4">{getPositionBadge(p.position)}</td>
                    <td className="p-4 text-on-surface">{p.country}</td>
                    <td className="p-4 text-primary font-label-caps">{p.overall}</td>
                    <td className="p-4 font-label-caps text-on-surface-variant">{formatMoney(p.basePrice)}</td>
                    <td className="p-4">
                      <span className="badge-position-stitch" style={{background: 'rgba(243,156,18,0.2)', color: '#f39c12'}}>{p.rarity}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <button className="btn-ghost-stitch" style={{padding: '6px 8px'}} onClick={() => openEdit(p)}>
                          <span className="material-symbols-outlined" style={{fontSize: '14px'}}>edit</span>
                        </button>
                        <button className="btn-ghost-stitch" style={{padding: '6px 8px', color: '#e94560'}} onClick={() => handleDelete(p._id)}>
                          <span className="material-symbols-outlined" style={{fontSize: '14px'}}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { if (!saving) setShowModal(false) }}>
          <div className="modal-glass" onClick={e => e.stopPropagation()}>
            <div className="modal-glass-header">
              <h2 className="font-headline-sm text-on-surface">{editPlayer ? 'Edit Player' : 'Add Player'}</h2>
              <button className="btn-close-stitch" onClick={() => !saving && setShowModal(false)} disabled={saving}>
                <span className="material-symbols-outlined" style={{fontSize: '20px'}}>close</span>
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-glass-body">
                {message && (
                  <div className="glass-panel p-3 mb-4 flex items-center gap-2" style={{borderColor: 'rgba(52,152,219,0.3)'}}>
                    <span className="material-symbols-outlined" style={{fontSize: '16px', color: '#3498db'}}>info</span>
                    <span className="font-body-md" style={{fontSize: '14px', color: '#3498db'}}>{message}</span>
                  </div>
                )}
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px'}}>
                  <div style={{gridColumn: 'span 2'}}>
                    <label className="font-label-caps text-on-surface-variant block mb-1">Name *</label>
                    <input className="input-glass-plain px-3 py-2.5 rounded-lg w-full" required value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="font-label-caps text-on-surface-variant block mb-1">Nickname</label>
                    <input className="input-glass-plain px-3 py-2.5 rounded-lg w-full" value={form.nickname}
                      onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
                  </div>
                  <div>
                    <label className="font-label-caps text-on-surface-variant block mb-1">Country *</label>
                    <input className="input-glass-plain px-3 py-2.5 rounded-lg w-full" required value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })} />
                  </div>
                  <div>
                    <label className="font-label-caps text-on-surface-variant block mb-1">Position *</label>
                    <select className="select-glass" value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}>
                      <option>Goalkeeper</option><option>Defender</option><option>Midfielder</option><option>Forward</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-label-caps text-on-surface-variant block mb-1">Foot</label>
                    <select className="select-glass" value={form.preferredFoot}
                      onChange={(e) => setForm({ ...form, preferredFoot: e.target.value })}>
                      <option>Right</option><option>Left</option><option>Both</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-label-caps text-on-surface-variant block mb-1">Rating</label>
                    <input type="number" className="input-glass-plain px-3 py-2.5 rounded-lg w-full" min={60} max={100} value={form.overall}
                      onChange={(e) => setForm({ ...form, overall: parseInt(e.target.value) || 85 })} />
                  </div>
                  <div>
                    <label className="font-label-caps text-on-surface-variant block mb-1">Base Price</label>
                    <input type="number" className="input-glass-plain px-3 py-2.5 rounded-lg w-full" min={1000000} value={form.basePrice}
                      onChange={(e) => setForm({ ...form, basePrice: parseInt(e.target.value) || 10000000 })} />
                  </div>
                  <div>
                    <label className="font-label-caps text-on-surface-variant block mb-1">Rarity</label>
                    <select className="select-glass" value={form.rarity}
                      onChange={(e) => setForm({ ...form, rarity: e.target.value })}>
                      <option>Legend</option><option>Icon</option><option>Hero</option><option>Common</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-label-caps text-on-surface-variant block mb-1">Jersey #</label>
                    <input type="number" className="input-glass-plain px-3 py-2.5 rounded-lg w-full" value={form.jerseyNumber}
                      onChange={(e) => setForm({ ...form, jerseyNumber: parseInt(e.target.value) || 10 })} />
                  </div>
                  <div>
                    <label className="font-label-caps text-on-surface-variant block mb-1">Peak Club</label>
                    <input className="input-glass-plain px-3 py-2.5 rounded-lg w-full" value={form.peakClub}
                      onChange={(e) => setForm({ ...form, peakClub: e.target.value })} />
                  </div>
                  <div>
                    <label className="font-label-caps text-on-surface-variant block mb-1">Ballon d'Or</label>
                    <input type="number" className="input-glass-plain px-3 py-2.5 rounded-lg w-full" value={form.ballonDor}
                      onChange={(e) => setForm({ ...form, ballonDor: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="font-label-caps text-on-surface-variant block mb-1">UCL</label>
                    <input type="number" className="input-glass-plain px-3 py-2.5 rounded-lg w-full" value={form.championsLeague}
                      onChange={(e) => setForm({ ...form, championsLeague: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="font-label-caps text-on-surface-variant block mb-1">League Titles</label>
                    <input type="number" className="input-glass-plain px-3 py-2.5 rounded-lg w-full" value={form.leagueTitles}
                      onChange={(e) => setForm({ ...form, leagueTitles: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="font-label-caps text-on-surface-variant block mb-1">Int'l Caps</label>
                    <input type="number" className="input-glass-plain px-3 py-2.5 rounded-lg w-full" value={form.internationalCaps}
                      onChange={(e) => setForm({ ...form, internationalCaps: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div style={{gridColumn: 'span 2'}}>
                    <label className="form-check-stitch">
                      <input type="checkbox" checked={form.worldCupWinner}
                        onChange={(e) => setForm({ ...form, worldCupWinner: e.target.checked })} />
                      <span>World Cup Winner</span>
                    </label>
                  </div>
                  <div style={{gridColumn: '1 / -1'}}>
                    <label className="font-label-caps text-on-surface-variant block mb-1">Player Image</label>
                    <div className="flex items-center gap-3">
                      <input className="input-glass-plain px-3 py-2.5 rounded-lg flex-1" placeholder="Image URL or upload..."
                        value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
                      <input type="file" ref={fileInputRef} accept="image/*" style={{display: 'none'}}
                        onChange={handleImageUpload} />
                      <button type="button" className="btn-ghost-stitch" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? <span className="spinner-stitch" style={{width: 12, height: 12, borderWidth: 2}}></span>
                          : <span className="material-symbols-outlined" style={{fontSize: '14px'}}>upload</span>}
                        Upload
                      </button>
                      {form.image && (
                        <img src={getPlayerImageUrl(form)} alt="preview"
                          className="w-10 h-10 rounded-full object-cover border border-outline-variant/30" />
                      )}
                    </div>
                  </div>
                  <div style={{gridColumn: '1 / -1'}}>
                    <label className="font-label-caps text-on-surface-variant block mb-1">Description</label>
                    <textarea className="input-glass-plain px-3 py-2.5 rounded-lg w-full" rows={2} value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-glass-footer">
                <button type="button" className="btn-ghost-stitch" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn-primary-glow" style={{padding: '10px 20px', fontSize: '12px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', borderRadius: '0.25rem'}} disabled={saving}>
                  {saving ? 'Saving...' : editPlayer ? 'Update Player' : 'Create Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
