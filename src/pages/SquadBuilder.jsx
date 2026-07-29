import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DndContext, DragOverlay, useDroppable, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { roomAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BenchSidebar from '../components/squad/BenchSidebar';
import TeamStats from '../components/squad/TeamStats';

const FORMATIONS = ['4-3-3', '4-2-3-1', '4-4-2', '3-5-2', '3-4-3', '5-3-2', '5-4-1', '4-1-4-1', '4-3-2-1', '4-2-2-2'];

const FORMATION_POSITIONS = {
  '4-3-3': { rows: [ { label: 'FORWARDS', positions: ['LW', 'ST', 'RW'], gridCols: 3 }, { label: 'MIDFIELDERS', positions: ['CM', 'CDM', 'CM'], gridCols: 3 }, { label: 'DEFENDERS', positions: ['LB', 'CB', 'CB', 'RB'], gridCols: 4 }, { label: 'GOALKEEPER', positions: ['GK'], gridCols: 1 } ] },
  '4-2-3-1': { rows: [ { label: 'FORWARDS', positions: ['ST'], gridCols: 1 }, { label: 'ATT MID', positions: ['LW', 'CAM', 'RW'], gridCols: 3 }, { label: 'DEF MID', positions: ['CDM', 'CDM'], gridCols: 2 }, { label: 'DEFENDERS', positions: ['LB', 'CB', 'CB', 'RB'], gridCols: 4 }, { label: 'GOALKEEPER', positions: ['GK'], gridCols: 1 } ] },
  '4-4-2': { rows: [ { label: 'FORWARDS', positions: ['ST', 'ST'], gridCols: 2 }, { label: 'MIDFIELDERS', positions: ['LM', 'CM', 'CM', 'RM'], gridCols: 4 }, { label: 'DEFENDERS', positions: ['LB', 'CB', 'CB', 'RB'], gridCols: 4 }, { label: 'GOALKEEPER', positions: ['GK'], gridCols: 1 } ] },
  '3-5-2': { rows: [ { label: 'FORWARDS', positions: ['ST', 'ST'], gridCols: 2 }, { label: 'ATT MID', positions: ['LW', 'CAM', 'RW'], gridCols: 3 }, { label: 'DEF MID', positions: ['CDM', 'CDM'], gridCols: 2 }, { label: 'DEFENDERS', positions: ['CB', 'CB', 'CB'], gridCols: 3 }, { label: 'GOALKEEPER', positions: ['GK'], gridCols: 1 } ] },
  '3-4-3': { rows: [ { label: 'FORWARDS', positions: ['LW', 'ST', 'RW'], gridCols: 3 }, { label: 'MIDFIELDERS', positions: ['LM', 'CM', 'CM', 'RM'], gridCols: 4 }, { label: 'DEFENDERS', positions: ['CB', 'CB', 'CB'], gridCols: 3 }, { label: 'GOALKEEPER', positions: ['GK'], gridCols: 1 } ] },
  '5-3-2': { rows: [ { label: 'FORWARDS', positions: ['ST', 'ST'], gridCols: 2 }, { label: 'MIDFIELDERS', positions: ['CM', 'CM', 'CM'], gridCols: 3 }, { label: 'DEFENDERS', positions: ['LWB', 'CB', 'CB', 'CB', 'RWB'], gridCols: 5 }, { label: 'GOALKEEPER', positions: ['GK'], gridCols: 1 } ] },
  '5-4-1': { rows: [ { label: 'FORWARDS', positions: ['ST'], gridCols: 1 }, { label: 'MIDFIELDERS', positions: ['LM', 'CM', 'CM', 'RM'], gridCols: 4 }, { label: 'DEFENDERS', positions: ['LWB', 'CB', 'CB', 'CB', 'RWB'], gridCols: 5 }, { label: 'GOALKEEPER', positions: ['GK'], gridCols: 1 } ] },
  '4-1-4-1': { rows: [ { label: 'FORWARDS', positions: ['ST'], gridCols: 1 }, { label: 'ATT MID', positions: ['LW', 'CAM', 'RW'], gridCols: 3 }, { label: 'DEF MID', positions: ['CM', 'CDM', 'CM'], gridCols: 3 }, { label: 'DEFENDERS', positions: ['LB', 'CB', 'CB', 'RB'], gridCols: 4 }, { label: 'GOALKEEPER', positions: ['GK'], gridCols: 1 } ] },
  '4-3-2-1': { rows: [ { label: 'FORWARDS', positions: ['ST'], gridCols: 1 }, { label: 'ATT MID', positions: ['CAM', 'CAM'], gridCols: 2 }, { label: 'MIDFIELDERS', positions: ['CM', 'CM', 'CM'], gridCols: 3 }, { label: 'DEFENDERS', positions: ['LB', 'CB', 'CB', 'RB'], gridCols: 4 }, { label: 'GOALKEEPER', positions: ['GK'], gridCols: 1 } ] },
  '4-2-2-2': { rows: [ { label: 'FORWARDS', positions: ['ST', 'ST'], gridCols: 2 }, { label: 'ATT MID', positions: ['CAM', 'CAM'], gridCols: 2 }, { label: 'DEF MID', positions: ['CDM', 'CDM'], gridCols: 2 }, { label: 'DEFENDERS', positions: ['LB', 'CB', 'CB', 'RB'], gridCols: 4 }, { label: 'GOALKEEPER', positions: ['GK'], gridCols: 1 } ] },
};

const formatMoney = (n) => {
  if (!n) return '$0';
  if (n >= 1000000000) return `$${(n / 1000000000).toFixed(2)}B`;
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

/* ---------- Sub-Components ---------- */
function PitchSlot({ pos, entry, isOccupied, squadConfirmed, onRemove, slotIndex }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${slotIndex}`,
    data: { type: 'slot', playerId: entry?.player?._id },
    disabled: false,
  });

  return (
    <div ref={setNodeRef}
      className={`relative w-full transition-all duration-200 ${isOver ? 'scale-[1.03]' : ''}`}
    >
      {isOccupied && entry ? (
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className="w-full bg-surface-container/70 backdrop-blur-sm border border-primary/30 rounded md:rounded-xl px-1 md:px-2 py-1 md:py-2 flex items-center justify-between relative group"
          whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(242,202,80,0.12)' }}
          style={pos === 'GK' ? {boxShadow: '0 0 15px rgba(114,255,112,0.08)', borderColor: 'rgba(114,255,112,0.3)'} : {}}
        >
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-label-caps text-[5px] md:text-[7px] text-primary/50 shrink-0">{pos}</span>
            <span className="font-label-caps text-[6px] md:text-[9px] text-on-surface truncate">{entry.player.name}</span>
          </div>
          <span className="font-label-caps text-[6px] md:text-[8px] text-secondary-fixed shrink-0 ml-0.5">{entry.player.overall}</span>
          {!squadConfirmed && (
            <button className="ml-0.5 w-3 h-3 md:w-4 md:h-4 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}>
              <span className="material-symbols-outlined text-[6px] md:text-[10px]" style={{color: 'white'}}>close</span>
            </button>
          )}
        </motion.div>
      ) : (
        <div className="w-full border border-dashed border-white/10 rounded md:rounded-xl px-1 md:px-2 py-1 md:py-2 flex items-center justify-center gap-1 hover:border-primary/30 transition-colors cursor-default">
          <span className="font-label-caps text-[5px] md:text-[7px] text-white/15">{pos}</span>
          <span className="material-symbols-outlined text-white/10" style={{fontSize: '8px'}}>add</span>
        </div>
      )}
    </div>
  );
}

/* Bench area droppable (receives pitch -> bench drops) */
function BenchDropArea({ children }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'bench-area', data: { type: 'bench-area' } });
  return (
    <div ref={setNodeRef} className={`transition-all duration-200 ${isOver ? 'ring-2 ring-primary/30 rounded-xl' : ''}`}>
      {children}
    </div>
  );
}

/* ---------- Main Component ---------- */
export default function SquadBuilder() {
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
  const [activeDragId, setActiveDragId] = useState(null);
  const [activeDragData, setActiveDragData] = useState(null);


  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 10 } })
  );

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

  const starters = useMemo(() => team?.players?.filter(p => p.status === 'starter') || [], [team]);
  const subs = useMemo(() => team?.players?.filter(p => p.status === 'substitute') || [], [team]);
  const totalRating = team?.totalRating || 0;
  const squadValue = useMemo(() => team?.squadValue || team?.players?.reduce((s, p) => s + (p.winningBid || 0), 0) || 0, [team]);
  const avgRating = useMemo(() => team?.avgRating || (team?.players?.length > 0 ? Math.round(team.players.reduce((s, p) => s + (p.player?.overall || 0), 0) / team.players.length) : 0), [team]);
  const remainingBudget = team?.remainingBudget || 0;
  const currentManager = team?.manager;
  const squadConfirmed = team?.squadConfirmed;

  const pitchLayout = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-3-3'];

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const handleToggleStatus = async (playerId) => {
    try {
      const { data } = await roomAPI.togglePlayerStatus(id, playerId);
      setTeam(data);
    } catch (e) {
      showMessage('error', e.response?.data?.message || 'Error moving player');
    }
  };

  const handleSetFormation = async (f) => {
    setFormation(f);
    try {
      const { data } = await roomAPI.setFormation(id, f);
      setTeam(data);
    } catch (e) {
      showMessage('error', 'Error changing formation');
    }
  };

  const handleBestXI = async () => {
    try {
      const { data } = await roomAPI.applyBestXI(id);
      setTeam(data);
      showMessage('success', 'Best XI applied!');
    } catch (e) {
      showMessage('error', 'Error applying Best XI');
    }
  };

  const handleReset = async () => {
    try {
      const { data } = await roomAPI.resetTeam(id);
      setTeam(data);
      setFormation('4-3-3');
      showMessage('success', 'Squad reset');
    } catch (e) {
      showMessage('error', 'Error resetting squad');
    }
  };

  const handleConfirm = async () => {
    try {
      setConfirming(true);
      const { data } = await roomAPI.confirmSquad(id);
      setTeam(data);
      showMessage('success', 'Squad confirmed!');
      setTimeout(() => navigate(`/room/${id}`), 1500);
    } catch (e) {
      showMessage('error', e.response?.data?.message || 'Error confirming');
    } finally {
      setConfirming(false);
    }
  };

  const handleDragStart = (event) => {
    setActiveDragId(event.active.id);
    setActiveDragData(event.active.data.current);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveDragId(null);
    setActiveDragData(null);

    if (!over || !active) return;
    const fromData = active.data.current;
    const toData = over.data.current;
    if (!fromData) return;

    if (fromData.type === 'bench' && toData?.type === 'slot') {
      if (starters.length < 11) {
        await handleToggleStatus(fromData.playerId);
      } else if (toData.playerId) {
        const { data: team1 } = await roomAPI.togglePlayerStatus(id, fromData.playerId);
        setTeam(team1);
        const updatedStarters = team1.players.filter(p => p.status === 'starter');
        const updatedIds = updatedStarters.map(e => e.player._id.toString());
        const dragIdx = updatedIds.indexOf(fromData.playerId);
        const targetIdx = updatedIds.indexOf(toData.playerId);
        if (dragIdx !== -1 && targetIdx !== -1 && dragIdx !== targetIdx) {
          [updatedIds[dragIdx], updatedIds[targetIdx]] = [updatedIds[targetIdx], updatedIds[dragIdx]];
          const { data } = await roomAPI.reorderPlayers(id, 'starter', updatedIds);
          setTeam(data);
        }
      }
      return;
    }

    if (fromData.type === 'bench' && toData?.type === 'bench' && fromData.playerId !== toData.playerId) {
      const subEntries = subs.filter(e => e.player?._id);
      const subIds = subEntries.map(e => e.player._id.toString());
      const fromIdx = subIds.indexOf(fromData.playerId);
      const toIdx = subIds.indexOf(toData.playerId);
      if (fromIdx !== -1 && toIdx !== -1) {
        const [moved] = subIds.splice(fromIdx, 1);
        subIds.splice(toIdx, 0, moved);
        try {
          const { data } = await roomAPI.reorderPlayers(id, 'substitute', subIds);
          setTeam(data);
        } catch (e) {
          showMessage('error', 'Error reordering bench');
        }
      }
    }
  };

  const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  if (loading) return <div className="loading-stitch"><div className="spinner-stitch"></div></div>;

  let starterIdx = 0;
  let globalSlotIdx = 0;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="max-w-[1600px] mx-auto px-1 md:px-4 lg:px-6 py-2 md:py-6 space-y-2 md:space-y-6 overflow-x-hidden">
        {/* Toast */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass-panel px-4 py-3 rounded-xl shadow-2xl max-w-[90vw]"
              style={{borderLeft: `4px solid ${message.type === 'success' ? 'var(--secondary-fixed)' : 'var(--error)'}`}}
            >
              <span className="font-label-caps text-xs" style={{color: message.type === 'success' ? 'var(--secondary-fixed)' : 'var(--error)'}}>{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-2 md:p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px]" style={{background: 'linear-gradient(90deg, transparent, var(--primary), transparent)'}}></div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <div className="w-7 h-7 md:w-12 md:h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs md:text-base shrink-0">
                {user?.username?.[0]?.toUpperCase() || 'T'}
              </div>
              <div className="min-w-0">
                <h1 className="font-headline-sm text-[11px] md:text-lg text-primary italic tracking-tight truncate">{user?.username?.toUpperCase()}'S SQUAD</h1>
                <div className="flex items-center gap-1 md:gap-2 mt-0.5">
                  <span className="font-label-caps text-[7px] md:text-[9px] text-on-surface-variant truncate">{room?.name || ''}</span>
                  <span className="text-outline-variant text-[7px] md:text-[8px]">|</span>
                  <span className="font-label-caps text-[7px] md:text-[9px] text-secondary-fixed shrink-0">{formation}</span>
                  {currentManager && <><span className="text-outline-variant text-[7px] md:text-[8px]">|</span><span className="font-label-caps text-[7px] md:text-[9px] text-primary truncate">{currentManager.name}</span></>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-3 shrink-0">
              <button className="px-2 md:px-4 py-1 md:py-2 bg-surface-container-highest text-on-surface-variant font-label-caps text-[8px] md:text-[10px] rounded-lg hover:bg-surface-container-high transition-colors border border-outline-variant/20"
                onClick={() => navigate(`/room/${id}`)}>
                BACK
              </button>
              {squadConfirmed && <span className="px-2 py-1 md:px-3 md:py-1.5 bg-secondary-fixed/20 text-secondary-fixed font-label-caps text-[8px] md:text-[9px] rounded-lg">CONFIRMED</span>}
            </div>
          </div>
        </motion.div>

        {/* Three column layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 min-w-0">
          {/* LEFT: Bench */}
          <div className="md:col-span-3 min-w-0">
            <motion.div layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <BenchDropArea>
                <BenchSidebar
                  subs={subs}
                  squadConfirmed={squadConfirmed}
                  onPromote={handleToggleStatus}
                />
              </BenchDropArea>
            </motion.div>
          </div>

          {/* CENTER: Pitch */}
          <div className="md:col-span-6 min-w-0">
            <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="relative rounded-xl md:rounded-2xl overflow-hidden min-h-[320px] md:min-h-[550px]"
                style={{background: 'linear-gradient(180deg, #0a3a0a 0%, #0a1a0a 50%, #050d05 100%)'}}>
                <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)'}}></div>

                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 700" preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
                  <rect x="20" y="20" width="460" height="660" rx="8" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"/>
                  <line x1="20" y1="350" x2="480" y2="350" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"/>
                  <circle cx="250" cy="350" r="60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"/>
                  <circle cx="250" cy="350" r="6" fill="rgba(255,255,255,0.08)"/>
                  <rect x="80" y="20" width="340" height="132" rx="4" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
                  <rect x="80" y="548" width="340" height="132" rx="4" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
                  <rect x="150" y="20" width="200" height="44" rx="2" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                  <rect x="150" y="636" width="200" height="44" rx="2" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                </svg>

                <div className="absolute top-1.5 left-2 md:top-3 md:left-4 z-10">
                  <span className="font-label-caps text-[7px] md:text-[10px] text-white/30 tracking-wider">{formation}</span>
                </div>
                <div className="absolute top-1.5 right-2 md:top-3 md:right-4 z-10">
                  <span className="font-label-caps text-[7px] md:text-[10px] text-white/30">{starters.length}/11</span>
                </div>

                <div className="relative z-10 p-1.5 md:p-4 lg:p-6 flex flex-col items-center justify-center min-h-[320px] md:min-h-[550px]">
                  <div className="w-full max-w-[400px] space-y-1 md:space-y-3 lg:space-y-4">
                    {pitchLayout.rows.map((row, ri) => (
                      <div key={ri} className="w-full">
                        {row.label !== 'GOALKEEPER' && (
                          <p className="font-label-caps text-[5px] md:text-[7px] text-white/15 tracking-widest text-center mb-0.5 md:mb-1">{row.label}</p>
                        )}
                        <div className="grid gap-0.5 md:gap-2.5 justify-items-center"
                          style={{ gridTemplateColumns: `repeat(${row.gridCols}, 1fr)` }}>
                          {row.positions.map((pos, pi) => {
                            const entry = starters[starterIdx] || null;
                            const slotIdx = globalSlotIdx;
                            if (entry) starterIdx++;
                            globalSlotIdx++;
                            return (
                              <PitchSlot
                                key={`${formation}-${ri}-${pi}`}
                                pos={pos}
                                slotIndex={slotIdx}
                                entry={entry}
                                isOccupied={!!entry}
                                squadConfirmed={squadConfirmed}
                                onRemove={() => entry && handleToggleStatus(entry.player._id)}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Stats */}
          <div className="md:col-span-3 min-w-0">
            <motion.div layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <TeamStats
                team={team}
                starters={starters}
                subs={subs}
                squadValue={squadValue}
                avgRating={avgRating}
                totalRating={totalRating}
                remainingBudget={remainingBudget}
                formation={formation}
                manager={currentManager}
              />
            </motion.div>
          </div>
        </div>

        {/* Formation Selector + Toolbar */}
        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-panel p-2 md:p-6 rounded-xl">
          <div className="mb-2 md:mb-6">
            <h3 className="font-label-caps text-[8px] md:text-[10px] text-on-surface-variant tracking-wider mb-2 md:mb-3">FORMATION</h3>
            <div className="flex flex-wrap gap-1 md:gap-2">
              {FORMATIONS.map(f => (
                <motion.button key={f} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className={`px-1.5 md:px-3 py-1 md:py-2 rounded-lg font-label-caps text-[7px] md:text-[10px] transition-all ${
                    formation === f ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/20'
                  }`}
                  onClick={() => handleSetFormation(f)} disabled={squadConfirmed}>
                  {f}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-1 md:gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-1 md:gap-2">
              {!squadConfirmed && (
                <>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="px-2 md:px-6 py-1 md:py-2.5 rounded-lg font-label-caps text-[7px] md:text-[10px] tracking-wider"
                    style={{background: 'linear-gradient(135deg, var(--primary), #d4a832)', color: 'var(--text-on-primary)', border: 'none'}}
                    onClick={handleBestXI} disabled={team?.players?.length < 11}>
                    AUTO XI
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="px-2 md:px-6 py-1 md:py-2.5 rounded-lg bg-surface-container-highest text-error font-label-caps text-[7px] md:text-[10px] border border-error/30 hover:bg-error/10 transition-all"
                    onClick={handleReset}>
                    RESET
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="px-2 md:px-6 py-1 md:py-2.5 rounded-lg bg-surface-container-highest text-primary font-label-caps text-[7px] md:text-[10px] border border-primary/30 hover:bg-primary/10 transition-all"
                    onClick={() => setShowManagerModal(true)}>
                    MANAGER
                  </motion.button>
                </>
              )}
            </div>
            <div className="flex gap-1 md:gap-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="px-2 md:px-6 py-1 md:py-2.5 rounded-lg bg-surface-container-highest text-on-surface-variant font-label-caps text-[7px] md:text-[10px] border border-outline-variant/20 hover:bg-surface-container-high transition-all"
                onClick={() => navigate(`/room/${id}`)}>
                BACK
              </motion.button>
              {!squadConfirmed && (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="px-3 md:px-7 py-1 md:py-2.5 rounded-lg font-label-caps text-[7px] md:text-[10px] tracking-wider text-on-secondary"
                  style={{background: 'linear-gradient(135deg, var(--secondary), #c89b2a)', border: 'none'}}
                  onClick={handleConfirm} disabled={confirming}>
                  {confirming ? 'CONFIRM...' : 'CONFIRM'}
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Manager Selection Modal */}
        <AnimatePresence>
          {showManagerModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4"
              style={{background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)'}}
              onClick={() => setShowManagerModal(false)}>
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="glass-panel rounded-xl md:rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-4 md:p-6"
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-headline-lg text-primary italic text-base md:text-lg">SELECT MANAGER</h3>
                  <button onClick={() => setShowManagerModal(false)} className="p-1">
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {managers.map(mgr => {
                    const isSelected = currentManager?._id === mgr._id;
                    return (
                      <motion.div key={mgr._id} whileHover={{ scale: 1.02 }}
                        className={`p-3 md:p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected ? 'border-primary bg-primary/10' : 'border-outline-variant/20 bg-surface-container-low hover:bg-surface-container'
                        }`}
                        onClick={() => {
                          roomAPI.setManager(id, mgr._id).then(({ data }) => {
                            setTeam(data);
                            setShowManagerModal(false);
                            if (mgr.preferredFormation) setFormation(mgr.preferredFormation);
                          }).catch(() => showMessage('error', 'Error setting manager'));
                        }}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-headline-sm text-primary shrink-0 text-sm">
                            {getInitials(mgr.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-headline-sm text-xs text-on-surface truncate">{mgr.name}</h5>
                            <p className="font-label-caps text-[8px] text-on-surface-variant">{mgr.nationality}</p>
                          </div>
                          <span className="font-headline-lg text-primary text-sm">{mgr.rating}</span>
                        </div>
                        <div className="flex justify-between text-[9px]">
                          <span className="font-label-caps text-on-surface-variant">{mgr.tacticalStyle}</span>
                          <span className="font-label-caps text-secondary-fixed">{mgr.preferredFormation}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragId && activeDragData?.type === 'bench' ? (
            <div className="bg-surface-container/90 backdrop-blur-md border border-primary/40 rounded-lg px-2 py-1.5 flex items-center gap-1.5 shadow-2xl">
              <span className="font-label-caps text-[9px] text-on-surface truncate max-w-[80px]">
                {subs.find(e => e.player?._id === activeDragData.playerId)?.player?.name}
              </span>
              <span className="font-label-caps text-[8px] text-primary shrink-0">
                {subs.find(e => e.player?._id === activeDragData.playerId)?.player?.overall}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </div>

      <style>{`
        .glass-panel { background: rgba(53, 53, 52, 0.4); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(77, 70, 53, 0.3); }
      `}</style>
    </DndContext>
  );
}
