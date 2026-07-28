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
    <div className="space-y-16">
      {teams.map((team) => {
        const starters = team.players?.filter(p => p.status === 'starter') || [];
        const substitutes = team.players?.filter(p => p.status === 'substitute') || [];
        const totalOvr = team.totalRating || 0;

        return (
          <div key={team._id} className="section-spacing">
            {/* Squad Header */}
            <section className="relative z-20 mb-10">
              <div className="squad-header-banner">
                <div className="gold-shimmer absolute top-0 left-0 w-full h-[3px]"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                      <span className="bg-secondary-fixed text-on-secondary-fixed px-4 py-1.5 font-label-caps text-[10px] rounded-full tracking-wider">SQUAD COMPLETE</span>
                      <span className="text-on-surface-variant font-label-caps text-[10px] tracking-wider">{team.room?.name || 'Unknown Room'}</span>
                    </div>
                    <h1 className="font-headline-xl text-primary italic tracking-tight" style={{fontSize: 'clamp(36px, 6vw, 56px)'}}>
                      TEAM RATING: {totalOvr}
                    </h1>
                    <p className="text-on-surface-variant font-body-md mt-2 opacity-70">{starters.length} starters · {substitutes.length} substitutes</p>
                  </div>
                  <div className="grid grid-cols-2 gap-10 md:text-right">
                    <div>
                      <p className="font-label-caps text-on-surface-variant mb-1.5 tracking-wider">TOTAL SPENT</p>
                      <p className="font-headline-lg text-on-surface tabular-nums">{formatMoney(team.totalSpent)}</p>
                    </div>
                    <div>
                      <p className="font-label-caps text-on-surface-variant mb-1.5 tracking-wider">REMAINING</p>
                      <p className="font-headline-lg text-secondary-fixed-dim tabular-nums">{formatMoney(team.remainingBudget)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Pitch Formation (4-3-3) */}
            <section className="relative flex items-center justify-center mb-10 rounded-2xl overflow-hidden" style={{background: 'rgba(14,14,14,0.5)'}}>
              <div className="absolute inset-0 pitch-grid opacity-20"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(70vw,700px)] h-[min(70vw,700px)] border-2 border-secondary-fixed/10 rounded-full pointer-events-none"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(50vw,500px)] h-[min(50vw,500px)] border border-secondary-fixed/5 rounded-full pointer-events-none"></div>

              <div className="w-full max-w-5xl grid grid-rows-4 gap-y-6 sm:gap-y-8 md:gap-y-16 items-center relative z-10 py-8 sm:py-10 md:py-16 px-2 sm:px-4">
                {/* Forwards (3) */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8 justify-items-center">
                  {['LW', 'ST', 'RW'].map((pos, i) => {
                    const p = starters[i];
                    return (
                      <div key={pos} className="relative group player-card-shadow transition-all duration-500 hover:scale-105 hover:-translate-y-3 w-full max-w-[180px]">
                        <div className={`w-full aspect-[3/4] ${i === 1 ? 'bg-surface-container/80 border-2 border-primary' : 'bg-surface-container/60 border border-primary/30'} backdrop-blur-xl rounded-2xl p-3 sm:p-4 md:p-5 flex flex-col items-center justify-end overflow-hidden relative`}>
                          {i === 1 && <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>}
                          {p?.player && <img src={getPlayerImageUrl(p.player)} alt={p.player.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full object-cover border-2 border-primary/40 mb-2"
                            style={{boxShadow: '0 0 15px rgba(242,202,80,0.2)'}} />}
                          <div className="relative z-10 text-center">
                            <span className="font-label-caps text-[10px] text-primary tracking-wider">{pos}</span>
                            <h4 className="font-headline-sm text-sm text-on-surface truncate mt-1">{p?.player?.name || 'EMPTY'}</h4>
                            <div className="flex justify-between items-center mt-2">
                              <span className="font-label-caps text-secondary-fixed text-[11px]">{p?.player?.overall || '—'} OVR</span>
                              <span className="font-label-caps text-on-surface-variant text-[10px]">{formatMoney(p?.winningBid)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Midfield (3) */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8 justify-items-center">
                  {['CM', 'CDM', 'CM'].map((pos, i) => {
                    const p = starters[i + 3];
                    return (
                      <div key={pos} className="relative group transition-all duration-500 hover:scale-105 hover:-translate-y-2 w-full max-w-[160px]">
                        <div className="w-full aspect-[3/4] bg-surface-container-low/60 backdrop-blur-md border border-outline-variant/30 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-end overflow-hidden relative">
                          <div className="relative z-10 text-center">
                            {p?.player && <img src={getPlayerImageUrl(p.player)} alt={p.player.name}
                              className="w-9 h-9 sm:w-10 sm:h-10 md:w-14 md:h-14 rounded-full object-cover border border-outline-variant/50 mb-2 mx-auto" />}
                            <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">{pos}</span>
                            <h4 className="font-body-md font-bold text-sm text-on-surface truncate mt-1">{p?.player?.name || 'EMPTY'}</h4>
                            <div className="flex justify-between items-center mt-2">
                              <span className="font-label-caps text-[10px] text-secondary-fixed">{p?.player?.overall || '—'}</span>
                              <span className="font-label-caps text-[10px] text-on-surface-variant">{formatMoney(p?.winningBid)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Defenders (4) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-6 justify-items-center">
                  {['LB', 'CB', 'CB', 'RB'].map((pos, i) => {
                    const p = starters[i + 6];
                    return (
                      <div key={pos} className="relative group transition-all duration-500 hover:scale-105 hover:-translate-y-2 w-full max-w-[140px]">
                        <div className="w-full aspect-[3/4] bg-surface-container-lowest/60 backdrop-blur-sm border border-outline-variant/20 rounded-xl p-2 sm:p-3 flex flex-col items-center justify-end overflow-hidden relative">
                          <div className="relative z-10 text-center">
                            {p?.player && <img src={getPlayerImageUrl(p.player)} alt={p.player.name}
                              className="w-8 h-8 sm:w-9 sm:h-9 md:w-12 md:h-12 rounded-full object-cover border border-outline-variant/30 mb-1 mx-auto" />}
                            <span className="font-label-caps text-[8px] text-on-surface-variant tracking-wider">{pos}</span>
                            <h4 className="font-label-caps text-[11px] text-on-surface truncate mt-1">{p?.player?.name || 'EMPTY'}</h4>
                            <span className="font-label-caps text-[8px] text-secondary-fixed mt-1 block">{p?.player?.overall || '—'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Goalkeeper (1) */}
                <div className="grid grid-cols-1 justify-items-center">
                  {(() => {
                    const p = starters[10];
                    return (
                      <div className="relative group transition-all duration-500 hover:scale-105 hover:-translate-y-2 w-full max-w-[160px]" style={{filter: 'drop-shadow(0 0 30px rgba(114,255,112,0.15))'}}>
                        <div className="w-full aspect-[3/4] bg-surface-container-low/60 backdrop-blur-md border border-outline-variant/30 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-end overflow-hidden relative">
                          <div className="relative z-10 text-center">
                            {p?.player && <img src={getPlayerImageUrl(p.player)} alt={p.player.name}
                              className="w-9 h-9 sm:w-10 sm:h-10 md:w-14 md:h-14 rounded-full object-cover border-2 border-secondary-fixed/30 mb-2 mx-auto"
                              style={{boxShadow: '0 0 15px rgba(114,255,112,0.15)'}} />}
                            <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">GK</span>
                            <h4 className="font-body-md font-bold text-sm text-on-surface truncate mt-1">{p?.player?.name || 'EMPTY'}</h4>
                            <div className="flex justify-between items-center mt-2">
                              <span className="font-label-caps text-[10px] text-secondary-fixed">{p?.player?.overall || '—'}</span>
                              <span className="font-label-caps text-[10px] text-on-surface-variant">{formatMoney(p?.winningBid)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </section>

            {/* Substitutes */}
            {substitutes.length > 0 && (
              <div className="glass-panel p-6 md:p-8 rounded-xl mb-10">
                <h4 className="font-label-caps text-on-surface-variant mb-6 flex items-center gap-2 tracking-wider">
                  <span className="material-symbols-outlined" style={{fontSize: '18px', fontVariationSettings: "'FILL' 1"}}>groups</span>
                  SUBSTITUTES ({substitutes.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                  {substitutes.map((entry, i) => (
                    <div key={i} className="bg-surface-container-low hover:bg-surface-container rounded-xl p-4 border border-outline-variant/20 flex items-center gap-3 transition-all hover:border-primary/30">
                      {entry.player ? (
                        <img src={getPlayerImageUrl(entry.player)} alt={entry.player.name}
                          className="w-11 h-11 rounded-full object-cover shrink-0 border border-outline-variant/30" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-surface-container-highest flex items-center justify-center font-label-caps text-[11px] text-on-surface-variant shrink-0">?</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-label-caps text-[12px] text-on-surface truncate">{entry.player?.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-label-caps text-[8px] text-primary">{entry.player?.overall || '—'} OVR</span>
                          <span className="text-outline-variant text-[6px]">|</span>
                          <span className="font-label-caps text-[8px] text-on-surface-variant">{formatMoney(entry.winningBid)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center max-w-lg mx-auto">
              <button className="flex-1 py-5 bg-primary text-on-primary font-headline-sm tracking-tighter transition-all hover:scale-105 active:scale-95 rounded-xl text-sm" style={{border: 'none', boxShadow: '0 0 30px rgba(242,202,80,0.3)'}}
                onClick={() => navigate(`/room/${team.room?._id}`)}>
                BACK TO ROOM
              </button>
              <button className="flex-1 py-5 bg-surface-container-highest text-on-surface font-headline-sm tracking-tighter transition-all hover:bg-surface-container-high active:scale-95 rounded-xl text-sm" style={{border: '1px solid var(--text-outline)'}}
                onClick={() => navigate('/dashboard')}>
                DASHBOARD
              </button>
            </div>
          </div>
        );
      })}

      <style>{`
        .squad-header-banner { background: rgba(53, 53, 52, 0.4); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(77, 70, 53, 0.3); padding: 32px; border-radius: 0.75rem; position: relative; overflow: hidden; }
        @media (min-width: 768px) { .squad-header-banner { padding: 40px; } }
        .pitch-grid { background-image: linear-gradient(rgba(114, 255, 112, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(114, 255, 112, 0.05) 1px, transparent 1px); background-size: 40px 40px; }
        .player-card-shadow { box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.8), 0 0 15px rgba(233, 195, 73, 0.1); }
        .gold-shimmer { background: linear-gradient(90deg, transparent, rgba(233, 195, 73, 0.2), transparent); background-size: 200% 100%; animation: shimmer 3s infinite; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
    </div>
  );
}
