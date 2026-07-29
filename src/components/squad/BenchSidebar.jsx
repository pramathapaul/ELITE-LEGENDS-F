import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';

function BenchPlayer({ entry, index, squadConfirmed, onPromote }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `bench-${entry.player?._id}`,
    data: { type: 'bench', playerId: entry.player?._id, index },
    disabled: squadConfirmed,
  });

  const posShort = entry.player?.position === 'Goalkeeper' ? 'GK' : entry.player?.position === 'Defender' ? 'DEF' : entry.player?.position === 'Midfielder' ? 'MID' : 'FWD';

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}
      style={{ touchAction: 'none', ...(transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 } : {}) }}
      className={`rounded-lg ${isDragging ? 'opacity-30' : ''}`}
      onClick={(e) => { if (!squadConfirmed) { e.stopPropagation(); onPromote(entry.player?._id); } }}
    >
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.2 }}
        className={`flex items-center gap-1 px-1.5 py-1 md:px-2 md:py-1.5 rounded-lg cursor-grab active:cursor-grabbing border border-transparent hover:border-primary/20 group ${isDragging ? '' : 'bg-surface-container-low hover:bg-surface-container'}`}
      >
        <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full shrink-0" style={{backgroundColor: entry.player?.position === 'Goalkeeper' ? '#fbbf24' : entry.player?.position === 'Defender' ? '#60a5fa' : entry.player?.position === 'Midfielder' ? '#34d399' : '#f472b6'}}></div>
        <span className="font-label-caps text-[9px] md:text-xs text-on-surface truncate flex-1 min-w-0">{entry.player?.name}</span>
        <span className="font-label-caps text-[6px] md:text-[8px] text-on-surface-variant shrink-0">{posShort}</span>
        <span className="font-label-caps text-[7px] md:text-[9px] text-primary shrink-0">{entry.player?.overall}</span>
        {!squadConfirmed && (
          <button className="px-1 md:px-1.5 py-0.5 bg-primary/10 text-primary font-label-caps text-[6px] md:text-[8px] rounded-md hover:bg-primary/20 transition-colors shrink-0"
            onClick={(e) => { e.stopPropagation(); onPromote(entry.player?._id); }}>
            ↑
          </button>
        )}
      </motion.div>
    </div>
  );
}

const POSITION_GROUPS = [
  { key: 'Goalkeeper', label: 'Goalkeepers' },
  { key: 'Defender', label: 'Defenders' },
  { key: 'Midfielder', label: 'Midfielders' },
  { key: 'Forward', label: 'Forwards' },
];

export default function BenchSidebar({ subs, squadConfirmed, onPromote }) {
  const [collapsedGroups, setCollapsedGroups] = useState({
    'Goalkeeper': true,
    'Defender': true,
    'Midfielder': true,
    'Forward': true,
  });

  const toggleGroup = (key) => setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="flex items-center gap-1.5 p-2 md:p-4 border-b border-outline-variant/10">
        <span className="material-symbols-outlined text-xs md:text-base text-primary" style={{fontVariationSettings: "'FILL' 1"}}>groups</span>
        <h3 className="font-label-caps text-[9px] md:text-xs text-on-surface-variant tracking-wider">BENCH</h3>
        <span className="font-label-caps text-[8px] md:text-[9px] text-primary">{subs.length} Players</span>
      </div>

      <div className="p-1.5 md:p-3 space-y-1 max-h-[calc(100vh-300px)] md:max-h-[calc(100vh-280px)] overflow-y-auto">
        {subs.length === 0 ? (
          <p className="text-on-surface-variant opacity-40 font-label-caps text-[10px] text-center py-6">No substitutes</p>
        ) : (
          <>
            <div className="text-center pb-0.5 md:pb-1">
              <span className="font-label-caps text-[6px] md:text-[7px] text-on-surface-variant/30">Drag to pitch or tap ↑</span>
            </div>
            {POSITION_GROUPS.map(group => {
            const groupPlayers = subs.filter(e => e.player?.position === group.key);
            if (groupPlayers.length === 0) return null;
            const isCollapsed = collapsedGroups[group.key];
            return (
              <div key={group.key}>
                <button className="flex items-center gap-1 w-full py-1 md:py-1.5 px-1 rounded-md hover:bg-surface-container-highest transition-colors"
                  onClick={() => toggleGroup(group.key)}>
                  <span className="material-symbols-outlined text-[10px] md:text-[12px] text-on-surface-variant" style={{transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s'}}>
                    expand_more
                  </span>
                  <span className="font-label-caps text-[7px] md:text-[8px] text-on-surface-variant/60 tracking-wider">{group.label}</span>
                  <span className="font-label-caps text-[7px] md:text-[8px] text-on-surface-variant/40 ml-auto">{groupPlayers.length}</span>
                </button>
                <AnimatePresence>
                  {!isCollapsed && groupPlayers.map((entry, bi) => (
                    <BenchPlayer key={entry.player?._id} entry={entry} index={bi} squadConfirmed={squadConfirmed} onPromote={onPromote} />
                  ))}
                </AnimatePresence>
              </div>
            );
          })}
          </>
        )}
      </div>
    </div>
  );
}
