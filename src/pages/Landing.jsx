import { useState, useCallback, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme.jsx';
import { supabase } from '../lib/supabase.js';
import {
  ThemeToggle, Input, Motion, Alert, toast, Logo, Btn
} from '../components/ui';
import EventWizard from './EventWizard.jsx';

// ── Loading spinner shown during async ops ──
function Spinner() {
  return (
    <div style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', animation: 'spinSlowly .7s linear infinite' }} />
  );
}

export default function Landing() {
  const { theme, toggle } = useTheme();
  const [view, setView] = useState(() => {
    const h = window.location.hash.replace('#', '');
    if (h.startsWith('create')) return 'create';
    return ['org', 'judge'].includes(h) ? h : 'home';
  });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const [oForm, setOForm] = useState({ email: '', password: '' });
  const [jForm, setJForm] = useState({ email: '', password: '' });

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#', '');
      if (h.startsWith('create')) setView('create');
      else setView(['org', 'judge'].includes(h) ? h : 'home');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = v => { 
    window.location.hash = v === 'home' ? '' : v;
    setErr(''); 
  };

  // ── Organiser login ─────────────
  const orgLogin = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setErr('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: oForm.email,
        password: oForm.password,
      });
      if (error) throw error;
      toast(`Welcome back!`);
    } catch (e) {
      setErr(e.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [oForm, loading]);

  // ── Judge login (for claimed accounts) ──────────────────────────────────────────
  const judgeLogin = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setErr('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: jForm.email,
        password: jForm.password,
      });
      if (error) throw error;
      toast(`Signed in successfully`);
    } catch (e) {
      setErr(e.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [jForm, loading]);

  const judgeSignUp = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setErr('');
    try {
      const { data, error } = await supabase.auth.signUp({
        email: jForm.email,
        password: jForm.password,
      });
      if (error) throw error;
      if (!data.session) {
        throw new Error("Account created! (If Email Confirmations are on in Supabase, please check your inbox.)");
      }
      toast(`Account created successfully!`);
    } catch (e) {
      if (e.message.toLowerCase().includes('already registered') || e.message.toLowerCase().includes('user already exists')) {
        setErr('Account already exists. Please click Sign In instead.');
      } else {
        setErr(e.message || 'Sign up failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [jForm, loading]);

  // ── Render ───────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--panel)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px var(--blue-s)', flexShrink: 0 }}>
            <Logo size={18} color="var(--bg)" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, color: 'var(--ink)', letterSpacing: '-.01em' }}>HackJudge</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 1, height: 16, background: 'var(--line)' }} />
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          <ThemeToggle theme={theme} toggle={toggle} />
        </div>
      </nav>

      {view === 'home' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(32px,6vw,64px) 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          
          {/* Subtle engineering dot grid */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(var(--muted-2) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: theme === 'dark' ? 0.2 : 0.25, maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

          <Motion type="fadeIn">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', border: '1px solid var(--line)', borderRadius: 99, padding: '6px 14px', marginBottom: 40, zIndex: 1, position: 'relative' }}>
              <div className="pulse-once" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)', boxShadow: '0 0 8px var(--amber)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', letterSpacing: '.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>HackJudge V2 is Live</span>
            </div>
          </Motion>
          
          <Motion delay={1}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, lineHeight: 0.95, fontSize: 'clamp(56px,10vw,110px)', color: 'var(--ink)', letterSpacing: '-.05em', marginBottom: 24, maxWidth: 900, zIndex: 1, position: 'relative' }}>
              Evaluate<br />
              <span style={{ color: 'var(--muted)' }}>with precision.</span>
              <div style={{ fontSize: 'clamp(24px, 4vw, 32px)', color: 'var(--blue)', marginTop: 16, fontWeight: 600 }}>Welcome to Version 2.0</div>
            </h1>
          </Motion>
          
          <Motion delay={2}>
            <p style={{ fontSize: 'clamp(16px,2vw,20px)', color: 'var(--muted)', maxWidth: 500, marginBottom: 48, lineHeight: 1.6, fontWeight: 400, zIndex: 1, position: 'relative' }}>
              The high-performance evaluation engine to coordinate judges, score projects, and finalize leaderboards without the friction.
            </p>
          </Motion>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 12, width: '100%', maxWidth: 600, zIndex: 1, position: 'relative' }}>
            <Motion delay={3}>
              <button className="hover-lift" onClick={() => go('org')} style={{ 
                background: 'var(--ink)', color: 'var(--bg)', padding: '14px 28px', fontSize: 14, fontWeight: 600, 
                borderRadius: 99, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                boxShadow: theme === 'light' ? '0 8px 24px rgba(0,0,0,0.12)' : '0 4px 12px rgba(0,0,0,0.4)', transition: 'transform 0.15s ease'
              }}>
                Organiser Console
              </button>
            </Motion>
            <Motion delay={4}>
              <button className="hover-lift" onClick={() => go('judge')} style={{ 
                background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line)', padding: '14px 28px', 
                fontSize: 14, fontWeight: 600, borderRadius: 99, cursor: 'pointer', fontFamily: 'var(--font-body)',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--panel-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Judge Login
              </button>
            </Motion>
            <Motion delay={5}>
              <button onClick={() => go('create')} style={{ 
                background: 'transparent', color: 'var(--muted)', border: 'none', padding: '14px 24px', 
                fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
              >
                Create Event →
              </button>
            </Motion>
          </div>

          <Motion delay={6}>
            <div style={{ marginTop: 80, display: 'flex', alignItems: 'center', gap: 16, opacity: .4, zIndex: 1, position: 'relative' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', letterSpacing: '.04em', fontFamily: 'var(--font-mono)' }}>Built for High-Stakes Competitions · hack-judge-v2.vercel.app</span>
            </div>
          </Motion>
        </div>
      )}

      {view !== 'home' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px 20px 32px' }}>
          <Motion type="scaleIn" style={{ width: '100%', maxWidth: view === 'create' ? 640 : 420 }}>
            {view !== 'create' && (
              <>
                <button onClick={() => go('home')} disabled={loading}
                  style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)', marginBottom: 16, cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 8, transition: 'color .15s', fontFamily: 'var(--font-body)', opacity: loading ? .5 : 1 }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.color = 'var(--ink)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; }}>
                  ← Back
                </button>

                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, marginBottom: 4, color: 'var(--ink)', letterSpacing: '-.02em' }}>
                  {view === 'org' ? 'Organiser Console' : 'Judge Login'}
                </h2>
                <p style={{ fontSize: 16, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
                  {view === 'org' ? 'Authenticate to manage your event operations' : 'Sign in to access your linked account'}
                </p>

                {err && <Alert variant="error" style={{ marginBottom: 20 }}>{err}</Alert>}
                {loading && (
                  <div style={{ textAlign: 'center', padding: '8px 0 16px', fontSize: 14, color: 'var(--muted)' }}>
                    Securing your credentials…
                  </div>
                )}
              </>
            )}

            {view === 'create' && (
              <EventWizard onCancel={() => go('home')} />
            )}

            {view === 'org' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Input label="Email" type="email" placeholder="organiser@college.edu" value={oForm.email} onChange={e => setOForm(f => ({ ...f, email: e.target.value }))} disabled={loading} />
                <Input label="Password" type="password" placeholder="Your password" value={oForm.password} onChange={e => setOForm(f => ({ ...f, password: e.target.value }))} onKeyDown={e => e.key === 'Enter' && orgLogin()} disabled={loading} />
                <Btn full size="lg" onClick={orgLogin} disabled={loading} style={{ marginTop: 8, gap: 10 }}>
                  {loading ? <Spinner /> : null} Sign In
                </Btn>
                <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--muted)' }}>
                  No event?{' '}
                  <span style={{ color: 'var(--blue)', cursor: 'pointer', fontWeight: 600 }} onClick={() => !loading && go('create')}>Create one</span>
                </p>
              </div>
            )}

            {view === 'judge' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Input label="Email" type="email" placeholder="judge@example.com" value={jForm.email} onChange={e => setJForm(f => ({ ...f, email: e.target.value }))} disabled={loading} />
                <Input label="Password" type="password" placeholder="Create or enter password" value={jForm.password} onChange={e => setJForm(f => ({ ...f, password: e.target.value }))} onKeyDown={e => e.key === 'Enter' && judgeLogin()} disabled={loading} />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                  <Btn full size="lg" onClick={judgeLogin} disabled={loading}>
                    {loading ? <Spinner /> : null} Sign In
                  </Btn>
                  <Btn full size="lg" variant="outline" onClick={judgeSignUp} disabled={loading}>
                    Create Account
                  </Btn>
                </div>
                
                <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--muted)', marginTop: 8 }}>
                  New judge? Enter your invited email, create a password, and click <strong>Create Account</strong>.
                </p>
              </div>
            )}
          </Motion>
        </div>
      )}
    </div>
  );
}
