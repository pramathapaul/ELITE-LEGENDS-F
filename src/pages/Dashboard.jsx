import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LABELS = { waiting: 'SCHEDULED', active: 'LIVE NOW', paused: 'PAUSED', ended: 'CLOSED' };
const STADIUM_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAy_g17h_12FRlHcA7WT6dZgzZ2QrIHh8temnlI4i8ewfu7lwc9xKJQA6eJj_X0fzBF9jKmfrLKSowECIzGiyNjkuneDMa-EcLRH-3PofPCkb0Z_gpAb8NVPltdX4wR5UTrNwJlQMMwi-8UBghqbeeF7xk6SYTnPfk7IS2glrD8tSga6zyitWd-AI028xwEQqFWnhe1urZWkBs2p5rGQr6cbUZziNkVSN8pOfb3b5nApQcsFvetoVVQPks67Xa5e9w2Kl9UMI0I2QM3',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA_mTV2HbH32pW4xD6Hobif605mToSq8wNrEm0z5K-R4w0v2ksWX_mmOEbg3Z-glz10kwQmFeo5wFgJok9TvXQllStiaCn65vom9zHvY5dCQJ8PXcfclF3ScxxJ5clMPu9llwz1EN1RENjrHs3T0a6xfqyr_-2CqPk6IeIHcuXSSzmSeBf7A0P_AyRf3BoUxWh8LYphy_49g1nmha7PUT7DgV5ffD7M16nUThlMqrGjl0V9GG01DFCfYw3V5k81nesHwNqghKPLF-me',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDuV3lQQ4tKZBbeAABY0unKl-f5sx6wV0pwEbuFe9U-cOesXAoWsmZLSkCgwo8jN2Sjw4psWv9bANv3a6wXzE4XQttjrVOHe-TQaunHCAhTQpHRUhLMf-41cNyfNQ-2S_2g2CP60_MTWCI0GdzvPRewLwxffccE6mJYbipmNdRQV1o4HH3E3AKxRks4t2eR7Op6YN_0R7ntmoBNFXAFnNWYreGQWv0lHjMi4MgfJ5t4nuvwweEsQSWmJZYZ2-ZNV0AEhAImlZWFGSLL',
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    roomAPI.getMyRooms().then(({ data }) => setRooms(data)).catch(() => {});
  }, []);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 section-spacing">
        <div>
          <h1 className="font-headline-xl text-on-surface">Active Auction Rooms</h1>
          <p className="text-on-surface-variant font-body-lg max-w-2xl mt-3">
            Welcome back, <span className="text-primary font-bold">{user?.username}</span>. Join high-stakes bidding wars for legendary talent.
          </p>
        </div>
        <div className="flex gap-4">
          <button className="btn-primary-glow" style={{fontSize: '12px', padding: '14px 28px', borderRadius: '10px'}} onClick={() => navigate('/create-room')}>
            <span className="material-symbols-outlined" style={{fontSize: '16px', fontVariationSettings: "'FILL' 1"}}>add_circle</span>
            CREATE NEW ROOM
          </button>
          <button className="btn-outline-glass" style={{fontSize: '12px', padding: '14px 28px', borderRadius: '10px'}} onClick={() => navigate('/join-room')}>
            <span className="material-symbols-outlined" style={{fontSize: '16px'}}>key</span>
            JOIN WITH CODE
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {rooms.slice(0, 5).map((room, i) => (
          <div key={room._id} className="room-card group" onClick={() => navigate(`/room/${room._id}`)}>
            <div className="card-img">
              <img src={STADIUM_IMAGES[i % STADIUM_IMAGES.length]} alt="" />
              <div className="absolute inset-0" style={{background: 'linear-gradient(to top, var(--bg-surface), transparent)'}}></div>
              {room.status === 'active' ? (
                <div className="absolute top-4 left-4 flex items-center gap-2" style={{background: 'rgba(236,255,227,0.9)', backdropFilter: 'blur(8px)', padding: '6px 14px', borderRadius: '9999px', border: '1px solid var(--secondary-container)'}}>
                  <span className="w-2 h-2 rounded-full live-pulse" style={{background: 'var(--on-secondary-container)'}}></span>
                  <span className="text-[10px] font-label-caps uppercase" style={{color: 'var(--on-secondary-container)'}}>Live Now</span>
                </div>
              ) : (
                <div className="absolute top-4 left-4" style={{background: 'rgba(53,53,52,0.9)', backdropFilter: 'blur(8px)', padding: '6px 14px', borderRadius: '9999px', border: '1px solid var(--text-outline-variant)'}}>
                  <span className="text-[10px] font-label-caps text-on-surface-variant uppercase">{LABELS[room.status] || room.status}</span>
                </div>
              )}
            </div>
            <div className="room-card-body">
              <h3 className="font-headline-lg text-on-surface mb-3">{room.name}</h3>
              <div className="flex gap-6 mb-6">
                <div className="flex items-center gap-2 text-on-surface-variant font-label-caps" style={{fontSize: '12px'}}>
                  <span className="material-symbols-outlined" style={{fontSize: '16px'}}>groups</span>
                  <span>{room.participants?.length || 0}/{room.settings?.maxParticipants || '∞'}</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant font-label-caps" style={{fontSize: '12px'}}>
                  <span className="material-symbols-outlined" style={{fontSize: '16px'}}>timer</span>
                  <span>Code: {room.code}</span>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex -space-x-2">
                  {room.participants?.slice(0, 3).map((p, pi) => (
                    <div key={pi} className="w-9 h-9 rounded-full border-2 border-surface flex items-center justify-center bg-surface-container-highest font-label-caps text-[10px] text-on-surface-variant">
                      {p.user?.username?.[0] || '?'}
                    </div>
                  ))}
                  {(room.participants?.length || 0) > 3 && (
                    <div className="w-9 h-9 rounded-full border-2 border-surface bg-surface-container-highest flex items-center justify-center font-label-caps text-[10px] text-on-surface-variant">
                      +{room.participants.length - 3}
                    </div>
                  )}
                </div>
                <button className="font-label-caps px-8 py-3 transition-all active:scale-95 hover:bg-primary hover:text-on-primary rounded-lg" style={{background: 'rgba(242,202,80,0.1)', color: 'var(--primary)', border: '1px solid rgba(242,202,80,0.3)'}}>
                  ENTER ROOM
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="room-card border-dashed min-h-[420px] flex items-center justify-center" style={{borderStyle: 'dashed', borderWidth: '2px', borderColor: 'rgba(77,70,53,0.5)', background: 'transparent', backdropFilter: 'none'}}
          onClick={() => navigate('/create-room')}>
          <div className="flex flex-col items-center p-12">
            <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-5 transition-transform group-hover:scale-110">
              <span className="material-symbols-outlined" style={{fontSize: '40px', color: 'var(--text-outline)'}}>add</span>
            </div>
            <p className="font-headline-lg text-outline mb-2">Host Private Room</p>
            <p className="text-on-surface-variant text-center font-body-md opacity-60 max-w-xs">Invite friends and create your own auction league with custom rules.</p>
          </div>
        </div>
      </div>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/10 rounded-full" style={{filter: 'blur(120px)'}}></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-secondary/5 rounded-full" style={{filter: 'blur(100px)'}}></div>
      </div>
    </>
  );
}
