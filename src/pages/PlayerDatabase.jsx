import { useState, useEffect } from 'react';
import { playerAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { getPlayerImageUrl } from '../utils/playerImage';

const POSITIONS = ['', 'Goalkeeper', 'Defender', 'Midfielder', 'Forward'];
const RARITIES = ['', 'Legend', 'Icon', 'Hero'];

const SKELETON_COUNT = 12;

function SkeletonCard() {
  return (
    <div className="player-card-stitch" style={{ opacity: 0.5, pointerEvents: 'none' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(18,20,29,0.6)', margin: '0 auto 12px' }} />
      <div style={{ height: 14, width: '70%', background: 'rgba(18,20,29,0.6)', borderRadius: 4, margin: '0 auto 8px' }} />
      <div style={{ height: 10, width: '50%', background: 'rgba(18,20,29,0.6)', borderRadius: 4, margin: '0 auto 4px' }} />
      <div style={{ height: 24, width: '30%', background: 'rgba(18,20,29,0.6)', borderRadius: 4, margin: '8px auto 0' }} />
    </div>
  );
}

function PlayerModal({ player, onClose }) {
  if (!player) return null;
  const formatMoney = (n) => {
    if (!n) return '$0';
    if (n >= 1000000000) return `$${(n / 1000000000).toFixed(2)}B`;
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    return `$${n.toLocaleString()}`;
  };
  const getPosColor = (pos) => {
    const map = { Goalkeeper: '#2ecc71', Defender: '#3498db', Midfielder: '#9b59b6', Forward: '#e94560' };
    return map[pos] || '#fff';
  };
  const getPosIcon = (pos) => {
    const map = { Goalkeeper: 'shield', Defender: 'grid_view', Midfielder: 'moving', Forward: 'sports_soccer' };
    return map[pos] || 'person';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-glass" onClick={e => e.stopPropagation()}>
        <div className="modal-glass-header">
          <h2 className="font-headline-sm text-on-surface">{player.name}</h2>
          <button className="btn-close-stitch" onClick={onClose}>
            <span className="material-symbols-outlined" style={{fontSize: '20px'}}>close</span>
          </button>
        </div>
        <div className="modal-glass-body">
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '32px'}}>
            <div className="text-center">
              <img src={getPlayerImageUrl(player)} alt={player.name}
                style={{
                  width: 180, height: 180, borderRadius: '50%',
                  objectFit: 'cover', display: 'block',
                  margin: '0 auto', boxShadow: `0 0 40px ${getPosColor(player.position)}44`,
                  border: `3px solid ${getPosColor(player.position)}`,
                }} />
              {player.nickname && (
                <div className="text-on-surface-variant font-body-md italic mt-2">"{player.nickname}"</div>
              )}
              <div className="mt-4 flex gap-2 justify-center">
                <span className={`badge-position-stitch ${{
                  Goalkeeper: 'badge-gk', Defender: 'badge-def', Midfielder: 'badge-mid', Forward: 'badge-fwd'
                }[player.position] || ''}`} style={{fontSize: '12px', padding: '6px 16px'}}>
                  <span className="material-symbols-outlined" style={{fontSize: '12px', marginRight: 4, verticalAlign: 'middle'}}>{getPosIcon(player.position)}</span>
                  {player.position}
                </span>
              </div>
              <div className="mt-2">
                <span className="badge-position-stitch" style={{background: 'rgba(243,156,18,0.2)', color: '#f39c12', padding: '6px 16px'}}>
                  {player.rarity}
                </span>
              </div>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
              <div>
                <div className="stat-label">Overall Rating</div>
                <div className="font-headline-xl" style={{color: getPosColor(player.position)}}>
                  {player.overall}
                </div>
              </div>
              <div>
                <div className="stat-label">Base Price</div>
                <div className="font-label-price text-on-surface">{formatMoney(player.basePrice)}</div>
              </div>
              <div>
                <div className="stat-label">Country</div>
                <div className="font-body-md font-bold text-on-surface">{player.country}</div>
              </div>
              <div>
                <div className="stat-label">Preferred Foot</div>
                <div className="font-body-md font-bold text-on-surface">{player.preferredFoot}</div>
              </div>
              <div>
                <div className="stat-label">Peak Club</div>
                <div className="font-body-md font-bold text-on-surface">{player.peakClub}</div>
              </div>
              <div>
                <div className="stat-label">Age at Retirement</div>
                <div className="font-body-md font-bold text-on-surface">{player.ageAtRetirement || 'N/A'}</div>
              </div>
              {player.ballonDor > 0 && (
                <div style={{gridColumn: '1 / -1'}}>
                  <div className="stat-label">Ballon d'Or</div>
                  <div className="font-headline-sm" style={{color: '#f39c12'}}>
                    {'★'.repeat(player.ballonDor)}
                  </div>
                </div>
              )}
              {player.worldCupWinner && (
                <div style={{gridColumn: '1 / -1'}}>
                  <span className="badge-position-stitch" style={{background: 'rgba(243,156,18,0.2)', color: '#f39c12', padding: '6px 14px'}}>
                    <span className="material-symbols-outlined" style={{fontSize: '12px', marginRight: 4, verticalAlign: 'middle'}}>emoji_events</span>
                    World Cup Winner
                  </span>
                </div>
              )}
            </div>
          </div>
          {player.description && (
            <div className="mt-4 text-on-surface-variant font-body-md italic" style={{fontSize: '14px'}}>
              {player.description}
            </div>
          )}
          <div className="flex gap-4 flex-wrap mt-4">
            {player.championsLeague > 0 && (
              <span className="text-on-surface-variant font-label-caps" style={{fontSize: '10px'}}>UCL: {player.championsLeague}x</span>
            )}
            {player.leagueTitles > 0 && (
              <span className="text-on-surface-variant font-label-caps" style={{fontSize: '10px'}}>League: {player.leagueTitles}x</span>
            )}
            {player.internationalCaps > 0 && (
              <span className="text-on-surface-variant font-label-caps" style={{fontSize: '10px'}}>Caps: {player.internationalCaps} ({player.internationalGoals}g)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlayerDatabase() {
  const [players, setPlayers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('');
  const [rarity, setRarity] = useState('');
  const [country, setCountry] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  const [sort, setSort] = useState('rating_desc');
  const [page, setPage] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    playerAPI.getAll({ limit: 10000 })
      .then(({ data }) => {
        const unique = [...new Set((data.players || data).flatMap(p => p.country ? [p.country] : []))].sort();
        setCountries(unique);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setPage(1);
  }, [search, position, rarity, country, minRating, maxRating, sort]);

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 24 };
        if (search) params.search = search;
        if (position) params.position = position;
        if (rarity) params.rarity = rarity;
        if (country) params.country = country;
        if (minRating) params.minRating = minRating;
        if (maxRating) params.maxRating = maxRating;
        params.sort = sort;
        const { data } = await playerAPI.getAll(params);
        setPlayers(data.players);
        setPagination(data.pagination);
      } catch {}
      setLoading(false);
    };
    fetchPlayers();
  }, [page, search, position, rarity, country, minRating, maxRating, sort]);

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

  const formatMoney = (n) => {
    if (!n) return '$0';
    if (n >= 1000000000) return `$${(n / 1000000000).toFixed(2)}B`;
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    return `$${n.toLocaleString()}`;
  };

  const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-primary" style={{fontSize: '28px'}}>database</span>
        <div>
          <h1 className="font-headline-lg text-on-surface">Player Database</h1>
          <p className="font-body-md text-on-surface-variant">{pagination.total} retired football legends</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 md:p-5 rounded-xl mb-6">
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px'}}>
          <div className="filter-search-wrap" style={{gridColumn: 'span 2'}}>
            <span className="material-symbols-outlined text-on-surface-variant" style={{fontSize: '16px'}}>search</span>
            <input type="text" placeholder="Search by name..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && (
              <span className="material-symbols-outlined text-on-surface-variant" style={{fontSize: '16px', cursor: 'pointer'}}
                onClick={() => setSearch('')}>close</span>
            )}
          </div>
          <select className="select-glass" value={position} onChange={(e) => setPosition(e.target.value)}>
            <option value="">All Positions</option>
            {POSITIONS.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="select-glass" value={rarity} onChange={(e) => setRarity(e.target.value)}>
            <option value="">All Rarities</option>
            {RARITIES.filter(Boolean).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="select-glass" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">All Countries</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" className="input-glass-plain px-3 py-2.5 rounded-lg" placeholder="Min" value={minRating}
            onChange={(e) => setMinRating(e.target.value)} min={60} max={100} />
          <input type="number" className="input-glass-plain px-3 py-2.5 rounded-lg" placeholder="Max" value={maxRating}
            onChange={(e) => setMaxRating(e.target.value)} min={60} max={100} />
          <select className="select-glass" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="rating_desc">Rating ↓</option>
            <option value="rating_asc">Rating ↑</option>
            <option value="name">Name</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
          </select>
        </div>
      </div>

      {/* Player Grid */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px'}}>
        {loading ? (
          Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonCard key={i} />
          ))
        ) : players.length === 0 ? (
          <div style={{gridColumn: '1 / -1'}}>
            <div className="empty-state-stitch">
              <div className="empty-icon-stitch">🔍</div>
              <h4 className="font-headline-sm text-on-surface mb-2">No players found</h4>
              <p className="font-body-md text-on-surface-variant">Try different search or filters</p>
            </div>
          </div>
        ) : (
          players.map((player, i) => (
            <motion.div
              key={player._id}
              className="player-card-stitch"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (i % 24) * 0.02 }}
              onClick={() => setSelectedPlayer(player)}
            >
              <img src={getPlayerImageUrl(player)} alt={player.name}
                style={{width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', display: 'block', margin: '0 auto 12px'}} />
              <div className="player-name-stitch">{player.name}</div>
              <div className="font-label-caps text-on-surface-variant" style={{fontSize: '10px'}}>
                {player.country}
              </div>
              <div className="my-1">{getPositionBadge(player.position)}</div>
              <div className="player-rating-stitch">{player.overall}</div>
              <div className="font-label-caps text-on-surface-variant" style={{fontSize: '9px', marginTop: '4px'}}>
                {formatMoney(player.basePrice)}
              </div>
              <div className="font-label-caps text-on-surface-variant truncate" style={{fontSize: '8px', maxWidth: '100%'}}>
                {player.peakClub?.slice(0, 20)}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button className="btn-ghost-stitch" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <span className="material-symbols-outlined" style={{fontSize: '14px'}}>chevron_left</span>
            Prev
          </button>
          <span className="font-body-md text-on-surface-variant">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button className="btn-ghost-stitch" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>
            Next
            <span className="material-symbols-outlined" style={{fontSize: '14px'}}>chevron_right</span>
          </button>
        </div>
      )}

      <AnimatePresence>
        {selectedPlayer && (
          <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
