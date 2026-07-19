import { useState } from 'react';
import { LogOut, Play, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Logo, ThemeToggle, Tooltip } from './ui';
import { useTheme } from '../hooks/useTheme';

export function Sidebar({ ev, tabs, activeTab, onTabChange, onLogout, onProjector }) {
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="sidebar-nav" style={{
      width: collapsed ? 72 : 240,
      background: 'var(--panel)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-md), var(--shadow-inner)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s cubic-bezier(.22,.68,0,1.1)',
      height: 'calc(100vh - 32px)',
      position: 'sticky',
      top: 16,
      margin: '16px 0 16px 16px',
      flexShrink: 0,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div className="sidebar-header" style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--line)', overflow: 'hidden' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: 'var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Logo size={18} color="var(--bg)" />
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0, whiteSpace: 'nowrap' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--ink)', fontWeight: 600, letterSpacing: '-.01em', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.name}</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="sidebar-links" style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const content = (
            <button key={tab.id} onClick={() => onTabChange(tab.id)} className="sidebar-link-btn hover-lift" style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              background: 'transparent',
              color: isActive ? 'var(--ink)' : 'var(--muted)',
              border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'all .15s',
              fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, width: '100%',
              justifyContent: collapsed ? 'center' : 'flex-start',
              position: 'relative'
            }}
            onMouseEnter={e => { if(!isActive) { e.currentTarget.style.color='var(--ink)'; e.currentTarget.style.background='var(--panel-2)'; } }}
            onMouseLeave={e => { if(!isActive) { e.currentTarget.style.color='var(--muted)'; e.currentTarget.style.background='transparent'; } }}
            >
              {isActive && (
                <div style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, background: 'var(--ink)', borderRadius: 99, boxShadow: '0 0 12px var(--ink)', animation: 'fadeIn .2s ease-out forwards' }} />
              )}
              <tab.icon size={18} />
              <span className={collapsed ? "mobile-only" : ""}>{tab.label}</span>
            </button>
          );
          return collapsed ? <Tooltip key={tab.id} text={tab.label}>{content}</Tooltip> : content;
        })}
      </div>

      {/* Footer */}
      <div className="sidebar-footer" style={{ padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: collapsed ? 'center' : 'space-between', padding: collapsed ? 0 : '0 8px' }}>
          {!collapsed && <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>THEME</span>}
          <ThemeToggle theme={theme} toggle={toggle} />
        </div>

        {collapsed ? (
          <Tooltip text="Projector (Coming Soon)">
            <button disabled style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px',
              background: 'transparent', color: 'var(--ink)',
              border: '1px solid var(--line)', borderRadius: 8, cursor: 'not-allowed', transition: 'all .15s',
              width: '100%', opacity: 0.5
            }}>
              <Play size={18} />
            </button>
          </Tooltip>
        ) : (
          <button disabled style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
            background: 'transparent', color: 'var(--ink)',
            border: '1px solid var(--line)', borderRadius: 8, cursor: 'not-allowed', transition: 'all .15s',
            fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, width: '100%', opacity: 0.5
          }}>
            <Play size={18} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span>Projector</span>
              <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500, letterSpacing: '.05em', textTransform: 'uppercase' }}>Coming Soon</span>
            </div>
          </button>
        )}

        {collapsed ? (
          <Tooltip text="Logout">
            <button onClick={onLogout} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px',
              background: 'transparent', color: 'var(--muted)',
              border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'all .15s',
              width: '100%'
            }} onMouseEnter={e=>e.currentTarget.style.color='var(--red)'} onMouseLeave={e=>e.currentTarget.style.color='var(--muted)'}>
              <LogOut size={18} />
            </button>
          </Tooltip>
        ) : (
          <button onClick={onLogout} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
            background: 'transparent', color: 'var(--muted)',
            border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'all .15s',
            fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, width: '100%'
          }} onMouseEnter={e=>e.currentTarget.style.color='var(--red)'} onMouseLeave={e=>e.currentTarget.style.color='var(--muted)'}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        )}

        {collapsed ? (
          <Tooltip text="Expand">
            <button onClick={() => setCollapsed(!collapsed)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', marginTop: 12,
              background: 'transparent', color: 'var(--muted)',
              border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'all .15s',
              width: '100%'
            }}>
              <PanelLeftOpen size={18} />
            </button>
          </Tooltip>
        ) : (
          <button onClick={() => setCollapsed(!collapsed)} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', marginTop: 12,
            background: 'transparent', color: 'var(--muted)',
            border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'all .15s',
            fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, width: '100%'
          }}>
            <PanelLeftClose size={18} />
            <span>Collapse Menu</span>
          </button>
        )}
      </div>
    </div>
  );
}
