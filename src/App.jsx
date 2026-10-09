import { useState, useEffect } from 'react';
import { ThemeProvider } from './hooks/useTheme.jsx';
import { ToastContainer } from './components/ui';
import Landing from './pages/Landing';
import OrganizerDashboard from './pages/organizer/index.jsx';
import JudgeDashboard from './pages/JudgeDashboard';
import MagicLinkAuth from './pages/MagicLinkAuth';

import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { supabase } from './lib/supabase';
import { parseJwt } from './security.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function Router() {
  const { user, session, loading } = useAuth();
  const [magicToken, setMagicToken] = useState(null);
  const [dbRole, setDbRole] = useState(null); // null (loading/unknown), 'organizer', 'judge'

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/j/')) {
      setMagicToken(hash.replace('#/j/', ''));
    }
    
    // Listen for hash changes
    const onHashChange = () => {
      const h = window.location.hash;
      if (h.startsWith('#/j/')) setMagicToken(h.replace('#/j/', ''));
      else setMagicToken(null);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    async function resolveRole() {
      if (!user) {
        setDbRole(null);
        return;
      }
      // If we have a magic link token, we don't need to query db role yet
      if (magicToken) return;

      // Reset while resolving to avoid stale state flash
      setDbRole(null);

      try {
        const orQuery = user.email ? `user_id.eq.${user.id},email.eq.${user.email}` : `user_id.eq.${user.id}`;
        const { data: judgeRows } = await supabase
          .from('judges')
          .select('id')
          .or(orQuery)
          .limit(1);
        
        if (judgeRows?.length > 0) {
          setDbRole('judge');
          return;
        }

        // Default to organizer if no judge row found
        setDbRole('organizer');
      } catch {
        // On any DB error, fall back to organizer to avoid locking the user out
        setDbRole('organizer');
      }
    }
    
    resolveRole();
  }, [user, magicToken]);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--muted)' }}>Loading...</div>;
  }
  
  if (magicToken && !user) return <MagicLinkAuth token={magicToken} />;
  
  if (!user) return <Landing />;

  // Determine user type from JWT claims
  // Magic link judges have a judge_id in their JWT.
  // We parse the token directly because Supabase might not map root custom claims to user_metadata.
  const jwtPayload = session?.access_token ? parseJwt(session.access_token) : null;
  const judgeIdClaim = jwtPayload?.judge_id || user?.user_metadata?.judge_id || user?.app_metadata?.judge_id;
  
  const hasEmail = !!user?.email;

  // If we are at #/projector, render Projector (greyed out but route still exists)
  const hash = window.location.hash;
  if (hash === '#/projector') return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--muted)', fontFamily: 'var(--font-display)', fontSize: 24 }}>Projector is coming soon.</div>;

  // Routing
  if (judgeIdClaim) return <JudgeDashboard />;
  
  // If no email, they are a magic link judge
  if (!hasEmail) return <JudgeDashboard />;
  
  // If they have an email, wait for dbRole to resolve
  if (!dbRole) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--muted)' }}>Resolving role...</div>;

  if (dbRole === 'judge') return <JudgeDashboard />;
  
  // Default to Organizer
  return <OrganizerDashboard />;
}

import { ErrorBoundary } from './components/ErrorBoundary.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ErrorBoundary>
            <Router />
            <ToastContainer />
            <Analytics />
          </ErrorBoundary>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
