import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomAPI } from '../services/api';
import { getPlayerImageUrl } from '../utils/playerImage';

export default function MyTeams() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    roomAPI.getMyTeams()
      .then(({ data }) => setTeams(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatMoney = (n) => {
    if (!n) return '$0';
    if (n >= 1000000000) return `$${(n / 1000000000).toFixed(2)}B`;
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    return `$${n.toLocaleString()}`;
  };

  const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  if (loading) return <div className="loading-stitch"><div className="spinner-stitch"></div></div>;

  if (teams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-4xl text-outline">sports_soccer</span>
        </div>
        <h4 className="font-headline-lg text-on-surface-variant mb-2">No Teams Yet</h4>
        <p className="text-on-surface-variant opacity-60 mb-6">Join an auction room to start building your squad</p>
        <button className="btn-primary-glow" style={{fontSize: '14px', padding: '12px 24px'}} onClick={() => navigate('/join-room')}>
          JOIN A ROOM
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="squad-header-banner">
        <div className="gold-shimmer absolute top-0 left-0 w-full h-[3px]"></div>
        <h1 className="font-headline-xl text-primary italic tracking-tight" style={{fontSize: 'clamp(28px, 5vw, 48px)'}}>
          MY SQUADS
        </h1>
        <p className="text-on-surface-variant font-body-md mt-2 opacity-70">{teams.length} team{teams.length > 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {teams.map((team) => {
          const starters = team.players?.filter(p => p.status === 'starter') || [];
          const substitutes = team.players?.filter(p => p.status === 'substitute') || [];
          const totalOvr = team.totalRating || 0;
          const avgRtg = team.avgRating || 0;
          const squadVal = team.squadValue || team.players?.reduce((s, p) => s + (p.winningBid || 0), 0) || 0;
          const manager = team.manager;
          const formation = team.formation || '4-3-3';

          return (
            <div key={team._id} className="glass-panel rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-300 hover:translate-y-[-4px]" style={{border: '1px solid var(--text-outline-variant)'}}>
              {/* Team Header */}
              <div className="p-5" style={{background: 'linear-gradient(180deg, rgba(242,202,80,0.05) 0%, transparent 100%)'}}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-label-caps text-[10px] text-primary tracking-wider">{team.room?.name || 'Unknown Room'}</span>
                  {team.squadConfirmed && (
                    <span className="bg-secondary-fixed/20 text-secondary-fixed px-3 py-1 font-label-caps text-[8px] rounded-full">CONFIRMED</span>
                  )}
                </div>
                <h3 className="font-headline-lg text-on-surface">TEAM RATING: {totalOvr}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <span className="font-label-caps text-[10px] text-secondary-fixed">{formation}</span>
                  <span className="font-label-caps text-[10px] text-on-surface-variant">{starters.length} XI / {substitutes.length} BEN</span>
                  <span className="font-label-caps text-[10px] text-primary">AVG {avgRtg}</span>
                </div>
              </div>

              {/* Manager */}
              {manager && (
                <div className="px-5 py-3 flex items-center gap-3" style={{borderTop: '1px solid rgba(77,70,53,0.1)'}}>
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-label-caps text-[10px] text-primary shrink-0">
                    {getInitials(manager.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-label-caps text-[10px] text-on-surface truncate">{manager.name}</p>
                    <p className="font-label-caps text-[8px] text-on-surface-variant">{manager.nationality} &bull; {manager.tacticalStyle}</p>
                  </div>
                  <span className="font-headline-sm text-primary">{manager.rating}</span>
                </div>
              )}

              {/* Mini Pitch Preview */}
              <div className="px-5 py-4" style={{borderTop: '1px solid rgba(77,70,53,0.1)'}}>
                <div className="flex flex-wrap gap-1.5 justify-center" style={{minHeight: '60px'}}>
                  {starters.slice(0, 11).map((entry, i) => (
                    <div key={entry.player?._id || i} className="w-4 h-4 rounded-full overflow-hidden border border-primary/30 shrink-0"
                      title={`${entry.player?.name} (${entry.player?.overall})`}>
                      {entry.player ? (
                        <img src={getPlayerImageUrl(entry.player)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-surface-container-highest flex items-center justify-center font-label-caps text-[8px]">?</div>
                      )}
                    </div>
                  ))}
                  {substitutes.length > 0 && (
                    <div className="w-8 h-8 rounded-full bg-surface-container-low border border-dashed border-outline-variant flex items-center justify-center font-label-caps text-[8px] text-on-surface-variant">
                      +{substitutes.length}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats + Actions */}
              <div className="p-5 grid grid-cols-3 gap-3" style={{borderTop: '1px solid rgba(77,70,53,0.1)'}}>
                <div className="text-center">
                  <p className="font-label-caps text-[8px] text-on-surface-variant">VALUE</p>
                  <p className="font-label-caps text-[10px] text-secondary-fixed">{formatMoney(squadVal)}</p>
                </div>
                <div className="text-center">
                  <p className="font-label-caps text-[8px] text-on-surface-variant">SPENT</p>
                  <p className="font-label-caps text-[10px] text-on-surface">{formatMoney(team.totalSpent)}</p>
                </div>
                <div className="text-center">
                  <p className="font-label-caps text-[8px] text-on-surface-variant">BUDGET</p>
                  <p className="font-label-caps text-[10px] text-primary">{formatMoney(team.remainingBudget)}</p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button className="w-full py-3 bg-primary/20 text-primary font-label-caps text-[10px] tracking-wider rounded-lg hover:bg-primary/30 transition-all active:scale-95" style={{border: '1px solid var(--primary)'}}
                  onClick={() => navigate(`/room/${team.room?._id}/manage`)}>
                  MANAGE SQUAD
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .squad-header-banner { background: rgba(53, 53, 52, 0.4); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(77, 70, 53, 0.3); padding: 32px; border-radius: 0.75rem; position: relative; overflow: hidden; }
        @media (min-width: 768px) { .squad-header-banner { padding: 40px; } }
        .gold-shimmer { background: linear-gradient(90deg, transparent, rgba(233, 195, 73, 0.2), transparent); background-size: 200% 100%; animation: shimmer 3s infinite; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
    </div>
  );
}
