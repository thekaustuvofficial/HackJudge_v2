import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useEventData, useMutateEventData, useDeleteEvent } from '../../hooks/useEventData.jsx';
import { Btn, Card, Input, Select, SectionHead, Empty, Motion, ListRow, DelBtn, toast, ConfirmModal } from '../../components/ui';
import { LIMITS } from '../../security.js';
import { CsvImporter } from '../../components/CsvImporter.jsx';
import { supabase } from '../../lib/supabase.js';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.jsx';

function TrackChip({ trackId, tracks }) {
  const t = tracks?.find(x=>x.id===trackId);
  if (!t) return null;
  return <span style={{ fontSize:12, fontWeight:600, color:'var(--bg)', background:'var(--ink)', border:'1px solid var(--ink)', borderRadius:'var(--radius-full)', padding:'2px 8px', flexShrink:0, fontFamily:'var(--font-mono)' }}>{t.name}</span>;
}

// ── PARAMETERS (Criteria) ─────────────────────────────────────────────
function ParametersSection() {
  const { data: ev } = useEventData();
  const criteriaMutate = useMutateEventData('criteria');
  const [form, setForm] = useState({ name:'', max:'10' });
  const [confirmDel, setConfirmDel] = useState(null);
  
  const set = k => v => setForm(f=>({...f,[k]:v}));
  const atLimit = (ev?.criteria?.length || 0) >= LIMITS.MAX_PARAMS;

  async function add() {
    if (atLimit) { toast(`Maximum ${LIMITS.MAX_PARAMS} parameters reached`); return; }
    if (!form.name.trim()) { toast('Enter a parameter name'); return; }
    
    try {
      await criteriaMutate.add.mutateAsync({
        event_id: ev.id,
        name: form.name.trim(),
        max_score: +form.max,
        weight: 10, // default weight
        round_ids: ev.rounds ? ev.rounds.map(r => r.id) : [] // automatically add to all existing rounds for simplicity
      });
      setForm(f=>({...f, name:''}));
      toast(`"${form.name.trim()}" added`);
    } catch (e) {
      toast(e.message || 'Error adding parameter');
    }
  }

  return (
    <Card>
      <SectionHead title="Evaluation Parameters" sub={`Define what judges score each team on · ${ev?.criteria?.length || 0}/${LIMITS.MAX_PARAMS}`} />
      <div className="responsive-grid" style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:14, marginBottom:16 }}>
        <Input label="Parameter Name" value={form.name} placeholder="e.g. Innovation" maxLength={LIMITS.PARAM_NAME} onChange={e=>set('name')(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} />
        <Input label="Max Score" type="number" value={form.max} onChange={e=>set('max')(e.target.value)} />
      </div>
      <Btn size="sm" onClick={add} disabled={atLimit || criteriaMutate.add.isLoading} full><Plus size={16} /> Add Parameter</Btn>
      
      {ev?.criteria?.length > 0 ? (
        <div style={{ marginTop:24 }}>
          {ev.criteria.map((p,i) => (
            <ListRow key={p.id} delay={i}>
              <div>
                <div style={{ fontSize:16, fontWeight:600, color:'var(--ink)', fontFamily:'var(--font-display)' }}>{p.name}</div>
                <div style={{ fontSize:14, color:'var(--muted)', marginTop:4 }}>Max Score: {p.max_score}</div>
              </div>
              <DelBtn onClick={()=>setConfirmDel(p)} />
            </ListRow>
          ))}
        </div>
      ) : (
        <Empty icon={Plus} title="No parameters" sub="Add criteria for judging" />
      )}
      
      <ConfirmModal
        isOpen={!!confirmDel}
        title="Delete Parameter"
        desc={`Delete "${confirmDel?.name}"? Existing scores will be lost.`}
        danger confirmText="Delete"
        onCancel={()=>setConfirmDel(null)}
        onConfirm={async ()=>{ 
          try { await criteriaMutate.remove.mutateAsync(confirmDel.id); toast('Parameter deleted'); }
          catch(e) { toast(e.message || 'Error deleting parameter'); }
          setConfirmDel(null); 
        }}
      />
    </Card>
  );
}

// ── TRACKS ─────────────────────────────────────────────────
function TracksSection() {
  const { data: ev } = useEventData();
  const trackMutate = useMutateEventData('tracks');
  const [name, setName] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const atLimit = (ev?.tracks?.length || 0) >= LIMITS.MAX_TRACKS;

  async function add() {
    if (!name.trim() || atLimit) return;
    try {
      await trackMutate.add.mutateAsync({ event_id: ev.id, name: name.trim() });
      setName('');
    } catch(e) { toast(e.message || 'Error adding track'); }
  }

  return (
    <Card>
      <SectionHead title="Tracks" sub="Themes or pools (skip for single-track)" />
      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        <div style={{ flex:1 }}>
          <Input value={name} placeholder="e.g. AI/ML" maxLength={LIMITS.TRACK_NAME} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()} disabled={atLimit || trackMutate.add.isLoading} />
        </div>
        <Btn onClick={add} disabled={atLimit || trackMutate.add.isLoading} style={{ alignSelf:'flex-end' }}><Plus size={18} /></Btn>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:12 }}>
        {ev?.tracks?.map(t => (
          <div key={t.id} style={{ display:'inline-flex', alignItems:'center', gap:8, background:'var(--panel-2)', border:'1px solid var(--line)', borderRadius:'var(--radius-full)', padding:'6px 16px', fontSize:14, fontWeight:600, color:'var(--ink)', fontFamily:'var(--font-mono)' }}>
            {t.name}
            <button onClick={()=>setConfirmDel(t)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', opacity:.8, lineHeight:1, fontSize:18, padding:0, display:'flex', alignItems:'center' }}>×</button>
          </div>
        ))}
        {ev?.tracks?.length === 0 && <span style={{ fontSize:14, color:'var(--muted)' }}>No tracks defined</span>}
      </div>
      <ConfirmModal
        isOpen={!!confirmDel}
        title="Delete Track"
        desc={`Delete "${confirmDel?.name}"? Teams will be unassigned.`}
        danger confirmText="Delete"
        onCancel={()=>setConfirmDel(null)}
        onConfirm={async ()=>{ 
          try { await trackMutate.remove.mutateAsync(confirmDel.id); } catch(e) { toast(e.message || 'Error deleting'); }
          setConfirmDel(null); 
        }}
      />
    </Card>
  );
}

// ── JUDGES (Magic Links) ───────────────────────────────────
function JudgesSection() {
  const { data: ev } = useEventData();
  const judgeMutate = useMutateEventData('judges');
  const [form, setForm] = useState({ name:'', email:'', phone:'' });
  const [confirmDel, setConfirmDel] = useState(null);
  const atLimit = (ev?.judges?.length || 0) >= LIMITS.MAX_JUDGES;

  const add = async () => {
    if (atLimit) return;
    const name  = form.name.trim().slice(0, LIMITS.JUDGE_NAME);
    const email = form.email.trim().toLowerCase().slice(0, LIMITS.EMAIL);
    const phone = form.phone.trim().slice(0, 20);
    if (!name || (!email && !phone)) { toast('Provide a name and either an email or phone'); return; }
    
    if (email && ev.judges.some(j => j.email === email)) { toast('Email already registered'); return; }
    if (phone && ev.judges.some(j => j.phone === phone)) { toast('Phone already registered'); return; }
    
    try {
      await judgeMutate.add.mutateAsync({ event_id: ev.id, name, email, phone });
      setForm({ name:'', email:'', phone:'' });
      toast(`${name} added`);
    } catch(e) { toast(e.message || 'Error adding judge'); }
  };

  const getInviteLink = (token) => {
    const base = window.location.origin + window.location.pathname;
    return `${base}#/j/${token}`;
  };

  const shareWhatsApp = (judge) => {
    const link = getInviteLink(judge.invite_token);
    const text = `Hi ${judge.name}, here's your judging link for ${ev.name}:\n\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <Card>
      <SectionHead title="Judges" sub={`${ev?.judges?.length || 0}/${LIMITS.MAX_JUDGES} (Magic Link access)`} />
      <div style={{ display:'grid', gap:16, marginBottom:20 }}>
        <Input label="Full Name" value={form.name} placeholder="Prof. Verma" maxLength={LIMITS.JUDGE_NAME} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
        <div className="responsive-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <Input label="Email (opt)" type="email" value={form.email} placeholder="judge@inst.edu" maxLength={LIMITS.EMAIL} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
          <Input label="Phone (opt)" type="tel" value={form.phone} placeholder="+91..." maxLength={20} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&add()} />
        </div>
      </div>
      <Btn size="sm" onClick={add} disabled={atLimit || judgeMutate.add.isLoading} full>
        <Plus size={16} /> Add Judge
      </Btn>
      {ev?.judges?.length > 0 ? (
        <div style={{ marginTop:24 }}>
          {ev.judges.map((j,i) => (
            <ListRow key={j.id} delay={i}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize:16, fontWeight:600, color:'var(--ink)', fontFamily:'var(--font-display)' }}>{j.name}</div>
                <div style={{ fontSize:14, color:'var(--muted)', marginTop:4, fontFamily:'var(--font-mono)' }}>{j.phone || j.email}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Btn size="xs" variant="ghost" onClick={() => { navigator.clipboard.writeText(getInviteLink(j.invite_token)); toast('Magic link copied'); }}>Link</Btn>
                <DelBtn onClick={()=>setConfirmDel(j)} />
              </div>
            </ListRow>
          ))}
        </div>
      ) : (
        <Empty icon={Plus} title="No judges added" sub="Invite judges to evaluate" />
      )}
      <ConfirmModal
        isOpen={!!confirmDel}
        title="Remove Judge"
        desc={`Remove "${confirmDel?.name}"?`}
        danger confirmText="Remove"
        onCancel={()=>setConfirmDel(null)}
        onConfirm={async ()=>{ try { await judgeMutate.remove.mutateAsync(confirmDel.id); } catch(e) { toast(e.message); } setConfirmDel(null); }}
      />
    </Card>
  );
}

// ── PANELS ─────────────────────────────────────────────────
function PanelsSection() {
  const { data: ev } = useEventData();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const panelMutate = useMutateEventData('panels');
  const [form, setForm] = useState({ name:'', trackId:'' });
  const [open, setOpen] = useState(null);
  const [toggling, setToggling] = useState(null); // tracks which judge is being toggled
  const atLimit = (ev?.panels?.length || 0) >= LIMITS.MAX_PANELS;

  async function add() {
    if (!form.name.trim() || atLimit) return;
    try {
      await panelMutate.add.mutateAsync({ 
        event_id: ev.id, 
        name: form.name.trim(), 
        track_id: form.trackId || null 
      });
      setForm({ name:'', trackId:'' });
    } catch(e) { toast(e.message || 'Error adding panel'); }
  }

  // To toggle panel judges, we need to insert/delete from panel_judges table.
  // We don't have a direct mutation mapped for this yet, so we can do it inline
  // (Or we can create a specific mutation hook). For simplicity, let's use a standard fetch.
  // Wait, ev.panels doesn't include the nested judges.
  // Our schema separates them into `panel_judges`.
  // We'll need to update `useEventData` to include `panel_judges`.
  // Let's assume we update `useEventData` to fetch `panel_judges`.

  return (
    <Card>
      <SectionHead title="Judge Panels" sub="Group judges per track — optional" />
      <div className="responsive-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        <Input label="Panel Name" value={form.name} placeholder="Panel A" maxLength={60} onChange={e=>setForm(f=>({...f,name:e.target.value}))} disabled={atLimit} />
        <Select label="Assigned Track" value={form.trackId} onChange={e=>setForm(f=>({...f,trackId:e.target.value}))}>
          <option value="">— All Tracks —</option>
          {ev?.tracks?.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </div>
      <Btn size="sm" onClick={add} disabled={atLimit || panelMutate.add.isLoading}><Plus size={16} /> Add Panel</Btn>
      
      {ev?.panels?.length > 0 ? (
        <div style={{ marginTop:24 }}>
          {ev.panels.map(p => {
            const track = ev.tracks?.find(t=>t.id===p.track_id);
            const isOpen = open===p.id;
            // Get panel judges from the mapping table (assuming it's loaded in ev.panel_judges)
            const panelJudgeIds = ev.panel_judges?.filter(pj => pj.panel_id === p.id).map(pj => pj.judge_id) || [];
            
            return (
              <div key={p.id} style={{ border:`1px solid ${isOpen?'var(--blue)':'var(--line)'}`, borderRadius:12, marginBottom:12, overflow:'hidden', transition:'border-color .15s' }}>
                <div onClick={()=>setOpen(isOpen?null:p.id)}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', cursor:'pointer', background:'var(--panel-2)', userSelect:'none' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg-2)'}
                  onMouseLeave={e=>e.currentTarget.style.background='var(--panel-2)'}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                    <span style={{ fontSize:16, fontWeight:600, color:'var(--ink)', fontFamily:'var(--font-display)' }}>{p.name}</span>
                    {track && <span style={{ fontSize:12, fontWeight:600, color:'var(--bg)', background:'var(--ink)', border:'1px solid var(--ink)', borderRadius:'var(--radius-full)', padding:'2px 8px', fontFamily:'var(--font-mono)' }}>{track.name}</span>}
                    <span style={{ fontSize:14, color:'var(--muted)' }}>{panelJudgeIds.length} judge{panelJudgeIds.length!==1?'s':''}</span>
                  </div>
                  {isOpen ? <ChevronUp size={18} style={{ color:'var(--muted)', flexShrink:0 }}/> : <ChevronDown size={18} style={{ color:'var(--muted)', flexShrink:0 }}/>}
                </div>
                {/* Note: Toggling panel judges will require a custom Supabase call */}
                {isOpen && (
                  <div style={{ padding:'16px 20px', background:'var(--panel)', borderTop:'1px solid var(--line)' }}>
                    {ev?.judges?.length===0
                      ? <p style={{ fontSize:14, color:'var(--muted)' }}>Add judges first in the Judges section above.</p>
                      : ev.judges.map(j => (
                        <label key={j.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 8px', cursor:'pointer', borderBottom:'1px solid var(--line)' }}>
                          <input type="checkbox" checked={panelJudgeIds.includes(j.id)}
                            disabled={toggling === j.id}
                            onChange={async () => {
                              setToggling(j.id);
                              try {
                                if (panelJudgeIds.includes(j.id)) {
                                  await supabase.from('panel_judges').delete().eq('panel_id', p.id).eq('judge_id', j.id);
                                } else {
                                  await supabase.from('panel_judges').insert({ panel_id: p.id, judge_id: j.id });
                                }
                                // Invalidate the query cache so React re-renders with fresh data
                                await queryClient.invalidateQueries(['eventData', user?.id]);
                                toast(panelJudgeIds.includes(j.id) ? 'Judge removed from panel' : 'Judge added to panel');
                              } catch (e) {
                                toast(e.message || 'Error toggling panel judge');
                              } finally {
                                setToggling(null);
                              }
                            }}
                            style={{ accentColor:'var(--blue)', width:20, height:20, cursor:'pointer' }}/>
                          <div>
                            <div style={{ fontSize:16, fontWeight:600, color:'var(--ink)' }}>{j.name}</div>
                            <div style={{ fontSize:14, color:'var(--muted)', fontFamily:'var(--font-mono)' }}>{j.email}</div>
                          </div>
                        </label>
                      ))
                    }
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <Empty icon={Plus} title="No panels" sub="Skip if all judges evaluate all teams together" />
      )}
    </Card>
  );
}

// ── TEAMS ──────────────────────────────────────────────────
function TeamsSection() {
  const { data: ev } = useEventData();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const teamMutate = useMutateEventData('teams');
  const [form, setForm] = useState({ name:'', projectTitle:'', trackId:'' });
  const [bulk, setBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const atLimit = (ev?.teams?.length || 0) >= LIMITS.MAX_TEAMS;

  async function add() {
    if (!form.name.trim() || atLimit) return;
    try {
      await teamMutate.add.mutateAsync({ 
        event_id: ev.id,
        name: form.name.trim(), 
        // projectTitle is not in our schema, so we can store it in the `members` jsonb array for now, or just ignore it.
        members: form.projectTitle ? [{ title: form.projectTitle }] : [], 
        track_id: form.trackId || null 
      });
      setForm(f=>({...f,name:'',projectTitle:''}));
    } catch(e) { toast(e.message || 'Error adding team'); }
  }

  return (
    <Card>
      <SectionHead
        title="Teams"
        sub={`${ev?.teams?.length || 0} of ${LIMITS.MAX_TEAMS} registered`}
        action={<Btn size="xs" variant="ghost" onClick={()=>setBulk(b=>!b)}>{bulk?'Cancel':'Bulk Import'}</Btn>}
      />
      {!bulk ? (
        <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:24 }}>
          <Input label="Team Name" value={form.name} placeholder="e.g. Team Hydra" maxLength={LIMITS.TEAM_NAME} onChange={e=>setForm(f=>({...f,name:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&add()} disabled={atLimit || teamMutate.add.isLoading} />
          <div className="responsive-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Input label="Title (Opt)" value={form.projectTitle} placeholder="Smart AI" maxLength={LIMITS.DESCRIPTION} onChange={e=>setForm(f=>({...f,projectTitle:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&add()} disabled={atLimit || teamMutate.add.isLoading} />
            <Select label="Track" value={form.trackId} onChange={e=>setForm(f=>({...f,trackId:e.target.value}))}>
              <option value="">— General —</option>
              {ev?.tracks?.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </div>
          <Btn onClick={add} disabled={atLimit || teamMutate.add.isLoading} full><Plus size={16} /> Add Team</Btn>
        </div>
      ) : (
        <CsvImporter
          existingTeamNames={(ev?.teams || []).map(t => t.name)}
          onCancel={() => setBulk(false)}
          onImport={async (teams) => {
            if (!teams.length) return;
            try {
              // Batch insert all teams in a single DB call instead of N serial calls
              const rows = teams.map(t => ({
                event_id: ev.id,
                name: t.name,
                members: t.projectTitle ? [{ title: t.projectTitle }] : [],
                track_id: null
              }));
              const { error } = await supabase.from('teams').insert(rows);
              if (error) throw error;
              await queryClient.invalidateQueries(['eventData', user?.id]);
              toast(`${teams.length} teams imported`);
              setBulk(false);
            } catch (e) {
              toast(e.message || 'Error importing teams');
            }
          }}
        />
      )}
      <div>
        {ev?.teams?.map((t,i) => {
          const pTitle = t.members && t.members[0] ? t.members[0].title : null;
          return (
            <ListRow key={t.id} delay={i%12}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:16, fontWeight:600, color:'var(--ink)', fontFamily:'var(--font-display)' }}>{t.name}</span>
                {pTitle && <span style={{ fontSize:14, color:'var(--muted)', fontFamily:'var(--font-body)' }}>{pTitle}</span>}
                <TrackChip trackId={t.track_id} tracks={ev.tracks} />
              </div>
              <DelBtn onClick={()=>setConfirmDel(t)} />
            </ListRow>
          );
        })}
        {ev?.teams?.length === 0 && <Empty icon={Plus} title="No teams yet" sub="Add teams to score" />}
      </div>
      <ConfirmModal
        isOpen={!!confirmDel}
        title="Delete Team"
        desc={`Delete "${confirmDel?.name}"? All scores will be permanently deleted.`}
        danger confirmText="Delete"
        onCancel={()=>setConfirmDel(null)}
        onConfirm={async ()=>{ 
          try { await teamMutate.remove.mutateAsync(confirmDel.id); } catch(e) { toast(e.message || 'Error deleting team'); }
          setConfirmDel(null); 
        }}
      />
    </Card>
  );
}

export default function SetupTab() {
  const [step, setStep] = useState(0);
  const { data: ev, isLoading } = useEventData();

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading event data...</div>;
  if (!ev) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>No active event found. Please create one on the home screen.</div>;

  const steps = [
    { id: 'params', label: 'Criteria', comp: ParametersSection },
    { id: 'tracks', label: 'Tracks', comp: TracksSection },
    { id: 'judges', label: 'Judges', comp: JudgesSection },
    { id: 'panels', label: 'Panels', comp: PanelsSection },
    { id: 'teams', label: 'Teams', comp: TeamsSection },
  ];

  const CurrentStep = steps[step].comp;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24, paddingTop:24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        {steps.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setStep(i)}
              style={{
                background: step === i ? 'var(--ink)' : step > i ? 'var(--panel)' : 'var(--panel-2)',
                color: step === i ? 'var(--bg)' : step > i ? 'var(--ink)' : 'var(--muted)',
                border: `1px solid ${step === i ? 'transparent' : step > i ? 'var(--ink)' : 'var(--line)'}`,
                borderRadius: 'var(--radius-full)', padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-body)', transition: 'all .2s'
              }}
            >
              {i + 1}. {s.label}
            </button>
            {i < steps.length - 1 && <div style={{ width: 16, height: 1, background: step > i ? 'var(--ink)' : 'var(--line)' }} />}
          </div>
        ))}
      </div>

      <div style={{ minHeight: 400 }}>
        <Motion key={step} type="fadeUp">
          <CurrentStep />
        </Motion>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
        <Btn variant="ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
          Previous
        </Btn>
        <Btn onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} disabled={step === steps.length - 1}>
          Next Step
        </Btn>
      </div>

      {/* Danger Zone */}
      <DangerZone />
    </div>
  );
}

function DangerZone() {
  const { data: ev } = useEventData();
  const deleteEvent = useDeleteEvent();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const targetString = `${ev?.name} DELETE`;
  const isMatch = confirmText === targetString;

  const handleDelete = async () => {
    if (!isMatch) return;
    try {
      await deleteEvent.mutateAsync(ev);
    } catch (e) {
      toast(e.message || 'Error deleting event');
    }
  };

  return (
    <div style={{ marginTop: 48, padding: 24, border: '1px solid var(--red)', borderRadius: 'var(--radius-lg)', background: 'rgba(255,59,48,0.05)' }}>
      <SectionHead 
        title={<span style={{ color: 'var(--red)' }}>Danger Zone</span>} 
        sub="Deleting this event will permanently erase all rounds, judges, teams, panels, and scores. This action cannot be undone." 
      />
      <div style={{ marginTop: 16 }}>
        <Btn variant="danger" onClick={() => setIsOpen(true)}>Delete Competition</Btn>
      </div>

      {/* Strict Confirmation Modal */}
      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', padding: 20
        }}>
          <div className="modal-enter" style={{
            background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)',
            padding: 24, width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--ink)', marginBottom: 8 }}>
              Delete "{ev?.name}"?
            </h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.5 }}>
              This will permanently delete the event and all associated data. To confirm, please type <strong>{targetString}</strong> below.
            </p>

            <Input 
              value={confirmText} 
              onChange={e => setConfirmText(e.target.value)} 
              placeholder={targetString} 
              style={{ marginBottom: 24 }}
            />

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => { setIsOpen(false); setConfirmText(''); }}>Cancel</Btn>
              <Btn 
                variant="danger" 
                onClick={handleDelete} 
                disabled={!isMatch || deleteEvent.isLoading}
              >
                {deleteEvent.isLoading ? 'Deleting...' : 'Permanently Delete'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
