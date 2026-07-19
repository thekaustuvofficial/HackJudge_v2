import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

// Fetch all data for the active event (or fallback to latest)
export function useEventData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['eventData', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const storedId = localStorage.getItem('hackjudge_active_event_id');
      let query = supabase.from('events').select('*').eq('organizer_id', user.id);
      
      if (storedId) {
        query = query.eq('id', storedId);
      } else {
        query = query.order('created_at', { ascending: false }).limit(1);
      }

      const { data: event, error: eventError } = await query.single();

      if (eventError && eventError.code !== 'PGRST116') throw eventError;
      if (!event) return null;
      
      // Save the id so future reloads stick to it
      if (!storedId || storedId !== event.id) {
        localStorage.setItem('hackjudge_active_event_id', event.id);
      }

      // Fetch all related entities in parallel
      const [
        { data: criteria },
        { data: rounds },
        { data: tracks },
        { data: panels },
        { data: panel_judges },
        { data: judges },
        { data: teams },
        { data: scores },
      ] = await Promise.all([
        supabase.from('criteria').select('*').eq('event_id', event.id),
        supabase.from('rounds').select('*').eq('event_id', event.id),
        supabase.from('tracks').select('*').eq('event_id', event.id),
        supabase.from('panels').select('*').eq('event_id', event.id),
        // panel_judges relies on inner join with panels to filter by event_id
        supabase.from('panel_judges').select('*, panels!inner(event_id)').eq('panels.event_id', event.id),
        supabase.from('judges').select('*').eq('event_id', event.id),
        supabase.from('teams').select('*').eq('event_id', event.id),
        // Fetch all scores for the event's rounds via inner join
        supabase.from('scores').select('*, rounds!inner(event_id)').eq('rounds.event_id', event.id),
      ]);

      return {
        ...event,
        criteria: criteria || [],
        rounds: rounds || [],
        tracks: tracks || [],
        panels: panels || [],
        panel_judges: panel_judges || [],
        judges: judges || [],
        teams: teams || [],
        scores: scores || [],
      };
    },
  });
}

export function useOrganizerEvents() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['organizerEvents', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, status, created_at')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });
}


// Generic mutation factory for inserting/deleting
export function useMutateEventData(table) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const add = useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from(table).insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries(['eventData', user?.id]),
  });

  const remove = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries(['eventData', user?.id]),
  });
  
  const update = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries(['eventData', user?.id]),
  });

  return { add, remove, update };
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (eventData) => {
      const eventId = eventData.id;
      
      // Bottom-up manual cascade deletion to prevent orphans
      
      // 1. Delete scores (linked to rounds)
      const roundIds = eventData.rounds.map(r => r.id);
      if (roundIds.length > 0) {
        await supabase.from('scores').delete().in('round_id', roundIds);
      }
      
      // 2. Delete panel_judges (linked to panels)
      const panelIds = eventData.panels.map(p => p.id);
      if (panelIds.length > 0) {
        await supabase.from('panel_judges').delete().in('panel_id', panelIds);
      }

      // 3. Delete tables linked directly to the event
      await supabase.from('teams').delete().eq('event_id', eventId);
      await supabase.from('judges').delete().eq('event_id', eventId);
      await supabase.from('panels').delete().eq('event_id', eventId);
      await supabase.from('tracks').delete().eq('event_id', eventId);
      await supabase.from('criteria').delete().eq('event_id', eventId);
      await supabase.from('rounds').delete().eq('event_id', eventId);
      
      // 4. Delete the event itself
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (error) throw error;
      
      return eventId;
    },
    onSuccess: () => {
      localStorage.removeItem('hackjudge_active_event_id');
      queryClient.invalidateQueries(['eventData', user?.id]);
      queryClient.invalidateQueries(['organizerEvents', user?.id]);
      window.location.hash = '';
      window.location.reload();
    }
  });
}

