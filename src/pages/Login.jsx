import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 relative" style={{background: '#0A0A0A'}}>
      <div className="relative z-10 w-full" style={{maxWidth: '480px'}}>
        <div className="flex flex-col items-center mb-10">
          <h1 className="font-display-lg font-black italic text-primary tracking-tighter text-center" style={{textShadow: '0 4px 20px rgba(242,202,80,0.4)', fontSize: 'clamp(36px, 8vw, 64px)'}}>
            ELITE LEGENDS
          </h1>
          <p className="font-label-caps text-on-surface-variant mt-2 tracking-widest opacity-80 text-center" style={{letterSpacing: '0.2em'}}>
            The Auction of Icons
          </p>
        </div>

        <div className="auth-card-stitch">
          <div className="mb-8">
            <h2 className="text-on-surface" style={{fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700}}>Welcome Back</h2>
            <p className="text-on-surface-variant mt-1" style={{fontFamily: 'var(--font-body)', fontSize: '16px'}}>Access your vault and active bids.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-6 rounded-lg" style={{background: 'rgba(255,180,171,0.2)', border: '1px solid rgba(255,180,171,0.3)'}}>
              <span className="text-error font-body-md" style={{fontSize: '14px'}}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="font-label-caps text-on-surface-variant" htmlFor="email">Email Address</label>
              <div className="relative flex items-center transition-all duration-300">
                <span className="material-symbols-outlined absolute left-4 text-on-surface-variant" style={{fontSize: '20px', opacity: 0.6, fontVariationSettings: "'FILL' 0, 'wght' 300"}}>mail</span>
                <input
                  id="email" type="email" required
                  className="input-glass"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@luxury-suite.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-label-caps text-on-surface-variant" htmlFor="password">Password</label>
              </div>
              <div className="relative flex items-center transition-all duration-300">
                <span className="material-symbols-outlined absolute left-4 text-on-surface-variant" style={{fontSize: '20px', opacity: 0.6, fontVariationSettings: "'FILL' 0, 'wght' 300"}}>lock</span>
                <input
                  id="password" type="password" required
                  className="input-glass"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary-glow w-full" disabled={loading}>
              {loading ? 'SIGNING IN...' : 'CONTINUE TO ARENA'}
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>arrow_right_alt</span>
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{borderColor: 'rgba(77, 70, 53, 0.3)'}}></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 font-label-caps text-on-surface-variant" style={{opacity: 0.5, background: 'rgba(18, 20, 29, 0.6)'}}>SECURE LOGIN</span>
            </div>
          </div>

          <p className="text-center font-body-md text-on-surface-variant">
            New to the Elite?{' '}
            <Link to="/register" className="text-primary font-bold text-decoration-none hover:underline">Create Account</Link>
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex gap-6 font-label-caps text-on-surface-variant" style={{fontSize: '10px', letterSpacing: '0.2em', opacity: 0.4}}>
            <span>PRIVACY POLICY</span>
            <span>TERMS OF SERVICE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
