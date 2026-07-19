import { Btn, ThemeToggle, Logo } from './ui';
import { LogOut } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export function Topbar({ title, sub, breadcrumbs, right, onLogout }) {
  const { theme, toggle } = useTheme();
  return (
    <div style={{
      position:'sticky', top:0, zIndex:50,
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'16px 24px',
      background:'var(--bg)',
      borderBottom:'1px solid var(--line)',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        {/* Brand mark */}
        <div style={{
          width:36, height:36, borderRadius:8,
          background:'var(--ink)',
          display:'flex', alignItems:'center', justifyContent:'center',
          flexShrink:0,
        }}>
          <Logo size={20} color="var(--bg)" />
        </div>
        <div>
          {breadcrumbs ? (
            <div style={{ display:'flex', alignItems:'center', gap:8, fontFamily:'var(--font-display)', fontSize:15, fontWeight:600, letterSpacing:'-.01em' }}>
              {breadcrumbs.map((bc, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {i > 0 && <span style={{ color:'var(--line)', fontSize:15 }}>/</span>}
                  <span style={{ color: i === breadcrumbs.length - 1 ? 'var(--ink)' : 'var(--muted)', cursor: bc.onClick ? 'pointer' : 'default', transition:'color .15s' }}
                    onClick={bc.onClick}
                    onMouseEnter={e => bc.onClick && (e.currentTarget.style.color = 'var(--ink)')}
                    onMouseLeave={e => bc.onClick && i !== breadcrumbs.length - 1 && (e.currentTarget.style.color = 'var(--muted)')}>
                    {bc.label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div style={{ fontFamily:'var(--font-display)', fontSize:16, color:'var(--ink)', fontWeight: 600, lineHeight:1.2, letterSpacing:'-.01em' }}>{title}</div>
              {sub && <div style={{ fontSize:12, color:'var(--muted)', fontWeight:500, marginTop:2 }}>{sub}</div>}
            </>
          )}
        </div>
        {right && <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:8 }}>{right}</div>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        <ThemeToggle theme={theme} toggle={toggle} />
        {onLogout && (
          <Btn size="sm" variant="ghost" onClick={onLogout} style={{ padding:'8px 12px' }}>
            <LogOut size={16} />
          </Btn>
        )}
      </div>
    </div>
  );
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{
      display:'flex', background:'var(--bg-2)',
      borderBottom:'1px solid var(--line)',
      overflowX:'auto', scrollbarWidth:'none',
      padding:'0 16px',
    }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={()=>onChange(tab.id)}
          style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'16px 20px', fontSize:14, fontWeight:600,
            color: active===tab.id ? 'var(--blue)' : 'var(--muted)',
            cursor:'pointer', whiteSpace:'nowrap',
            background:'none', border:'none',
            borderBottomStyle:'solid',
            borderBottomWidth:2,
            borderBottomColor: active===tab.id ? 'var(--blue)' : 'transparent',
            transition:'color .15s, border-color .15s',
            fontFamily:'var(--font-display)', /* Space Grotesk for every tab */
          }}
          onMouseEnter={e => { if (active!==tab.id) e.currentTarget.style.color='var(--ink)'; }}
          onMouseLeave={e => { if (active!==tab.id) e.currentTarget.style.color='var(--muted)'; }}
        >
          <tab.icon size={16} />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
