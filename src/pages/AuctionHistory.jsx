import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomAPI } from '../services/api';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiDownload } from 'react-icons/fi';

export default function AuctionHistory() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [historyRes, roomRes] = await Promise.all([
          roomAPI.getHistory(roomId),
          roomAPI.getById(roomId),
        ]);
        setHistory(historyRes.data);
        setRoom(roomRes.data);
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, [roomId]);

  const formatMoney = (n) => {
    if (!n) return '$0';
    if (n >= 1000000000) return `$${(n / 1000000000).toFixed(2)}B`;
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    return `$${n.toLocaleString()}`;
  };

  const exportCSV = () => {
    const headers = 'Player,Position,Winner,Winning Bid,Time\n';
    const rows = history.map((s) =>
      `"${s.player?.name}","${s.player?.position}","${s.winner?.username}","${formatMoney(s.winningBid)}","${new Date(s.soldAt).toLocaleString()}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${room?.name || 'auction'}-history.csv`;
    a.click();
  };

  if (loading) return <div className="loading-stitch"><div className="spinner-stitch"></div></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex justify-between items-start gap-4 mb-8">
        <div>
          <button className="btn-ghost-stitch mb-3" onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined" style={{fontSize: '14px'}}>arrow_back</span>
            Back
          </button>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary" style={{fontSize: '28px'}}>history</span>
            <h1 className="font-headline-lg text-on-surface">Auction History</h1>
          </div>
          {room && <p className="font-body-md text-on-surface-variant mt-1">{room.name} ({room.code})</p>}
        </div>
        <button className="btn-ghost-stitch shrink-0" onClick={exportCSV}>
          <span className="material-symbols-outlined" style={{fontSize: '14px'}}>download</span>
          Export CSV
        </button>
      </div>

      {history.length === 0 ? (
        <div className="empty-state-stitch">
          <div className="empty-icon-stitch">📋</div>
          <h4 className="font-headline-sm text-on-surface mb-2">No auction data</h4>
          <p className="font-body-md text-on-surface-variant">No players have been sold in this room yet</p>
        </div>
      ) : (
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table style={{
              width: '100%', borderCollapse: 'collapse',
              fontFamily: 'var(--font-body)', fontSize: '14px',
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(77,70,53,0.2)' }}>
                  {['#', 'Player', 'Position', 'Winner', 'Winning Bid', 'Time'].map(h => (
                    <th key={h} className="font-label-caps text-on-surface-variant p-4 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((sale, i) => (
                  <tr key={i} style={{
                    borderBottom: '1px solid rgba(77,70,53,0.1)',
                    transition: 'background 0.2s',
                  }}
                    className="hover:bg-surface-container-low"
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-container-low)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td className="p-4 text-on-surface-variant font-label-caps">{i + 1}</td>
                    <td className="p-4 font-body-md font-bold text-on-surface">{sale.player?.name}</td>
                    <td className="p-4">
                      <span className={`badge-position-stitch ${
                        sale.player?.position === 'Goalkeeper' ? 'badge-gk' :
                        sale.player?.position === 'Defender' ? 'badge-def' :
                        sale.player?.position === 'Midfielder' ? 'badge-mid' : 'badge-fwd'
                      }`}>
                        {sale.player?.position?.slice(0, 3).toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-primary font-label-caps">{sale.winner?.username}</td>
                    <td className="p-4 font-label-price text-on-surface tabular-nums">{formatMoney(sale.winningBid)}</td>
                    <td className="p-4 text-on-surface-variant font-body-md" style={{fontSize: '13px'}}>
                      {new Date(sale.soldAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
