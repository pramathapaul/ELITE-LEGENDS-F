import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getPlayerImageUrl } from '../utils/playerImage';

const FORMATIONS = ['4-3-3', '4-2-3-1', '4-4-2', '3-5-2', '3-4-3', '5-3-2', '5-4-1', '4-1-4-1', '4-3-2-1', '4-2-2-2'];

const FORMATION_POSITIONS = {
  '4-3-3': {
    rows: [
      { label: 'FORWARDS', positions: ['LW', 'ST', 'RW'], gridCols: 3 },
      { label: 'MIDFIELDERS', positions: ['CM', 'CDM', 'CM'], gridCols: 3 },
      { label: 'DEFENDERS', positions: ['LB', 'CB', 'CB', 'RB'], gridCols: 4 },
      { label: 'GOALKEEPER', positions: ['GK'], gridCols: 1 },
    ]
  },
  '4-2-3-1': {
    rows: [
      { label: 'FORWARDS', positions: ['ST'], gridCols: 1 },
      { label: 'ATT MID', positions: ['LW', 'CAM', 'RW'], gridCols: 3 },
      { label: 'DEF MID', positions: ['CDM', 'CDM'], gridCols: 2 },
      { label: 'DEFENDERS', positions: ['LB', 'CB', 'CB', 'RB'], gridCols: 4 },
      { label: 'GOALKEEPER', positions: ['GK'], gridCols: 1 },
    ]
  },
  '4-4-2': {
    rows: [
      { label: 'FORWARDS', positions: ['ST', 'ST'], gridCols: 2 },
      { label: 'MIDFIELDERS', positions: ['LM', 'CM', 'CM', 'RM'], gridCols: 4 },
      { label: 'DEFENDERS', positions: ['LB', 'CB', 'CB', 'RB'], gridCols: 4 },
      { label: 'GOALKEEPER', positions: ['GK'], gridCols: 1 },
    ]
  },
  '3-5-2': {
    rows: [
      { label: 'FORWARDS', positions: ['ST', 'ST'], gridCols: 2 },
      { label: 'ATT MID', positions: ['LW', 'CAM', 'RW'], gridCols: 3 },
      { label: 'DEF MID', positions: ['CDM', 'CDM'], gridCols: 2 },
      { label: 'DEFENDERS', positions: ['CB', 'CB', 'CB'], gridCols: 3 },
      { label: 'GOALKEEPER', positions: ['GK'], gridCols: 1 },
    ]
  },
  '3-4-3': {
    rows: [
      { label: 'FORWARDS', positions: ['LW', 'ST', 'RW'], gridCols: 3 },
      { label: 'MIDFIELDERS', positions: ['LM', 'CM', 'CM', 'RM'], gridCols: 4 },
      { label: 'DEFENDERS', positions: ['CB', 'CB', 'CB'], gridCols: 3 },
      { label: 'GOALKEEPER', positions: ['GK'], gridCols: 1 },
    ]
  },
  '5-3-2': {
    rows: [
      { label: 'FORWARDS', positions: ['ST', 'ST'], gridCols: 2 },
      { label: 'MIDFIELDERS', positions: ['CM', 'CM', 'CM'], gridCols: 3 },
      { label: 'DEFENDERS', positions: ['LWB', 'CB', 'CB', 'CB', 'RWB'], gridCols: 5 },
      { label: 'GOALKEEPER', positions: ['GK'], gridCols: 1 },
    ]
  },
  '5-4-1': {
    rows: [
      { label: 'FORWARDS', positions: ['ST'], gridCols: 1 },
      { label: 'MIDFIELDERS', positions: ['LM', 'CM', 'CM', 'RM'], gridCols: 4 },
      { label: 'DEFENDERS', positions: ['LWB', 'CB', 'CB', 'CB', 'RWB'], gridCols: 5 },
      { label: 'GOALKEEPER', positions: ['GK'], gridCols: 1 },
    ]
  },
  '4-1-4-1': {
    rows: [
      { label: 'FORWARDS', positions: ['ST'], gridCols: 1 },
      { label: 'ATT MID', positions: ['LW', 'CAM', 'RW'], gridCols: 3 },
      { label: 'DEF MID', positions: ['CM', 'CDM', 'CM'], gridCols: 3 },
      { label: 'DEFENDERS', positions: ['LB', 'CB', 'CB', 'RB'], gridCols: 4 },
      { label: 'GOALKEEPER', positions: ['GK'], gridCols: 1 },
    ]
  },
  '4-3-2-1': {
    rows: [
      { label: 'FORWARDS', positions: ['ST'], gridCols: 1 },
      { label: 'ATT MID', positions: ['CAM', 'CAM'], gridCols: 2 },
      { label: 'MIDFIELDERS', positions: ['CM', 'CM', 'CM'], gridCols: 3 },
      { label: 'DEFENDERS', positions: ['LB', 'CB', 'CB', 'RB'], gridCols: 4 },
      { label: 'GOALKEEPER', positions: ['GK'], gridCols: 1 },
    ]
  },
  '4-2-2-2': {
    rows: [
      { label: 'FORWARDS', positions: ['ST', 'ST'], gridCols: 2 },
      { label: 'ATT MID', positions: ['CAM', 'CAM'], gridCols: 2 },
      { label: 'DEF MID', positions: ['CDM', 'CDM'], gridCols: 2 },
      { label: 'DEFENDERS', positions: ['LB', 'CB', 'CB', 'RB'], gridCols: 4 },
      { label: 'GOALKEEPER', positions: ['GK'], gridCols: 1 },
    ]
  },
};

export default function SquadManagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState([]);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [formation, setFormation] = useState('4-3-3');
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState(null);
  const [room, setRoom] = useState(null);
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [dragSource, setDragSource] = useState(null);
  const [dropSlotIndex, setDropSlotIndex] = useState(null);

  useEffect(() => {
    Promise.all([
      roomAPI.getMyTeam(id),
      roomAPI.getManagers(),
      roomAPI.getById(id),
    ]).then(([teamRes, managersRes, roomRes]) => {
      setTeam(teamRes.data);
      setManagers(managersRes.data);
      setRoom(roomRes.data);
      if (teamRes.data?.formation) setFormation(teamRes.data.formation);
      setLoading(false);
    }).catch(() => { setLoading(false); navigate('/dashboard'); });
  }, [id, navigate]);

  const formatMoney = (n) => {
    if (!n) return '$0';
    if (n >= 1000000000) return `$${(n / 1000000000).toFixed(2)}B`;
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  };

  const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  const starters = team?.players?.filter(p => p.status === 'starter') || [];
  const subs = team?.players?.filter(p => p.status === 'substitute') || [];
  const totalRating = team?.totalRating || 0;
  const squadValue = team?.squadValue || team?.players?.reduce((s, p) => s + (p.winningBid || 0), 0) || 0;
  const avgRating = team?.avgRating || (team?.players?.length > 0
    ? Math.round(team.players.reduce((s, p) => s + (p.player?.overall || 0), 0) / team.players.length)
    : 0);
  const remainingBudget = team?.remainingBudget || 0;

  const currentManager = team?.manager;
  const squadConfirmed = team?.squadConfirmed;

  const handleToggleStatus = async (playerId) => {
    try {
      const { data } = await roomAPI.togglePlayerStatus(id, playerId);
      setTeam(data);
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.message || 'Error moving player' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSetManager = async (managerId) => {
    try {
      const { data } = await roomAPI.setManager(id, managerId);
      setTeam(data);
      setShowManagerModal(false);
      const mgr = managers.find(m => m._id === managerId);
      if (mgr) setFormation(mgr.preferredFormation);
    } catch (e) {
      setMessage({ type: 'error', text: 'Error setting manager' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSetFormation = async (f) => {
    try {
      setFormation(f);
      const { data } = await roomAPI.setFormation(id, f);
      setTeam(data);
    } catch (e) {
      setMessage({ type: 'error', text: 'Error setting formation' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleBestXI = async () => {
    try {
      const { data } = await roomAPI.applyBestXI(id);
      setTeam(data);
      setMessage({ type: 'success', text: 'Best XI applied!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (e) {
      setMessage({ type: 'error', text: 'Error suggesting Best XI' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleConfirmSquad = async () => {
    try {
      setConfirming(true);
      const { data } = await roomAPI.confirmSquad(id);
      setTeam(data);
      setMessage({ type: 'success', text: 'Squad confirmed!' });
      setTimeout(() => setMessage(null), 3000);
      navigate(`/room/${id}`);
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.message || 'Error confirming squad' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setConfirming(false);
    }
  };

  const handleDragStart = (playerId, source) => {
    setDraggedPlayer(playerId);
    setDragSource(source);
  };

  const handleDrop = (targetStatus) => {
    if (draggedPlayer) {
      handleToggleStatus(draggedPlayer);
      setDraggedPlayer(null);
      setDragSource(null);
    }
    setDropSlotIndex(null);
  };

  const handlePitchSwap = async (targetPlayerId) => {
    if (!draggedPlayer || !targetPlayerId || draggedPlayer === targetPlayerId) {
      setDraggedPlayer(null);
      setDragSource(null);
      setDropSlotIndex(null);
      return;
    }

    const starterIds = starters.map(e => e.player._id);
    const fromIdx = starterIds.indexOf(draggedPlayer);
    const toIdx = starterIds.indexOf(targetPlayerId);
    if (fromIdx === -1 || toIdx === -1) {
      setDraggedPlayer(null);
      setDragSource(null);
      setDropSlotIndex(null);
      return;
    }

    starterIds[fromIdx] = targetPlayerId;
    starterIds[toIdx] = draggedPlayer;

    try {
      const { data } = await roomAPI.reorderPlayers(id, 'starter', starterIds);
      setTeam(data);
    } catch (e) {
      setMessage({ type: 'error', text: 'Error reordering players' });
      setTimeout(() => setMessage(null), 3000);
    }

    setDraggedPlayer(null);
    setDragSource(null);
    setDropSlotIndex(null);
  };

  const handleBenchReorder = async (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    const subEntries = team.players.filter(e => e.status === 'substitute');
    const subIds = subEntries.map(e => e.player._id.toString());
    const [moved] = subIds.splice(fromIndex, 1);
    subIds.splice(toIndex, 0, moved);

    try {
      const { data } = await roomAPI.reorderPlayers(id, 'substitute', subIds);
      setTeam(data);
    } catch (e) {
      setMessage({ type: 'error', text: 'Error reordering bench' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const pitchLayout = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-3-3'];
  let starterIndex = 0;
  let globalSlotIndex = 0;

  if (loading) return <div className="loading-stitch"><div className="spinner-stitch"></div></div>;

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1400px] mx-auto px-3 md:px-6">
      {message && (
        <div className={`fixed top-4 md:top-24 left-1/2 -translate-x-1/2 z-50 glass-panel p-3 md:p-4 rounded-xl text-center max-w-[90vw] md:max-w-md`}
          style={{borderLeft: `4px solid ${message.type === 'success' ? 'var(--secondary-fixed)' : 'var(--error)'}`}}>
          <span className="font-body-md text-xs md:text-sm" style={{color: message.type === 'success' ? 'var(--secondary-fixed)' : 'var(--error)'}}>{message.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="squad-header-banner p-4 md:p-8">
        <div className="gold-shimmer absolute top-0 left-0 w-full h-[3px]"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-8">
          <div className="w-full md:w-auto">
            <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-3 flex-wrap">
              <span className="bg-primary text-on-primary px-3 md:px-4 py-1 md:py-1.5 font-label-caps text-[9px] md:text-[10px] rounded-full tracking-wider">SQUAD</span>
              <span className="text-on-surface-variant font-label-caps text-[9px] md:text-[10px] tracking-wider truncate max-w-[120px] md:max-w-none">{room?.name || ''}</span>
              {squadConfirmed && <span className="bg-secondary-fixed text-on-secondary-fixed px-3 py-1 font-label-caps text-[9px] rounded-full tracking-wider">CONFIRMED</span>}
            </div>
            <h1 className="font-headline-xl text-primary italic tracking-tight" style={{fontSize: 'clamp(22px, 5vw, 48px)'}}>
              {user?.username}'s SQUAD
            </h1>
          </div>
          <div className="grid grid-cols-4 gap-2 md:gap-6 w-full md:w-auto">
            <div>
              <p className="font-label-caps text-[8px] md:text-[10px] text-on-surface-variant mb-0.5 md:mb-1 tracking-wider">RATING</p>
              <p className="font-headline-sm md:font-headline-lg text-primary tabular-nums">{totalRating}</p>
            </div>
            <div>
              <p className="font-label-caps text-[8px] md:text-[10px] text-on-surface-variant mb-0.5 md:mb-1 tracking-wider">AVG</p>
              <p className="font-headline-sm md:font-headline-lg text-on-surface tabular-nums">{avgRating}</p>
            </div>
            <div>
              <p className="font-label-caps text-[8px] md:text-[10px] text-on-surface-variant mb-0.5 md:mb-1 tracking-wider">VALUE</p>
              <p className="font-headline-sm md:font-headline-lg text-secondary-fixed tabular-nums">{formatMoney(squadValue)}</p>
            </div>
            <div>
              <p className="font-label-caps text-[8px] md:text-[10px] text-on-surface-variant mb-0.5 md:mb-1 tracking-wider">BUDGET</p>
              <p className="font-headline-sm md:font-headline-lg text-secondary-fixed-dim tabular-nums">{formatMoney(remainingBudget)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Pitch + Right Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-8">
        {/* Pitch View */}
        <div className="xl:col-span-8">
          <div className="relative rounded-xl md:rounded-2xl overflow-hidden min-h-[400px] md:min-h-[500px]" style={{background: 'linear-gradient(180deg, rgba(14,60,14,0.8) 0%, rgba(14,14,14,0.95) 100%)'}}>
            <div className="absolute inset-0 pitch-grid opacity-10"></div>

            {/* Pitch markings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(50vw,400px)] h-[min(50vw,400px)] md:w-[min(60vw,400px)] md:h-[min(60vw,400px)] border-2 border-white/5 rounded-full pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(35vw,250px)] h-[min(35vw,250px)] md:w-[min(40vw,250px)] md:h-[min(40vw,250px)] border border-white/5 rounded-full pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[90%] md:w-[80%] h-[1px] bg-white/5 pointer-events-none"></div>

            <div className="relative z-10 p-3 md:p-6 lg:p-8">
              <div className="flex items-center justify-between mb-3 md:mb-6">
                <h3 className="font-headline-sm text-white/80 text-xs md:text-sm italic tracking-tight">{formation}</h3>
                <div className="flex items-center gap-2">
                  <span className="font-label-caps text-[9px] md:text-[10px] text-white/40">{starters.length}/11 STARTING XI</span>
                </div>
              </div>

              <div className="w-full space-y-2 md:space-y-4 lg:space-y-6 items-center flex flex-col">
                {pitchLayout.rows.map((row, ri) => (
                  <div key={ri} className="w-full max-w-[500px] mx-auto">
                    {row.label !== 'GOALKEEPER' && (
                      <p className="font-label-caps text-[7px] md:text-[8px] text-white/20 tracking-widest text-center mb-1 md:mb-2">{row.label}</p>
                    )}
                    <div
                      className="grid gap-1 md:gap-3 justify-items-center"
                      style={{ gridTemplateColumns: `repeat(${row.gridCols}, 1fr)` }}
                    >
                      {row.positions.map((pos, pi) => {
                        const entry = starters[starterIndex] || null;
                        const slotIndex = globalSlotIndex;
                        if (entry) starterIndex++;
                        globalSlotIndex++;
                        const isDragOver = dropSlotIndex === slotIndex && draggedPlayer && entry && draggedPlayer !== entry.player?._id;
                        return (
                          <div
                            key={pi}
                            className="relative w-full group"
                            draggable={!!entry && !squadConfirmed}
                            onDragStart={() => entry && handleDragStart(entry.player?._id, 'pitch')}
                            onDragOver={(e) => { e.preventDefault(); setDropSlotIndex(slotIndex); }}
                            onDragLeave={() => setDropSlotIndex(null)}
                            onDrop={() => {
                              if (dragSource === 'pitch' && entry) {
                                handlePitchSwap(entry.player._id);
                              } else if (draggedPlayer) {
                                handleDrop('substitute');
                              }
                              setDropSlotIndex(null);
                            }}
                          >
                            {entry ? (
                              <div className={`w-full aspect-[3/4] bg-surface-container/70 backdrop-blur-md border rounded-lg md:rounded-xl p-1.5 md:p-2 lg:p-3 flex flex-col items-center justify-end overflow-hidden relative transition-all duration-300 hover:scale-105 hover:-translate-y-2 cursor-grab active:cursor-grabbing ${isDragOver ? 'border-secondary-fixed scale-110' : 'border-primary/30 hover:border-primary/60'}`}
                                style={{...(pos === 'GK' ? {boxShadow: '0 0 15px rgba(114,255,112,0.1)'} : {}), ...(isDragOver ? {boxShadow: '0 0 20px rgba(242,202,80,0.3)'} : {})}}>
                                <div className="absolute top-0.5 left-1 font-label-caps text-[7px] md:text-[8px] text-primary/60">{pos}</div>
                                <img src={getPlayerImageUrl(entry.player)} alt={entry.player.name}
                                  className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-full object-cover border border-primary/30 mb-0.5 md:mb-1"
                                  style={pos === 'GK' ? {boxShadow: '0 0 8px rgba(114,255,112,0.2)'} : {}} />
                                <div className="text-center relative z-10 w-full">
                                  <h4 className="font-label-caps text-[8px] md:text-[10px] lg:text-[11px] text-on-surface truncate w-full text-center leading-tight">{entry.player.name}</h4>
                                  <div className="flex items-center justify-center gap-0.5 md:gap-1 mt-0.5">
                                    <span className="font-label-caps text-[8px] md:text-[9px] text-secondary-fixed">{entry.player.overall}</span>
                                    <span className="font-label-caps text-[6px] md:text-[7px] text-on-surface-variant hidden md:inline">{formatMoney(entry.winningBid)}</span>
                                  </div>
                                </div>
                                {!squadConfirmed && (
                                  <button className="absolute top-0.5 right-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => { e.stopPropagation(); handleToggleStatus(entry.player._id); }}
                                    title="Move to bench">
                                    <span className="material-symbols-outlined text-[10px] md:text-[12px]" style={{color: 'white'}}>arrow_downward</span>
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className={`w-full aspect-[3/4] border border-dashed rounded-lg md:rounded-xl flex items-center justify-center ${isDragOver ? 'border-secondary-fixed bg-secondary-fixed/10' : 'border-white/10'}`}>
                                <span className="font-label-caps text-[7px] md:text-[8px] text-white/20">{pos}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="xl:col-span-4 space-y-4 md:space-y-6">
          {/* Manager Card */}
          <div className="glass-panel p-4 md:p-5 rounded-xl">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h4 className="font-label-caps text-on-surface-variant tracking-wider text-xs md:text-sm">MANAGER</h4>
              {!squadConfirmed && (
                <button className="font-label-caps text-[10px] text-primary hover:underline" onClick={() => setShowManagerModal(true)}>
                  {currentManager ? 'CHANGE' : 'SELECT'}
                </button>
              )}
            </div>
            {currentManager ? (
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-primary/20 flex items-center justify-center text-base md:text-xl font-bold text-primary shrink-0">
                  {getInitials(currentManager.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-headline-sm text-xs md:text-sm text-on-surface truncate">{currentManager.name}</h5>
                  <div className="flex items-center gap-1.5 md:gap-2 mt-0.5 md:mt-1 flex-wrap">
                    <span className="font-label-caps text-[8px] md:text-[9px] text-on-surface-variant">{currentManager.nationality}</span>
                    <span className="text-outline-variant hidden md:inline">|</span>
                    <span className="font-label-caps text-[8px] md:text-[9px] text-primary">{currentManager.tacticalStyle}</span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 mt-0.5 md:mt-1">
                    <span className="font-label-caps text-[8px] md:text-[9px] text-secondary-fixed">{currentManager.preferredFormation}</span>
                    <span className="font-label-caps text-[8px] md:text-[9px] text-primary">Rating: {currentManager.rating}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 md:py-6">
                <p className="font-body-md text-xs md:text-sm text-on-surface-variant opacity-60 mb-2 md:mb-3">No manager appointed</p>
                <button className="bg-primary/20 text-primary font-label-caps text-[10px] md:text-xs px-5 md:px-6 py-2.5 md:py-3 rounded-lg hover:bg-primary/30 transition-all" style={{border: 'none'}}
                  onClick={() => setShowManagerModal(true)}>
                  SELECT MANAGER
                </button>
              </div>
            )}
          </div>

          {/* Formation Selector */}
          <div className="glass-panel p-4 md:p-5 rounded-xl">
            <h4 className="font-label-caps text-on-surface-variant mb-3 md:mb-4 tracking-wider text-xs md:text-sm">FORMATION</h4>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {FORMATIONS.map(f => (
                <button key={f}
                  className={`px-2 md:px-3 py-1.5 md:py-2 rounded-lg font-label-caps text-[8px] md:text-[10px] transition-all ${
                    formation === f
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                  style={{border: formation === f ? 'none' : '1px solid var(--text-outline-variant)'}}
                  onClick={() => handleSetFormation(f)}
                  disabled={squadConfirmed}>
                  {f}
                </button>
              ))}
            </div>
            {formation !== team?.formation && !squadConfirmed && (
              <p className="font-label-caps text-[8px] md:text-[9px] text-primary mt-1 md:mt-2">Formation changed. Players arranged automatically.</p>
            )}
          </div>

          {/* Squad Info */}
          <div className="glass-panel p-4 md:p-5 rounded-xl">
            <h4 className="font-label-caps text-on-surface-variant mb-3 md:mb-4 tracking-wider text-xs md:text-sm">SQUAD INFO</h4>
            <div className="space-y-2 md:space-y-3">
              {[
                { label: 'Starting XI', value: `${starters.length}/11`, color: 'text-secondary-fixed' },
                { label: 'Bench', value: `${subs.length}/11`, color: 'text-on-surface' },
                { label: 'Total Players', value: `${team?.players?.length || 0}/22`, color: 'text-primary' },
                { label: 'Team Chemistry', value: team?.players?.length >= 11 ? 'Excellent' : team?.players?.length >= 5 ? 'Good' : 'Building', color: team?.players?.length >= 11 ? 'text-secondary-fixed' : team?.players?.length >= 5 ? 'text-primary' : 'text-on-surface-variant' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-1.5 md:py-2 px-2 md:px-3 bg-surface-container-low rounded-lg">
                  <span className="font-label-caps text-[9px] md:text-[10px] text-on-surface-variant">{item.label}</span>
                  <span className={`font-headline-sm text-xs md:text-sm ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Best XI + Reset + Confirm */}
          <div className="glass-panel p-4 md:p-5 rounded-xl">
            <div className="space-y-2 md:space-y-3">
              {team?.players?.length >= 11 && !squadConfirmed && (
                <button className="w-full py-3 md:py-4 bg-primary/20 text-primary font-label-caps text-[10px] md:text-xs tracking-wider transition-all active:scale-95 hover:bg-primary/30 rounded-lg flex items-center justify-center gap-1.5 md:gap-2" style={{border: '1px solid var(--primary)'}}
                  onClick={handleBestXI}>
                  <span className="material-symbols-outlined text-sm md:text-base" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
                  AUTO BEST XI
                </button>
              )}
              {!squadConfirmed && (
                <button className="w-full py-3 md:py-4 bg-surface-container-highest text-error font-label-caps text-[10px] md:text-xs border border-error/30 transition-all active:scale-95 hover:bg-error/10 rounded-lg flex items-center justify-center gap-1.5 md:gap-2"
                  onClick={async () => {
                    try {
                      const { data } = await roomAPI.resetTeam(id);
                      setTeam(data);
                      setFormation('4-3-3');
                      setMessage({ type: 'success', text: 'Squad reset. All players moved to bench.' });
                      setTimeout(() => setMessage(null), 3000);
                    } catch (e) {
                      setMessage({ type: 'error', text: 'Error resetting squad' });
                      setTimeout(() => setMessage(null), 3000);
                    }
                  }}>
                  <span className="material-symbols-outlined text-sm md:text-base">refresh</span>
                  RESET SQUAD
                </button>
              )}
              <button className={`w-full py-3 md:py-4 font-label-caps text-[10px] md:text-xs tracking-wider transition-all active:scale-95 rounded-lg flex items-center justify-center gap-1.5 md:gap-2 ${
                squadConfirmed ? 'bg-secondary-fixed/20 text-secondary-fixed' : 'bg-secondary text-on-secondary hover:brightness-110'
              }`} style={{border: 'none'}}
                onClick={handleConfirmSquad}
                disabled={squadConfirmed || confirming}>
                {confirming ? 'CONFIRMING...' : squadConfirmed ? 'SQUAD CONFIRMED' : 'CONFIRM SQUAD'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bench Area */}
      <div className="glass-panel p-4 md:p-6 lg:p-8 rounded-xl" onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop('starter')}>
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h4 className="font-label-caps text-on-surface-variant tracking-wider flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
            <span className="material-symbols-outlined text-sm md:text-lg" style={{fontVariationSettings: "'FILL' 1"}}>groups</span>
            BENCH ({subs.length}/11)
          </h4>
          {subs.length > 0 && !squadConfirmed && (
            <span className="font-label-caps text-[8px] md:text-[9px] text-on-surface-variant">Drag to reorder or promote</span>
          )}
        </div>

        {subs.length > 0 ? (
          <div className="space-y-1">
            {subs.map((entry, bi) => (
              <div key={entry.player?._id}
                className={`flex items-center gap-2 md:gap-3 px-2.5 md:px-3 py-2 md:py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-all cursor-grab active:cursor-grabbing border ${dropSlotIndex === `bench-${bi}` ? 'border-secondary-fixed bg-surface-container' : 'border-transparent hover:border-primary/20'}`}
                draggable={!squadConfirmed}
                onDragStart={() => { handleDragStart(entry.player?._id, 'bench'); setDropSlotIndex(`bench-${bi}`); }}
                onDragOver={(e) => { e.preventDefault(); setDropSlotIndex(`bench-${bi}`); }}
                onDragLeave={() => setDropSlotIndex(null)}
                onDrop={() => {
                  if (dragSource === 'bench' && draggedPlayer) {
                    const subEntries = subs.filter(e => e.player?._id);
                    const subIds = subEntries.map(e => e.player._id.toString());
                    const fromIdx = subIds.indexOf(draggedPlayer);
                    if (fromIdx !== -1) {
                      handleBenchReorder(fromIdx, bi);
                    }
                  }
                  setDropSlotIndex(null);
                  setDraggedPlayer(null);
                  setDragSource(null);
                }}>
                <span className="w-5 h-5 rounded-full bg-surface-container-higher flex items-center justify-center font-label-caps text-[9px] text-on-surface-variant shrink-0">
                  {entry.player?.overall}
                </span>
                <span className="font-label-caps text-xs md:text-sm text-on-surface truncate flex-1 min-w-0">{entry.player?.name}</span>
                <span className="font-label-caps text-[9px] md:text-[10px] text-on-surface-variant shrink-0">
                  {entry.player?.position === 'Goalkeeper' ? 'GK' : entry.player?.position === 'Defender' ? 'DEF' : entry.player?.position === 'Midfielder' ? 'MID' : 'FWD'}
                </span>
                <span className="font-label-caps text-[9px] md:text-[10px] text-primary shrink-0 hidden sm:inline">{formatMoney(entry.winningBid)}</span>
                {!squadConfirmed && (
                  <button className="px-3 md:px-4 py-1.5 bg-surface-container-higher text-primary font-label-caps text-[9px] md:text-[10px] rounded-lg transition-all hover:bg-primary/20 active:scale-95 shrink-0 min-h-[32px]" style={{border: '1px solid var(--text-outline-variant)'}}
                    onClick={() => handleToggleStatus(entry.player?._id)}>
                    PROMOTE
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 md:py-10">
            <p className="text-on-surface-variant opacity-50 font-body-md text-xs md:text-sm">No substitutes. Win players at auction to fill your bench.</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pb-6">
        <button className="btn-primary-glow text-xs md:text-sm px-6 md:px-8 py-3 md:py-4 rounded-lg md:rounded-xl min-h-[44px]"
          onClick={() => navigate(`/room/${id}`)}>
          BACK TO ROOM
        </button>
        <button className="btn-outline-glass text-xs md:text-sm px-6 md:px-8 py-3 md:py-4 rounded-lg md:rounded-xl min-h-[44px]"
          onClick={() => navigate('/my-teams')}>
          ALL TEAMS
        </button>
      </div>

      {/* Manager Selection Modal */}
      {showManagerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4" style={{background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)'}}>
          <div className="glass-panel rounded-xl md:rounded-2xl w-full max-w-3xl max-h-[85vh] md:max-h-[80vh] overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="font-headline-lg text-primary italic text-lg md:text-xl">SELECT MANAGER</h3>
              <button className="btn-ghost-icon p-2" onClick={() => setShowManagerModal(false)}>
                <span className="material-symbols-outlined text-xl md:text-2xl">close</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {managers.map(mgr => (
                <div key={mgr._id}
                  className={`bg-surface-container-low hover:bg-surface-container rounded-lg md:rounded-xl p-3 md:p-4 border cursor-pointer transition-all hover:border-primary/50 ${
                    currentManager?._id === mgr._id ? 'border-primary bg-primary/10' : 'border-outline-variant/20'
                  }`}
                  onClick={() => handleSetManager(mgr._id)}>
                  <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/20 flex items-center justify-center font-headline-sm text-primary shrink-0 text-sm md:text-base">
                      {getInitials(mgr.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-headline-sm text-xs md:text-sm text-on-surface truncate">{mgr.name}</h5>
                      <p className="font-label-caps text-[8px] md:text-[9px] text-on-surface-variant">{mgr.nationality}</p>
                    </div>
                    <span className="font-headline-lg text-primary text-sm md:text-base">{mgr.rating}</span>
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                    <div className="flex justify-between text-[9px] md:text-[10px]">
                      <span className="font-label-caps text-on-surface-variant">Style</span>
                      <span className="font-label-caps text-secondary-fixed">{mgr.tacticalStyle}</span>
                    </div>
                    <div className="flex justify-between text-[9px] md:text-[10px]">
                      <span className="font-label-caps text-on-surface-variant">Formation</span>
                      <span className="font-label-caps text-primary">{mgr.preferredFormation}</span>
                    </div>
                    <div className="flex justify-between text-[9px] md:text-[10px]">
                      <span className="font-label-caps text-on-surface-variant">Trophies</span>
                      <span className="font-label-caps text-on-surface">{mgr.trophies}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .squad-header-banner { background: rgba(53, 53, 52, 0.4); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(77, 70, 53, 0.3); border-radius: 0.75rem; position: relative; overflow: hidden; }
        .pitch-grid { background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 40px 40px; }
        .gold-shimmer { background: linear-gradient(90deg, transparent, rgba(233, 195, 73, 0.2), transparent); background-size: 200% 100%; animation: shimmer 3s infinite; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
    </div>
  );
}
