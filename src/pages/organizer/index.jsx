import { useState, useRef, useEffect } from 'react';
import { Settings, Play, BarChart2, CheckSquare, ChevronDown, Plus } from 'lucide-react';
import { Badge, Btn } from '../../components/ui';
import { Sidebar } from '../../components/Sidebar';
import SetupTab from './SetupTab';
import { RoundsTab, ResultsTab, ShortlistTab } from './OtherTabs';
import { useEventData, useOrganizerEvents } from '../../hooks/useEventData';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import EventWizard from '../EventWizard';

const TABS = [
  { id:'setup',     label:'Setup',     icon:Settings    },
  { id:'rounds',    label:'Rounds',    icon:Play        },
  { id:'results',   label:'Results',   icon:BarChart2   },
  { id:'shortlist', label:'Shortlist', icon:CheckSquare },
];

const STATUS_VAR = { draft:'amber', live:'green', closed:'default' };

export default function OrganizerDashboard() {
  const { data: ev, isLoading } = useEventData();
  const { data: allEvents } = useOrganizerEvents();
  const { user } = useAuth();
  const [tab, setTab] = useState(() => {
    const h = window.location.hash.replace('#', '');
    return TABS.some(t => t.id === h) ? h : 'setup';
  });
  
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#', '');
      if (TABS.some(t => t.id === h)) setTab(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigateTab = (t) => {
    window.location.hash = t;
  };

  const [creatingNew, setCreatingNew] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  if (isLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--muted)' }}>Loading event data...</div>;

  if (!ev) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--line)' }}>
          <Btn variant="ghost" onClick={() => supabase.auth.signOut()}>Logout</Btn>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <EventWizard existingUser={user} onCancel={() => {
            setCreatingNew(false);
            // If they cancel and they had a previous event, reload to show it
            if (localStorage.getItem('hackjudge_active_event_id')) {
              window.location.reload();
            } else {
              supabase.auth.signOut();
            }
          }} />
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    localStorage.removeItem('hackjudge_active_event_id');
    await supabase.auth.signOut();
    window.location.hash = '';
  };

  const breadcrumbs = [
    { label: 'Events', onClick: handleLogout },
    { label: ev.name, onClick: () => navigateTab('setup') },
    { label: TABS.find(t => t.id === tab)?.label || 'Dashboard' }
  ];

  if (creatingNew) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--line)' }}>
          <Btn variant="ghost" onClick={() => setCreatingNew(false)}>Cancel</Btn>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <EventWizard existingUser={user} onCancel={() => setCreatingNew(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout" style={{ minHeight:'100vh', display:'flex', flexDirection:'row', background:'var(--bg)' }}>
      <Sidebar 
        ev={ev} 
        tabs={TABS} 
        activeTab={tab} 
        onTabChange={navigateTab}
        onLogout={handleLogout}
        onProjector={() => { window.location.hash = '#/projector'; }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header / Breadcrumbs */}
        <div style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, background: 'var(--bg-alpha)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, letterSpacing: '-.01em' }}>
            {breadcrumbs.map((bc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {i > 0 && <span style={{ color: 'var(--line)', fontSize: 15 }}>/</span>}
                <span style={{ color: i === breadcrumbs.length - 1 ? 'var(--ink)' : 'var(--muted)', cursor: bc.onClick ? 'pointer' : 'default', transition: 'color .15s' }}
                  onClick={bc.onClick}
                  onMouseEnter={e => bc.onClick && (e.currentTarget.style.color = 'var(--ink)')}
                  onMouseLeave={e => bc.onClick && i !== breadcrumbs.length - 1 && (e.currentTarget.style.color = 'var(--muted)')}>
                  {bc.label}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge variant={STATUS_VAR[ev.status]||'default'}>{ev.status}</Badge>
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <div 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="hover-lift"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--panel)', color: 'var(--ink)',
                  border: '1px solid var(--line)', borderRadius: 'var(--radius-full)',
                  padding: '6px 16px', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', userSelect: 'none',
                  boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s'
                }}
              >
                {ev.name}
                <ChevronDown size={14} style={{ color: 'var(--muted)', transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }} />
              </div>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 8,
                  background: 'var(--panel)', border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                  width: 240, zIndex: 100, overflow: 'hidden',
                  animation: 'scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {allEvents?.map(e => (
                      <div 
                        key={e.id}
                        onClick={() => {
                          localStorage.setItem('hackjudge_active_event_id', e.id);
                          queryClient.invalidateQueries(['eventData', user.id]);
                          setDropdownOpen(false);
                        }}
                        style={{
                          padding: '12px 16px', fontSize: 14, cursor: 'pointer',
                          background: ev.id === e.id ? 'var(--panel-2)' : 'transparent',
                          color: ev.id === e.id ? 'var(--ink)' : 'var(--muted)',
                          fontWeight: ev.id === e.id ? 600 : 500,
                          transition: 'background 0.15s, color 0.15s',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}
                        onMouseEnter={(event) => { event.currentTarget.style.background = 'var(--panel-2)'; event.currentTarget.style.color = 'var(--ink)'; }}
                        onMouseLeave={(event) => { 
                          if (ev.id !== e.id) {
                            event.currentTarget.style.background = 'transparent';
                            event.currentTarget.style.color = 'var(--muted)';
                          }
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
                        {ev.id === e.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)' }} />}
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: '1px solid var(--line)', padding: 8 }}>
                    <div 
                      onClick={() => {
                        setCreatingNew(true);
                        setDropdownOpen(false);
                      }}
                      style={{
                        padding: '10px', fontSize: 13, cursor: 'pointer',
                        color: 'var(--ink)', fontWeight: 600, borderRadius: 'var(--radius-sm)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'background 0.15s', border: '1px dashed var(--line)'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--blue-s)'; e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--blue)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink)'; }}
                    >
                      <Plus size={14} /> Create New Event
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, maxWidth: 860, width: '100%', margin: '0 auto', padding: '32px 24px 64px' }}>
          <div className="tab-enter">
            {tab==='setup'     && <SetupTab />}
            {tab==='rounds'    && <RoundsTab />}
            {tab==='results'   && <ResultsTab />}
            {tab==='shortlist' && <ShortlistTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
