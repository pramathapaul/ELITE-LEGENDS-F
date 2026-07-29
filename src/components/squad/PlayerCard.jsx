import { motion } from 'framer-motion';
import { getPlayerImageUrl } from '../../utils/playerImage';

export default function PlayerCard({ player, winningBid, compact, onPromote, onRemove, onClick, slotLabel, isDragging, dragOverlay }) {
  const posShort = player?.position === 'Goalkeeper' ? 'GK' : player?.position === 'Defender' ? 'DEF' : player?.position === 'Midfielder' ? 'MID' : 'FWD';

  const cardClass = compact
    ? 'flex items-center gap-2.5 px-3 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container'
    : 'flex flex-col items-center justify-end p-2 rounded-xl bg-surface-container/80 backdrop-blur-sm border border-primary/20';

  return (
    <motion.div
      layout
      initial={dragOverlay ? { scale: 1 } : { opacity: 0, y: 10 }}
      animate={dragOverlay ? { scale: 1.05 } : { opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`${cardClass} ${isDragging ? 'opacity-40' : ''} ${!compact ? 'w-full aspect-[3/4] relative cursor-grab active:cursor-grabbing group' : 'cursor-pointer hover:bg-surface-container transition-colors'}`}
      whileHover={!compact ? { y: -4, scale: 1.03 } : {}}
      onClick={onClick}
    >
      {compact ? (
        <>
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-outline-variant/30">
            <img src={getPlayerImageUrl(player)} alt={player?.name} className="w-full h-full object-cover" />
          </div>
          <span className="font-label-caps text-xs text-on-surface truncate flex-1 min-w-0">{player?.name}</span>
          <span className="font-label-caps text-[10px] text-on-surface-variant shrink-0">{posShort}</span>
          <span className="font-label-caps text-[10px] text-primary shrink-0">{player?.overall}</span>
          {onPromote && (
            <button className="px-2.5 py-1 bg-primary/20 text-primary font-label-caps text-[9px] rounded-md hover:bg-primary/30 transition-colors shrink-0" onClick={(e) => { e.stopPropagation(); onPromote(); }}>
              PROMOTE
            </button>
          )}
        </>
      ) : (
        <>
          {slotLabel && <span className="absolute top-1 left-1.5 font-label-caps text-[8px] text-primary/50">{slotLabel}</span>}
          <div className="w-7 h-7 md:w-9 md:h-9 rounded-full overflow-hidden border border-primary/30 mb-1 shrink-0">
            <img src={getPlayerImageUrl(player)} alt={player?.name} className="w-full h-full object-cover" />
          </div>
          <span className="font-label-caps text-[9px] md:text-[10px] text-on-surface text-center leading-tight w-full truncate">{player?.name}</span>
          <span className="font-label-caps text-[9px] text-secondary-fixed">{player?.overall}</span>
          {onRemove && (
            <button className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}>
              <span className="material-symbols-outlined" style={{fontSize: '10px', color: 'white'}}>close</span>
            </button>
          )}
        </>
      )}
    </motion.div>
  );
}
