import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ui';
import { useAuth } from '../hooks/useAuth';

export default function MagicLinkAuth({ token }) {
  const { session } = useAuth();

  useEffect(() => {
    async function resolveToken() {
      if (session) return; // Already logged in

      try {
        const { data, error } = await supabase.functions.invoke('resolve-judge-token', {
          body: { token }
        });

        if (error) throw new Error(error.message || 'Failed to authenticate token');
        
        if (data?.error) throw new Error(data.error);

        if (data?.jwt) {
          // Set the session using the custom minted JWT
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: data.jwt,
            refresh_token: data.jwt // Custom JWTs don't refresh in the same way, but API requires it
          });
          
          if (sessionError) throw sessionError;

          toast(`Signed in securely as ${data.name || 'Judge'}`);
          window.location.hash = ''; // Clear hash
        } else {
          throw new Error('No JWT returned');
        }

      } catch (err) {
        console.error(err);
        toast(err.message || 'Invalid or expired magic link');
        window.location.hash = ''; // Clear hash to drop them back to landing
      }
    }

    resolveToken();
  }, [token, session]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--muted)' }}>
      Authenticating Judge Session...
    </div>
  );
}
