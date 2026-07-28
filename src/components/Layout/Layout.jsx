import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/dashboard', icon: 'gavel', label: 'Auctions' },
    { to: '/my-teams', icon: 'groups', label: 'Squad' },
    { to: '/players', icon: 'database', label: 'Vault' },
    { to: '/profile', icon: 'settings', label: 'Settings' },
  ];

  return (
    <>
      <nav className="navbar navbar-expand-lg nav-stitch">
        <div className="container-fluid px-0">
          <NavLink className="navbar-brand font-headline-lg text-headline-lg font-black tracking-tighter text-primary italic p-0 m-0" style={{ fontSize: '26px', lineHeight: 1 }} to="/dashboard">
            ELITE LEGENDS
          </NavLink>

          <div className="d-flex align-items-center gap-2">
            <div className="d-none d-lg-flex align-items-center gap-2 px-3 py-1 rounded-3 bg-surface-container-low me-1">
              <span className={`w-2 h-2 rounded-2 d-inline-block ${connected ? 'bg-secondary-fixed' : 'bg-danger'}`} style={{animation: connected ? 'pulse-animation 2s infinite' : 'none'}}></span>
              <div className="d-flex flex-column">
                <span className="font-headline-sm" style={{fontSize: '12px', lineHeight: 1.2, color: 'var(--text-on-surface)'}}>{user?.username}</span>
                <span className="font-label-caps" style={{fontSize: '9px', color: connected ? 'var(--secondary-fixed)' : 'var(--error)'}}>{connected ? 'Connected' : 'Offline'}</span>
              </div>
            </div>
            <button className="navbar-toggler border-0 p-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation" style={{color: 'var(--text-on-surface)', outline: 'none', boxShadow: 'none'}}>
              <span className="material-symbols-outlined d-flex" style={{fontSize: '28px'}}>menu</span>
            </button>
          </div>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-1 mt-3 mt-lg-0">
              {navItems.map((item) => (
                <li className="nav-item" key={item.to}>
                  <NavLink to={item.to} end={item.to === '/dashboard'}
                    className={({isActive}) =>
                      `nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-3 font-label-caps text-xs tracking-wider ${
                        isActive ? 'active bg-primary/15' : ''
                      }`
                    }
                    style={({isActive}) => ({
                      color: isActive ? 'var(--primary)' : 'var(--text-on-surface-variant)',
                      textDecoration: 'none',
                      fontSize: '12px',
                      letterSpacing: '0.05em',
                    })}>
                    <span className="material-symbols-outlined" style={{fontSize: '16px', fontVariationSettings: "'FILL' 1"}}>{item.icon}</span>
                    {item.label}
                  </NavLink>
                </li>
              ))}
              <li className="nav-item d-lg-none">
                <hr className="my-2" style={{borderColor: 'rgba(77,70,53,0.15)'}} />
              </li>
              <li className="nav-item d-lg-none">
                <div className="d-flex align-items-center gap-3 px-3 py-2">
                  <div className="w-8 h-8 rounded-2 bg-primary/15 d-flex align-items-center justify-content-center">
                    <span className="material-symbols-outlined text-primary" style={{fontSize: '18px', fontVariationSettings: "'FILL' 1"}}>person</span>
                  </div>
                  <div>
                    <p className="mb-0 font-headline-sm" style={{fontSize: '13px', color: 'var(--text-on-surface)'}}>{user?.username}</p>
                    <div className="d-flex align-items-center gap-1 mt-0">
                      <span className={`w-1.5 h-1.5 rounded-2 d-inline-block ${connected ? 'bg-secondary-fixed' : 'bg-danger'}`}></span>
                      <span className="font-label-caps" style={{fontSize: '9px', color: 'var(--text-on-surface-variant)'}}>{connected ? 'Connected' : 'Offline'}</span>
                    </div>
                  </div>
                </div>
              </li>
              <li className="nav-item d-lg-none">
                <button className="w-100 mt-1 btn border-0 text-white font-headline-sm py-3 tracking-tighter shadow-lg" style={{fontSize: '13px', borderRadius: '10px', background: 'var(--primary)'}}
                  onClick={() => { document.querySelector('[data-bs-target="#navbarNav"]')?.click(); navigate('/create-room'); }}>
                  START AUCTION
                </button>
              </li>
            </ul>
            <div className="d-flex align-items-center gap-2 mt-3 mt-lg-0">
              <button className="btn btn-ghost-icon p-0 d-flex align-items-center justify-content-center" onClick={handleLogout} style={{width: '40px', height: '40px', borderRadius: '10px', border: 'none', background: 'none', cursor: 'pointer', color: 'inherit'}} title="Logout">
                <span className="material-symbols-outlined" style={{fontSize: '22px'}}>logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <aside className="sidebar-stitch">
        <div className="px-5 mb-6 flex items-center gap-3">
          <div className="w-11 h-11 bg-primary/15 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1", fontSize: '22px'}}>gavel</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-headline-sm text-sm text-on-surface truncate">{user?.username}</p>
            <p className="font-label-caps text-[9px] text-on-surface-variant mt-0.5 tracking-wider">AUCTION MASTER</p>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-0.5 px-3">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'} className={({isActive}) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }>
              <span className="material-symbols-outlined" style={{fontSize: '20px', fontVariationSettings: "'FILL' 1"}}>{item.icon}</span>
              <span className="font-label-caps" style={{fontSize: '11px', letterSpacing: '0.08em'}}>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-4 mt-auto">
          <button className="w-full bg-primary text-on-primary font-headline-sm py-4 tracking-tighter transition-all active:scale-[0.97] shadow-lg hover:brightness-110" style={{border: 'none', fontSize: '13px', borderRadius: '10px'}}
            onClick={() => navigate('/create-room')}>
            START AUCTION
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 mt-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded-lg transition-all active:scale-[0.97]" onClick={handleLogout} style={{border: 'none', background: 'none', cursor: 'pointer'}}>
            <span className="material-symbols-outlined" style={{fontSize: '18px'}}>logout</span>
            <span className="font-label-caps text-[11px] tracking-wider">LOGOUT</span>
          </button>
        </div>
      </aside>

      <main className="main-stitch">
        <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop page-content">
          <Outlet />
        </div>
      </main>

      <div className="ticker-bar">
        <div className="bg-primary text-on-primary px-6 h-full flex items-center font-label-caps whitespace-nowrap z-10" style={{fontSize: '10px'}}>
          LIVE BIDS
        </div>
        <div className="flex-1 overflow-hidden whitespace-nowrap flex items-center">
          <div className="flex gap-12 animate-marquee py-2">
            <span className="font-label-caps text-[11px] text-on-surface flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block"></span>
              {connected ? 'Real-time auction feed connected' : 'Connecting...'}
            </span>
            <span className="text-outline-variant opacity-50">/</span>
            <span className="font-label-caps text-[11px] text-on-surface-variant">ELITE LEGENDS AUCTION PLATFORM — v2.0</span>
            <span className="text-outline-variant opacity-50">/</span>
            <span className="font-label-caps text-[11px] text-on-surface-variant">HIGHEST BID THIS SESSION: RECORD PENDING</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}
