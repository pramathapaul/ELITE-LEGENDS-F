import { motion } from 'framer-motion';

function CircularProgress({ value, max, size = 60, strokeWidth = 5, label, color = 'var(--primary)' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference - progress * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <motion.span
        className="font-headline-sm text-on-surface tabular-nums"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        key={value}
      >
        {value}
      </motion.span>
      <span className="font-label-caps text-[8px] text-on-surface-variant text-center">{label}</span>
    </div>
  );
}

const formatMoney = (n) => {
  if (!n) return '$0';
  if (n >= 1000000000) return `$${(n / 1000000000).toFixed(2)}B`;
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

export default function TeamStats({ team, starters, subs, squadValue, avgRating, totalRating, remainingBudget, formation, manager }) {
  const stats = [
    { label: 'TEAM RATING', value: totalRating, highlight: 'text-primary' },
    { label: 'AVG RATING', value: avgRating, highlight: 'text-on-surface' },
    { label: 'CHEMISTRY', value: team?.players?.length >= 11 ? '92' : team?.players?.length >= 5 ? '68' : '24', highlight: 'text-secondary-fixed' },
  ];

  const maxRating = 99 * 11;
  const ratingProgress = Math.min(totalRating / maxRating * 100, 100);

  return (
    <div className="space-y-3">
      {/* Circular progress row */}
      <div className="glass-panel p-4 rounded-xl">
        <div className="flex justify-around">
          <CircularProgress value={totalRating} max={1100} size={64} label="TEAM RATING" color="var(--primary)" />
          <CircularProgress value={avgRating} max={99} size={64} label="AVG RATING" color="var(--secondary-fixed)" />
          <CircularProgress value={team?.players?.length >= 11 ? 92 : team?.players?.length >= 5 ? 68 : 24} max={100} size={64} label="CHEMISTRY" color="var(--secondary-fixed-dim)" />
        </div>
      </div>

      {/* Info rows */}
      <div className="glass-panel p-4 rounded-xl space-y-2.5">
        {[
          { label: 'FORMATION', value: formation || '4-3-3' },
          { label: 'MANAGER', value: manager?.name || 'None' },
          { label: 'CAPTAIN', value: starters?.[0]?.player?.name || 'None' },
          { label: 'STARTING XI', value: `${starters.length}/11` },
          { label: 'BENCH', value: `${subs.length}/11` },
          { label: 'TOTAL', value: `${team?.players?.length || 0}/22` },
        ].map(s => (
          <motion.div key={s.label} className="flex justify-between items-center" layout>
            <span className="font-label-caps text-[9px] text-on-surface-variant">{s.label}</span>
            <motion.span className="font-label-caps text-[10px] text-on-surface" key={s.value} initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              {s.value}
            </motion.span>
          </motion.div>
        ))}
      </div>

      {/* Value & Budget */}
      <div className="glass-panel p-4 rounded-xl space-y-2.5">
        {[
          { label: 'SQUAD VALUE', value: formatMoney(squadValue), color: 'text-secondary-fixed' },
          { label: 'REMAINING', value: formatMoney(remainingBudget), color: 'text-secondary-fixed-dim' },
        ].map(s => (
          <motion.div key={s.label} className="flex justify-between items-center" layout>
            <span className="font-label-caps text-[9px] text-on-surface-variant">{s.label}</span>
            <motion.span className={`font-headline-sm text-xs ${s.color}`} key={s.value} initial={{ scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              {s.value}
            </motion.span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
