import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { parseJwt } from '../security';
import { useAuth } from './useAuth';

export function useJudgeData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['judgeData', user?.id],
    enabled: !!user,
    queryFn: async () => {
      // 1. Resolve judge identity
      const sessionResponse = await supabase.auth.getSession();
      const session = sessionResponse.data.session;
      const jwtPayload = session?.access_token ? parseJwt(session.access_token) : null;
      const jwtJudgeId = jwtPayload?.judge_id || session?.user?.app_metadata?.judge_id || null;

      let judge = null;

      if (jwtJudgeId) {
        const { data: rows, error } = await supabase.from('judges').select('*').eq('id', jwtJudgeId);
        if (error || !rows?.length) throw new Error("Judge profile not found");
        judge = rows[0];
      } else {
        // Try by user_id first (claimed account)
        const { data: byUserId } = await supabase.from('judges').select('*').eq('user_id', user.id);
        if (byUserId?.length) {
          judge = byUserId[0];
        } else if (user.email) {
          // Fallback: try by email (unclaimed account, RLS allows seeing rows with matching email)
          const { data: byEmail } = await supabase.from('judges').select('*').eq('email', user.email);
          if (byEmail?.length) {
            judge = byEmail[0];
          }
        }
        if (!judge) throw new Error("Judge profile not found");
      }

      // 2. Fetch the event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', judge.event_id)
        .single();
      if (eventError) throw eventError;

      // 3. Fetch related data
      const [
        { data: criteria },
        { data: rounds },
        { data: tracks },
        { data: teams },
        { data: scores },
        { data: panelJudges },
      ] = await Promise.all([
        supabase.from('criteria').select('*').eq('event_id', event.id).is('archived_at', null),
        supabase.from('rounds').select('*').eq('event_id', event.id),
        supabase.from('tracks').select('*').eq('event_id', event.id),
        supabase.from('teams').select('*').eq('event_id', event.id),
        supabase.from('scores').select('*').eq('judge_id', judge.id),
        supabase.from('panel_judges').select('panel_id, panels!inner(track_id)').eq('judge_id', judge.id),
      ]);

      // Filter teams based on panel assignments (matching the RLS policy)
      const allowedTrackIds = (panelJudges || []).map(pj => pj.panels.track_id).filter(Boolean);
      const filteredTeams = (teams || []).filter(t => {
        if (!t.track_id) return true;
        return allowedTrackIds.includes(t.track_id);
      });

      return {
        event,
        judge,
        criteria: criteria || [],
        rounds: rounds || [],
        tracks: tracks || [],
        teams: filteredTeams,
        scores: scores || [],
      };
    },
  });
}

export function useJudgeMutate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const submitScore = useMutation({
    mutationFn: async (scoresPayload) => {
      // scoresPayload is an array of score inserts
      const { data, error } = await supabase.from('scores').insert(scoresPayload);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['judgeData', user?.id]);
    },
  });

  const claimAccount = useMutation({
    mutationFn: async (judgeId) => {
      const { data, error } = await supabase.rpc('claim_judge_row', { target_judge_id: judgeId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['judgeData', user?.id]);
    },
  });

  return { submitScore, claimAccount };
}
