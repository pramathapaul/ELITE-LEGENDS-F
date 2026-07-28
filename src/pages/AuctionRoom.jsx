import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  joinRoomSocket, leaveRoomSocket, sendChatMessage,
  placeBid, startAuction, pauseAuction, resumeAuction, endAuction, assignPlayers, forceSell
} from '../services/socket';
import Confetti from 'react-confetti';
import { getPlayerImageUrl } from '../utils/playerImage';

export default function AuctionRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState(null);
  const [timer, setTimer] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [soldNotification, setSoldNotification] = useState(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [assigning, setAssigning] = useState(false);
  const [bidError, setBidError] = useState(null);
  const [biddingHistory, setBiddingHistory] = useState([]);
  const [myTeam, setMyTeam] = useState(null);

  const cardRef = useRef(null);

  const isAdmin = String(user?._id) === String(room?.admin?._id);
  const participant = room?.participants?.find(p => String(p.user?._id || p.user) === String(user?._id));
  const myBudget = participant?.budget || 0;
  const hasPlayers = (room?.assignedPlayers?.length || 0) > 0;

  useEffect(() => {
    roomAPI.getById(id).then(({ data }) => {
      setRoom(data);
      setLoading(false);
    }).catch(() => navigate('/dashboard'));
  }, [id, navigate]);

  useEffect(() => {
    if (!socket || !room) return;
    joinRoomSocket(id, user);

    socket.on('new-bid', ({ playerId, bidAmount: amount, user: bidder, timestamp }) => {
      setCurrentBid(amount);
      setHighestBidder(bidder);
      setBiddingHistory((prev) => [...prev, { amount, bidder, playerId, timestamp: timestamp || new Date() }]);
    });
    socket.on('new-chat-message', (msg) => setChatMessages((prev) => [...prev, msg]));
    socket.on('new-player-auction', ({ player, currentBid: cb, highestBidder: hb, timer: t, basePrice }) => {
      setCurrentPlayer(player); setCurrentBid(cb); setHighestBidder(hb); setTimer(t); setBidAmount(basePrice); setBidError(null); setBiddingHistory([]);
    });
    socket.on('timer-tick', ({ timeLeft }) => setTimer(timeLeft));
    socket.on('timer-reset', ({ duration }) => setTimer(duration));
    socket.on('player-sold', ({ player: soldPlayer, winner, winningBid, room: updatedRoom }) => {
      setRoom(updatedRoom); setSoldNotification({ player: soldPlayer, winner, winningBid });
      setShowConfetti(true); setTimeout(() => { setShowConfetti(false); setSoldNotification(null); }, 4000);
      setCurrentPlayer(null); setCurrentBid(0); setHighestBidder(null); setBiddingHistory([]);
    });
    socket.on('player-unsold', ({ player: unsoldPlayer, room: updatedRoom }) => {
      setRoom(updatedRoom); setCurrentPlayer(null); setCurrentBid(0); setHighestBidder(null); setBiddingHistory([]);
    });
    socket.on('auction-started', ({ room: updatedRoom }) => setRoom(updatedRoom));
    socket.on('auction-paused', ({ room: updatedRoom }) => setRoom(updatedRoom));
    socket.on('auction-resumed', ({ room: updatedRoom }) => setRoom(updatedRoom));
    socket.on('auction-ended', ({ room: updatedRoom }) => setRoom(updatedRoom));
    socket.on('players-assigned', ({ room: updatedRoom }) => { setRoom(updatedRoom); setAssigning(false); });
    socket.on('user-joined', ({ message }) => setChatMessages((prev) => [...prev, { username: 'System', message, type: 'system' }]));
    socket.on('user-left', ({ message }) => setChatMessages((prev) => [...prev, { username: 'System', message, type: 'system' }]));
    socket.on('error', ({ message }) => setBidError(message));
    socket.on('bid-rejected', ({ message }) => setBidError(message));

    return () => {
      leaveRoomSocket(id, user);
      ['new-bid','new-chat-message','new-player-auction','timer-tick','timer-reset','player-sold','player-unsold','auction-started','auction-paused','auction-resumed','auction-ended','players-assigned','user-joined','user-left','error','bid-rejected'].forEach(e => socket.off(e));
    };
  }, [socket, room?._id]);

  useEffect(() => {
    if (!room || !user) return;
    const fetch = () => roomAPI.getLeaderboard(id).then(({ data }) => setLeaderboard(data)).catch(() => {});
    fetch(); const i = setInterval(fetch, 5000);
    return () => clearInterval(i);
  }, [id, room?.soldPlayers?.length]);

  useEffect(() => {
    if (!room || !user) return;
    roomAPI.getMyTeam(id).then(({ data }) => setMyTeam(data)).catch(() => {});
  }, [id, room?.soldPlayers?.length]);

  useEffect(() => {
    if (!socket || !room) return;
    const handler = ({ userId, team }) => {
      if (userId === user?._id) setMyTeam(team);
    };
    socket.on('team-updated', handler);
    return () => socket.off('team-updated', handler);
  }, [socket, room?._id, user?._id]);

  useEffect(() => {
    const handleMouse = (e) => {
      if (!cardRef.current || window.innerWidth < 1024) return;
      const xAxis = (window.innerWidth / 2 - e.pageX) / 50;
      const yAxis = (window.innerHeight / 2 - e.pageY) / 50;
      cardRef.current.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg) scale(1.02)`;
    };
    const handleLeave = () => { if (cardRef.current) cardRef.current.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1)'; };
    document.addEventListener('mousemove', handleMouse);
    document.addEventListener('mouseleave', handleLeave);
    return () => { document.removeEventListener('mousemove', handleMouse); document.removeEventListener('mouseleave', handleLeave); };
  }, []);

  const handleSendMessage = (e) => { e.preventDefault(); if (!chatInput.trim()) return; sendChatMessage(id, chatInput.trim(), user); setChatInput(''); };
  const handleAssignPlayers = () => { setAssigning(true); assignPlayers(id); };

  const getNextBid = () => {
    if (!currentPlayer) return 0;
    if (currentBid === 0) return currentPlayer.basePrice;
    const inc = room.settings.bidIncrementType === 'percentage'
      ? Math.ceil(currentBid * (room.settings.bidIncrement / 100))
      : room.settings.bidIncrement;
    return currentBid + inc;
  };

  const handlePlaceBid = (amount) => {
    if (!currentPlayer) return;
    const bid = amount || bidAmount;
    if (bid <= currentBid) { setBidAmount(getNextBid()); return; }
    setBidError(null); placeBid(id, currentPlayer._id, bid, user); setBidAmount(bid);
  };

  const handleQuickBid = () => { const a = getNextBid(); handlePlaceBid(a); setBidAmount(a); };

  const formatMoney = (n) => {
    if (!n) return '$0';
    if (n >= 1000000000) return `$${(n / 1000000000).toFixed(2)}B`;
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  };

  const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  if (loading) return <div className="loading-stitch"><div className="spinner-stitch"></div></div>;
  if (!room) return null;

  return (
    <>
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={200} colors={['#f2ca50', '#e9c349', '#72ff70', '#fff']} />}

      {soldNotification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40" style={{animation: 'slideUp 0.4s ease-out'}}>
          <div className="bg-secondary text-on-secondary px-8 py-4 rounded-lg shadow-xl text-center" style={{boxShadow: '0 0 40px rgba(114,255,112,0.3)'}}>
            <h3 className="font-headline-lg text-2xl font-black italic">⚡ SOLD! ⚡</h3>
            <p className="font-headline-sm text-lg">{soldNotification.player?.name}</p>
            <p className="font-label-price text-2xl">{formatMoney(soldNotification.winningBid)}</p>
            <p className="font-label-caps text-sm opacity-80">Won by {soldNotification.winner?.username || 'Unknown'}</p>
          </div>
        </div>
      )}

      {bidError && (
        <div className="fixed top-24 right-8 z-40" style={{animation: 'slideUp 0.3s ease-out'}}>
          <div className="glass-panel p-4 rounded-xl" style={{borderLeft: '4px solid var(--error)', minWidth: '280px'}}>
            <div className="flex justify-between items-center gap-3">
              <span className="text-error font-body-md">{bidError}</span>
              <button className="btn-ghost-icon" onClick={() => setBidError(null)}>
                <span className="material-symbols-outlined" style={{fontSize: '18px'}}>close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:grid xl:grid-cols-12 gap-6 lg:gap-10">
        {/* Left: Participants + Chat */}
        <div className="xl:col-span-3 space-y-6 lg:space-y-8 order-3 xl:order-none">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-label-caps text-on-surface-variant tracking-wider">ROOM PARTICIPANTS</h3>
              <span className="font-label-caps text-primary">{room.participants?.length || 0}/{room.settings?.maxParticipants || '∞'}</span>
            </div>
            <div className="mb-5 font-label-caps text-[10px] text-primary/60 tracking-widest" style={{letterSpacing: '2px'}}>
              ROOM CODE: <span className="text-primary font-bold text-xs tracking-widest">{room.code}</span>
            </div>
            <div className="space-y-3">
              {room.participants?.map((p, i) => (
                <div key={i} className="participant-item hover:translate-x-2">
                  <div className="w-11 h-11 rounded-full border-2 border-primary/30 bg-surface-container-highest flex items-center justify-center font-headline-sm text-sm text-on-surface-variant shrink-0">
                    {getInitials(p.user?.username)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-headline-sm text-sm text-on-surface truncate">{p.user?.username || 'Unknown'}</p>
                    <p className="font-label-caps text-[10px] text-primary mt-0.5">{formatMoney(p.budget)} REMAINING</p>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${i < 3 ? 'bg-secondary-fixed' : 'bg-secondary/30'}`} style={i < 3 ? {animation: 'pulse-animation 2s infinite'} : {}}></span>
                </div>
              ))}
              {(!room.participants || room.participants.length === 0) && (
                <p className="text-on-surface-variant opacity-50 font-body-md text-sm text-center py-8">No participants yet</p>
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="glass-panel rounded-xl overflow-hidden flex flex-col" style={{minHeight: '350px', maxHeight: '450px'}}>
            <div className="px-5 py-4 border-b" style={{borderColor: 'rgba(77,70,53,0.2)'}}>
              <h6 className="font-label-caps text-on-surface-variant tracking-wider">ROOM CHAT</h6>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {chatMessages.length === 0 && (
                <p className="text-on-surface-variant opacity-40 font-body-md text-sm text-center py-8">No messages yet</p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`p-3 rounded-lg text-sm ${
                  msg.type === 'system' ? 'text-center text-on-surface-variant opacity-60' :
                  msg.username === user?.username ? 'bg-primary/10' : 'bg-surface-container-low'
                }`} style={{maxWidth: '88%', marginLeft: msg.username === user?.username ? 'auto' : '0'}}>
                  {msg.type === 'user' && <span className="font-label-caps text-[10px] text-primary block mb-1">{msg.username}</span>}
                  <span className="font-body-md" style={{fontSize: '14px'}}>{msg.message}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2 p-4 border-t" style={{borderColor: 'rgba(77,70,53,0.2)'}}>
              <input type="text" className="input-glass-plain" style={{padding: '12px 16px'}} value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." />
              <button type="submit" className="bg-primary text-on-primary px-4 rounded-lg transition-all hover:brightness-110 active:scale-95" style={{border: 'none'}}>
                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Center: Player Hero */}
        <div className="xl:col-span-6 flex flex-col items-center justify-start relative order-1 xl:order-none">
          <div className="hidden lg:block absolute w-[500px] h-[600px] bg-primary/10 rounded-full top-0 left-1/2 -translate-x-1/2 pointer-events-none" style={{filter: 'blur(120px)'}}></div>

          {currentPlayer ? (
            <>
              <div className="flex flex-col items-center mb-6 lg:mb-8">
                <span className="font-label-caps text-on-surface-variant mb-2 tracking-wider">AUCTION ENDS IN</span>
                <div className="timer-badge">
                  <span className={`font-headline-lg tabular-nums ${timer <= 5 ? 'text-error' : 'text-on-surface'}`}>
                    0:{timer < 10 ? `0${timer}` : timer}
                  </span>
                </div>
              </div>

              <div className="perspective-1000 w-full max-w-sm lg:max-w-none">
                <div ref={cardRef} className="player-card-auction gold-gradient-border shadow-2xl touch-auto" style={{
                  backgroundImage: `linear-gradient(#12141d, #12141d), linear-gradient(to bottom right, #e9c349, transparent)`,
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                }}>
                  <img src={getPlayerImageUrl(currentPlayer)} alt={currentPlayer.name}
                    className="absolute -top-8 lg:-top-12 left-1/2 -translate-x-1/2 w-[120%] lg:w-[140%] h-[100%] lg:h-[120%] z-10 object-contain opacity-30 pointer-events-none select-none"
                    style={{filter: 'grayscale(0.3)', objectPosition: 'center'}} />
                  <div className="relative z-20 space-y-2 lg:space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-display-lg text-display-lg-mobile text-primary-fixed-dim leading-none">{currentPlayer.overall}</span>
                      <span className="font-label-caps bg-primary/20 text-primary px-3 lg:px-4 py-1.5 rounded-lg" style={{fontSize: '11px'}}>
                        {currentPlayer.position === 'Goalkeeper' ? 'GK' : currentPlayer.position === 'Defender' ? 'DEF' : currentPlayer.position === 'Midfielder' ? 'MID' : 'FWD'}
                      </span>
                    </div>
                    <h2 className="font-headline-lg lg:font-headline-xl leading-none italic uppercase tracking-tight" style={{marginLeft: '-2px'}}>
                      {currentPlayer.name?.split(' ').pop() || 'PLAYER'}
                    </h2>
                    <div className="flex gap-4 lg:gap-6 pt-4 lg:pt-5 mt-4 lg:mt-5" style={{borderTop: '1px solid rgba(242,202,80,0.2)'}}>
                      <div className="text-center">
                        <p className="font-label-caps text-[9px] lg:text-[10px] text-on-surface-variant">RATING</p>
                        <p className="font-headline-sm text-on-surface mt-1">{currentPlayer.overall}</p>
                      </div>
                      <div className="text-center">
                        <p className="font-label-caps text-[9px] lg:text-[10px] text-on-surface-variant">COUNTRY</p>
                        <p className="font-headline-sm text-secondary mt-1">{currentPlayer.country || 'N/A'}</p>
                      </div>
                      <div className="text-center">
                        <p className="font-label-caps text-[9px] lg:text-[10px] text-on-surface-variant">PEAK</p>
                        <p className="font-headline-sm text-on-surface mt-1">{currentPlayer.peakClub || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bidding controls under card */}
              <div className="bid-panel-stitch mt-6 lg:mt-10 w-full max-w-lg">
                <p className="font-label-caps text-on-surface-variant mb-3 tracking-wider">CURRENT HIGHEST BID</p>
                <div className="flex items-end justify-between mb-6">
                  <h3 className="font-headline-xl text-secondary-fixed tabular-nums">{formatMoney(currentBid)}</h3>
                  {highestBidder && (
                    <span className="font-label-caps text-[11px] text-on-surface-variant">by {highestBidder.username}</span>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <input type="number" className="input-glass-plain flex-1" style={{padding: '14px 18px'}} value={bidAmount}
                      onChange={(e) => setBidAmount(parseInt(e.target.value) || 0)}
                      min={currentBid > 0 ? currentBid + 1 : currentPlayer?.basePrice || 0} max={myBudget} />
                    <button className="bg-secondary text-on-secondary-container font-black italic tracking-tighter px-8 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 rounded-xl" style={{border: 'none', padding: '14px 28px'}}
                      onClick={() => handlePlaceBid(bidAmount)}
                      disabled={room.status !== 'active' || bidAmount > myBudget || bidAmount <= currentBid}>
                      BID
                      <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>trending_up</span>
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 py-4 bg-surface-container-highest text-on-surface font-label-caps text-xs border border-outline-variant transition-all active:scale-95 hover:bg-surface-container-high rounded-lg" style={{border: '1px solid var(--text-outline-variant)'}}
                      onClick={handleQuickBid}
                      disabled={room.status !== 'active' || getNextBid() > myBudget}>
                      +{formatMoney(getNextBid() - currentBid)} QUICK BID
                    </button>
                    {highestBidder && highestBidder._id !== user?._id && (
                      <button className="flex-1 py-4 text-on-primary font-label-caps text-xs transition-all active:scale-95 hover:brightness-110 rounded-lg flex items-center justify-center gap-1.5" style={{background: 'linear-gradient(135deg, #f39c12, #e67e22)', border: 'none'}}
                        onClick={() => forceSell(id, user)}>
                        <span>⚡</span> FORCE SOLD
                      </button>
                    )}
                  </div>
                  <div className="flex justify-between font-label-caps text-[11px] text-on-surface-variant pt-2" style={{borderTop: '1px solid rgba(77,70,53,0.15)'}}>
                    <span>Budget: <span className="text-secondary-fixed font-bold">{formatMoney(myBudget)}</span></span>
                    <span>Next bid: <span className="text-primary font-bold">{formatMoney(getNextBid())}</span></span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 lg:py-24 w-full">
              <div className="mb-4 lg:mb-6 opacity-10">
                <span className="material-symbols-outlined" style={{fontSize: 'clamp(60px, 15vw, 100px)'}}>sports_soccer</span>
              </div>
              <h4 className="font-headline-sm lg:font-headline-lg text-on-surface-variant mb-3">
                {room.status === 'waiting' ? 'Waiting for auction to start...' :
                 room.status === 'ended' ? 'Auction has ended' : 'Preparing next player...'}
              </h4>
              <p className="text-on-surface-variant opacity-60 font-body-lg max-w-md mx-auto">
                {room.status === 'waiting'
                  ? (hasPlayers ? 'The admin will start the auction shortly.' : 'Admin needs to assign players first.')
                  : room.status === 'ended' ? 'Check the leaderboard for final results.' : ''}
              </p>
              {isAdmin && room.status === 'waiting' && (
                <div className="flex gap-4 justify-center mt-8">
                  <button className="btn-primary-glow" style={{fontSize: '14px', padding: '14px 28px', borderRadius: '10px'}} onClick={handleAssignPlayers} disabled={assigning}>
                    {assigning ? 'ASSIGNING...' : hasPlayers ? 'RE-ASSIGN PLAYERS' : 'ASSIGN PLAYERS'}
                  </button>
                  {hasPlayers && (
                    <button className="btn-secondary-glow" style={{fontSize: '14px', padding: '14px 28px', borderRadius: '10px'}} onClick={() => startAuction(id)}>
                      START AUCTION
                    </button>
                  )}
                </div>
              )}
              {isAdmin && room.status === 'active' && (
                <div className="flex gap-4 justify-center mt-8">
                  <button className="btn-outline-glass" style={{borderRadius: '10px'}} onClick={() => pauseAuction(id)}>PAUSE</button>
                  <button className="btn-outline-glass" style={{borderRadius: '10px'}} onClick={() => endAuction(id)}>END</button>
                </div>
              )}
              {isAdmin && room.status === 'paused' && (
                <button className="btn-primary-glow mt-8" style={{fontSize: '14px', padding: '14px 28px', borderRadius: '10px'}} onClick={() => resumeAuction(id)}>RESUME</button>
              )}
            </div>
          )}

          {/* Leaderboard */}
          <div className="glass-panel w-full mt-6 lg:mt-10 p-4 lg:p-8 rounded-xl">
            <h6 className="font-label-caps text-on-surface-variant mb-5 flex items-center gap-2 tracking-wider">
              <span className="material-symbols-outlined" style={{fontSize: '18px', fontVariationSettings: "'FILL' 1"}}>leaderboard</span>
              LEADERBOARD
            </h6>
            {leaderboard.length > 0 ? (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-left" style={{borderCollapse: 'collapse'}}>
                  <thead>
                    <tr className="font-label-caps text-[10px] text-on-surface-variant border-b tracking-wider" style={{borderColor: 'rgba(77,70,53,0.2)'}}>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3 text-right">XI</th>
                      <th className="px-4 py-3 text-right">Sub</th>
                      <th className="px-4 py-3 text-right">Rating</th>
                      <th className="px-4 py-3 text-right">Spent</th>
                      <th className="px-4 py-3 text-right">Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, i) => (
                      <tr key={i} className="border-b hover:bg-surface-container-low transition-colors" style={{borderColor: 'rgba(77,70,53,0.08)'}}>
                        <td className="px-4 py-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-label-caps text-xs font-bold ${
                            i === 0 ? 'bg-primary text-on-primary' : i === 1 ? 'bg-surface-container-highest' : i === 2 ? 'bg-surface-container' : 'bg-surface-container-low text-on-surface-variant'
                          }`}>{i + 1}</div>
                        </td>
                        <td className="px-4 py-4 font-headline-sm text-sm text-on-surface">{entry.user?.username}</td>
                        <td className="px-4 py-4 text-right text-secondary-fixed font-bold">{entry.starters || 0}</td>
                        <td className="px-4 py-4 text-right text-on-surface-variant">{entry.substitutes || 0}</td>
                        <td className="px-4 py-4 text-right text-primary font-bold">{entry.totalRating}</td>
                        <td className="px-4 py-4 text-right text-on-surface-variant">{formatMoney(entry.totalSpent)}</td>
                        <td className="px-4 py-4 text-right text-secondary-fixed font-bold">{formatMoney(entry.budget)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-on-surface-variant opacity-60 font-body-md py-4 text-center">No leaderboard data yet</p>
            )}
          </div>
        </div>

        {/* Right: Bid History + Admin + Team */}
        <div className="xl:col-span-3 space-y-6 lg:space-y-8 order-2 xl:order-none">
          {/* Bid History */}
          <div className="bid-panel-stitch">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-label-caps text-on-surface-variant mb-1 tracking-wider">YOUR BUDGET</p>
                <h3 className="font-headline-lg text-secondary-fixed tabular-nums">{formatMoney(myBudget)}</h3>
                <p className="font-label-caps text-[10px] text-on-surface-variant mt-1">Spent: {formatMoney(room.settings?.startingBudget - myBudget)}</p>
              </div>
            </div>

            <div className="pt-5" style={{borderTop: '1px solid rgba(77,70,53,0.15)'}}>
              <h4 className="font-label-caps text-on-surface-variant mb-5 flex items-center gap-2 tracking-wider">
                <span className="material-symbols-outlined" style={{fontSize: '16px'}}>history</span>
                BID HISTORY
              </h4>
              <div className="space-y-1" style={{maxHeight: '320px', overflowY: 'auto'}}>
                {biddingHistory.length > 0 && currentPlayer ? (
                  biddingHistory.slice().reverse().map((bid, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-3 rounded-lg transition-colors" style={{background: i === 0 ? 'rgba(114,255,112,0.05)' : 'transparent'}}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{background: i === 0 ? 'rgba(114,255,112,0.15)' : 'var(--bg-surface-container)'}}>
                          <span className="material-symbols-outlined" style={{fontSize: '16px', color: i === 0 ? 'var(--secondary-fixed)' : 'var(--text-on-surface-variant)', fontVariationSettings: "'FILL' 1"}}>person</span>
                        </div>
                        <span className="font-body-md text-sm truncate">{bid.bidder?.username || 'Unknown'}</span>
                      </div>
                      <span className={`font-label-caps text-sm ml-3 shrink-0 ${i === 0 ? 'text-secondary-fixed' : 'text-on-surface-variant'}`}>
                        {formatMoney(bid.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-on-surface-variant opacity-50 font-body-md text-sm text-center py-6">No bids yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="bid-panel-stitch">
              <h4 className="font-label-caps text-on-surface-variant mb-5 tracking-wider">ADMIN CONTROLS</h4>
              <div className="space-y-3">
                {room.status === 'waiting' && (
                  <>
                    <button className="w-full py-4 bg-primary text-on-primary font-label-caps text-xs tracking-wider transition-all active:scale-95 hover:brightness-110 rounded-lg" style={{border: 'none'}}
                      onClick={handleAssignPlayers} disabled={assigning}>
                      {assigning ? 'ASSIGNING...' : hasPlayers ? 'RE-ASSIGN PLAYERS' : 'ASSIGN PLAYERS'}
                    </button>
                    {hasPlayers && (
                      <button className="w-full py-4 bg-secondary text-on-secondary font-label-caps text-xs tracking-wider transition-all active:scale-95 hover:brightness-110 rounded-lg" style={{border: 'none'}}
                        onClick={() => startAuction(id)}>
                        START AUCTION
                      </button>
                    )}
                  </>
                )}
                {room.status === 'active' && (
                  <>
                    <button className="w-full py-4 bg-surface-container-highest text-on-surface font-label-caps text-xs border border-outline-variant transition-all active:scale-95 hover:bg-surface-container-high rounded-lg"
                      onClick={() => pauseAuction(id)}>PAUSE AUCTION</button>
                    <button className="w-full py-4 bg-error/20 text-error font-label-caps text-xs border border-error/30 transition-all active:scale-95 hover:bg-error/30 rounded-lg"
                      onClick={() => endAuction(id)}>END AUCTION</button>
                  </>
                )}
                {room.status === 'paused' && (
                  <button className="w-full py-4 bg-primary text-on-primary font-label-caps text-xs tracking-wider transition-all active:scale-95 hover:brightness-110 rounded-lg" style={{border: 'none'}}
                    onClick={() => resumeAuction(id)}>RESUME AUCTION</button>
                )}
                <button className="w-full py-4 bg-surface-container-highest text-on-surface font-label-caps text-xs border border-outline-variant transition-all active:scale-95 hover:bg-surface-container-high rounded-lg"
                  onClick={() => navigate(`/admin/players`)}>PLAYER DB</button>
              </div>
            </div>
          )}

          {/* My Team */}
          <div className="bid-panel-stitch">
            <div className="flex items-center justify-between mb-5">
              <h4 className="font-label-caps text-on-surface-variant tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined" style={{fontSize: '16px', fontVariationSettings: "'FILL' 1"}}>groups</span>
                MY TEAM
              </h4>
              {myTeam && (
                <div className="flex items-center gap-3">
                  <span className="font-label-caps text-[10px] text-secondary-fixed">{myTeam.formation}</span>
                  <span className="font-label-caps text-[10px] text-on-surface-variant">
                    {myTeam.players.filter(p => p.status === 'starter').length}/11
                  </span>
                </div>
              )}
            </div>

            {myTeam && myTeam.players.length > 0 ? (
              <div className="space-y-3">
                {/* Starting XI */}
                {['Goalkeeper', 'Defender', 'Midfielder', 'Forward'].map(position => {
                  const posPlayers = myTeam.players.filter(p => p.status === 'starter' && p.player?.position === position);
                  if (posPlayers.length === 0) return null;
                  return (
                    <div key={position}>
                      <p className="font-label-caps text-[9px] text-on-surface-variant mb-2 tracking-wider uppercase">
                        {position === 'Goalkeeper' ? 'GK' : position === 'Defender' ? 'DEF' : position === 'Midfielder' ? 'MID' : 'FWD'}
                        <span className="ml-2 opacity-40">• {posPlayers.length}</span>
                      </p>
                      <div className="space-y-1.5">
                        {posPlayers.map(entry => (
                          <div key={entry.player._id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container-highest transition-colors cursor-pointer"
                            onClick={() => roomAPI.togglePlayerStatus(id, entry.player._id).then(({ data }) => setMyTeam(data)).catch(() => {})}
                            title={entry.status === 'starter' ? 'Move to bench' : 'Promote to starter'}>
                            <div className="w-7 h-7 rounded-full bg-surface-container-highest overflow-hidden shrink-0 flex items-center justify-center">
                              <img src={getPlayerImageUrl(entry.player)} alt="" className="w-full h-full object-cover" />
                            </div>
                            <span className="font-body-md text-xs text-on-surface truncate flex-1 min-w-0">
                              {entry.player.name}
                            </span>
                            <span className="font-label-caps text-[9px] text-primary">{entry.player.overall}</span>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${entry.status === 'starter' ? 'bg-secondary-fixed' : 'bg-on-surface-variant/40'}`}></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Bench */}
                {(() => {
                  const subs = myTeam.players.filter(p => p.status === 'substitute');
                  if (subs.length === 0) return null;
                  return (
                    <div className="pt-3" style={{borderTop: '1px solid rgba(77,70,53,0.15)'}}>
                      <p className="font-label-caps text-[9px] text-on-surface-variant mb-2 tracking-wider uppercase">
                        BENCH <span className="ml-2 opacity-40">• {subs.length}</span>
                      </p>
                      <div className="space-y-1.5">
                        {subs.map(entry => (
                          <div key={entry.player._id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container-highest transition-colors cursor-pointer"
                            onClick={() => roomAPI.togglePlayerStatus(id, entry.player._id).then(({ data }) => setMyTeam(data)).catch(() => {})}
                            title={entry.status === 'starter' ? 'Move to bench' : 'Promote to starter'}>
                            <div className="w-7 h-7 rounded-full bg-surface-container-highest overflow-hidden shrink-0 flex items-center justify-center">
                              <img src={getPlayerImageUrl(entry.player)} alt="" className="w-full h-full object-cover" />
                            </div>
                            <span className="font-body-md text-xs text-on-surface truncate flex-1 min-w-0">
                              {entry.player.name}
                            </span>
                            <span className="font-label-caps text-[9px] text-on-surface-variant">{entry.player.overall}</span>
                            <span className="w-2 h-2 rounded-full shrink-0 bg-on-surface-variant/40"></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <p className="text-on-surface-variant opacity-50 font-body-md text-sm text-center py-6">
                {room.status === 'ended' ? 'No players won' : 'Win players in the auction to build your team'}
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}
