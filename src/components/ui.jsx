import { useEffect, useRef, useState } from 'react';
import { Moon, Sun, AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

/* ── LOGO ───────────────────────────────────── */
export function Logo({ size = 24, color = "#eceef2" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }}>
      <rect x="26" y="18" width="9" height="56" rx="4" fill={color}/>
      <rect x="26" y="41" width="48" height="9" rx="4" fill={color}/>
      <rect x="65" y="18" width="9" height="41" rx="3" fill={color}/>
      <path d="M65,58 L74,58 C74,74 62,86 51,84 L48,82 C56,80 62,70 65,58 Z" fill={color}/>
    </svg>
  );
}

/* inject animation keyframes */
if (!document.getElementById('hj-kf')) {
  const s = document.createElement('style');
  s.id = 'hj-kf';
  s.textContent = `
    @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
  `;
  document.head.appendChild(s);
}

/* ── MOTION ─────────────────────────────── */
const PRESETS = {
  fadeUp:   [{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],
  fadeIn:   [{opacity:0},{opacity:1}],
  scaleIn:  [{opacity:0,transform:'scale(.95) translateY(6px)'},{opacity:1,transform:'scale(1) translateY(0)'}],
  slideR:   [{opacity:0,transform:'translateX(-10px)'},{opacity:1,transform:'translateX(0)'}],
};
export function Motion({children,type='fadeUp',delay=0,style,className}) {
  const ref = useRef(null);
  useEffect(()=>{
    const el=ref.current; if(!el) return;
    el.style.opacity='0';
    const a=el.animate(PRESETS[type]||PRESETS.fadeUp,{
      duration:400, delay:delay*55, fill:'forwards',
      easing:'cubic-bezier(.22,.68,0,1.12)',
    });
    return ()=>a.cancel();
  },[type,delay]);
  return <div ref={ref} style={style} className={className}>{children}</div>;
}

/* ── BUTTON ─────────────────────────────── */
const BSIZE = {
  xs:{padding:'4px 12px', fontSize:12, borderRadius:'var(--radius-full)', minHeight:30},
  sm:{padding:'8px 16px', fontSize:13, borderRadius:'var(--radius-full)', minHeight:36},
  md:{padding:'12px 24px',fontSize:14, borderRadius:'var(--radius-full)', minHeight:44},
  lg:{padding:'16px 32px',fontSize:15, borderRadius:'var(--radius-full)', minHeight:52},
};
const BVAR = {
  primary:{background:'var(--blue)',   color:'var(--blue-text)', border:'none', boxShadow:'var(--shadow-sm)'},
  ghost:  {background:'var(--panel-2)', color:'var(--ink)', border:'1px solid var(--line)'},
  danger: {background:'var(--red)',     color:'#ffffff', border:'none', boxShadow:'var(--shadow-sm)'},
  success:{background:'var(--green)',   color:'#ffffff', border:'none', boxShadow:'var(--shadow-sm)'},
  outline:{background:'transparent',    color:'var(--ink)', border:'1px solid var(--line)'},
  muted:  {background:'transparent',    color:'var(--muted)', border:'1px solid var(--line)'},
};
export function Btn({children,onClick,variant='primary',size='md',disabled=false,type='button',full=false,style,className=''}) {
  const v = BVAR[variant]||BVAR.primary;
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`hover-lift ${variant === 'primary' ? 'btn-metal' : ''} ${className}`}
      onMouseEnter={e=>{if(!disabled){
        e.currentTarget.style.filter='brightness(1.05)';
        if(variant==='primary') e.currentTarget.style.boxShadow='var(--glow-ink)';
      }}}
      onMouseLeave={e=>{
        e.currentTarget.style.filter='';
        if(variant==='primary') e.currentTarget.style.boxShadow=v.boxShadow;
      }}
      onMouseDown={e=>{if(!disabled)e.currentTarget.style.transform='scale(.96)';}}
      onMouseUp={e=>{e.currentTarget.style.transform='';}}
      style={{
        display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,
        fontFamily:'var(--font-display)',fontWeight:600,
        cursor:disabled?'not-allowed':'pointer',userSelect:'none',
        transition:'all .15s ease',
        opacity:disabled?.45:1,width:full?'100%':undefined,
        WebkitTapHighlightColor:'transparent',
        ...BSIZE[size],...v,...style,
      }}>
      {children}
    </button>
  );
}

/* ── FIELD / INPUT ──────────────────────── */
const I_BASE = {
  background:'var(--panel-2)',border:'1px solid var(--line)',
  borderRadius:'var(--radius-md)',padding:'12px 16px',
  color:'var(--ink)',fontSize:16,outline:'none',width:'100%',
  fontFamily:'var(--font-body)',lineHeight:1.5,
  transition:'all .2s cubic-bezier(0.34, 1.56, 0.64, 1)',
  WebkitAppearance:'none',
  backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
  minHeight:48, /* slightly taller touch target for mobile friendly */
};
const onF=e=>{
  e.target.style.borderColor='var(--ink)';
  e.target.style.background='var(--panel)';
  e.target.style.boxShadow='var(--glow-sm)';
  e.target.style.transform='scale(1.01)';
};
const onB=e=>{
  e.target.style.borderColor='var(--line)';
  e.target.style.background='var(--panel-2)';
  e.target.style.boxShadow='none';
  e.target.style.transform='scale(1)';
};

export function Field({label,hint,children}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:7}}>
      {label&&<label style={{fontSize:12,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.08em'}}>{label}</label>}
      {children}
      {hint&&<span style={{fontSize:12,color:'var(--muted)',lineHeight:1.4}}>{hint}</span>}
    </div>
  );
}
export function Input({label,hint,...p}) {
  return <Field label={label} hint={hint}><input {...p} style={{...I_BASE,...p.style}} onFocus={onF} onBlur={onB}/></Field>;
}
export function Select({label,hint,children,...p}) {
  return (
    <Field label={label} hint={hint}>
      <select {...p} style={{...I_BASE,appearance:'none',WebkitAppearance:'none',paddingRight:38,cursor:'pointer',
        backgroundImage:`url("data:image/svg+xml,%3Csvg width='11' height='7' viewBox='0 0 11 7' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke='%235e5848' stroke-width='1.7' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat:'no-repeat',backgroundPosition:'right 14px center',...p.style}}
        onFocus={onF} onBlur={onB}>{children}</select>
    </Field>
  );
}
export function Textarea({label,hint,...p}) {
  return <Field label={label} hint={hint}><textarea {...p} style={{...I_BASE,resize:'vertical',minHeight:88,lineHeight:1.6,...p.style}} onFocus={onF} onBlur={onB}/></Field>;
}

/* ── CARD ───────────────────────────────── */
export function Card({children,hover=false,onClick,style,className=''}) {
  const [h,setH]=useState(false);
  return (
    <div onClick={onClick} className={`${hover ? 'hover-lift hover-glow' : ''} ${className}`}
      onMouseEnter={hover?()=>setH(true):undefined}
      onMouseLeave={hover?()=>setH(false):undefined}
      style={{
        background:'var(--panel)',
        border:`1px solid ${h?'var(--ink)':'var(--line)'}`,
        boxShadow: h ? 'var(--shadow-lg), var(--glow-sm), var(--shadow-inner)' : 'var(--shadow-md), var(--shadow-inner)',
        borderRadius:'var(--radius-lg)',padding:'32px',
        backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
        transition:'all .2s ease-out',
        cursor:hover?'pointer':undefined,...style,
      }}>{children}</div>
  );
}

/* ── SECTION HEADER ─────────────────────── */
export function SectionHead({title,sub,action}) {
  return (
    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:22}}>
      <div>
        <h2 style={{fontFamily:'var(--font-display)',fontSize:21,fontWeight:400,color:'var(--ink)',lineHeight:1.15,letterSpacing:'-.01em'}}>{title}</h2>
        {sub&&<p style={{fontSize:13,color:'var(--muted)',marginTop:5,lineHeight:1.5}}>{sub}</p>}
      </div>
      {action&&<div style={{marginLeft:16,flexShrink:0}}>{action}</div>}
    </div>
  );
}

/* ── BADGE ──────────────────────────────── */
const BVARS={
  default:{background:'var(--panel-2)',color:'var(--muted)',border:'1px solid var(--line)'},
  gold:   {background:'var(--amber-s)',color:'var(--amber)',border:'1px solid transparent'},
  teal:   {background:'var(--green-s)',  color:'var(--green)',  border:'1px solid transparent'},
  amber:  {background:'var(--amber-s)', color:'var(--amber)', border:'1px solid transparent'},
  rose:   {background:'var(--red-s)',  color:'var(--red)',  border:'1px solid transparent'},
  blue:   {background:'var(--blue-s)',  color:'var(--ink)',  border:'1px solid transparent'},
};
export function Badge({children,variant='default',style}) {
  const v=BVARS[variant]||BVARS.default;
  return <span style={{...v,display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:'var(--radius-full)',fontFamily:'var(--font-mono)',fontSize:12,fontWeight:600,whiteSpace:'nowrap',...style}}>{children}</span>;
}

/* ── ALERT ──────────────────────────────── */
const AVARS={warn:{bg:'var(--amber-s)',b:'transparent',c:'var(--amber)'},error:{bg:'var(--red-s)',b:'transparent',c:'var(--red)'},success:{bg:'var(--green-s)',b:'transparent',c:'var(--green)'},info:{bg:'var(--blue-s)',b:'transparent',c:'var(--ink)'}};
export function Alert({children,variant='warn',style}) {
  const v=AVARS[variant]||AVARS.warn;
  return <div style={{background:v.bg,border:`1px solid ${v.b}`,color:v.c,borderRadius:'var(--radius-md)',padding:'16px 20px',fontSize:14,fontWeight:500,lineHeight:1.5,marginBottom:16,...style}}>{children}</div>;
}

/* ── EMPTY STATE ────────────────────────── */
export function Empty({icon:Icon,title,sub}) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'44px 24px',textAlign:'center',gap:10}}>
      {Icon&&<div style={{width:46,height:46,borderRadius:8,background:'var(--panel-2)',border:'1.5px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon size={20} style={{color:'var(--muted)'}}/></div>}
      <p style={{fontWeight:700,color:'var(--ink)',fontSize:14,marginTop:4}}>{title}</p>
      {sub&&<p style={{fontSize:13,color:'var(--muted)',maxWidth:280,lineHeight:1.5}}>{sub}</p>}
    </div>
  );
}

/* ── THEME TOGGLE ───────────────────────── */
export function ThemeToggle({ theme, toggle }) {
  return (
    <button onClick={toggle} style={{
      width:40, height:40, borderRadius:'var(--radius-full)', background:'var(--panel-2)', border:'1px solid var(--line)',
      display:'flex', alignItems:'center', justifyContent:'center', color:'var(--ink)', cursor:'pointer',
      transition:'all .15s ease'
    }}>
      {theme === 'dark' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
      )}
    </button>
  );
}

/* ── CHIP ROW ───────────────────────────── */
export function ChipRow({items,active,onSelect}) {
  return (
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:22}}>
      {items.map(item=>(
        <button key={item.id} onClick={()=>onSelect(item.id)} className="hover-lift"
          style={{padding:'8px 20px',borderRadius:'var(--radius-full)',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-body)',transition:'all .2s ease',WebkitTapHighlightColor:'transparent',
            background:active===item.id?'var(--ink)':'var(--panel-2)',
            color:active===item.id?'var(--bg)':'var(--muted)',
            backdropFilter:active===item.id?'none':'blur(12px)', WebkitBackdropFilter:active===item.id?'none':'blur(12px)',
            border:`1px solid ${active===item.id?'transparent':'var(--line)'}`,
            boxShadow:active===item.id?'var(--glow-ink)':'none',
          }}>{item.label}</button>
      ))}
    </div>
  );
}

/* ── PROGRESS BAR ───────────────────────── */
export function ProgressBar({pct,label}) {
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:7}}>
        <span style={{fontSize:13,color:'var(--muted)',fontWeight:500}}>{label}</span>
        <span style={{fontSize:13,color:'var(--blue)',fontWeight:700}}>{Math.round(pct)}%</span>
      </div>
      <div style={{height:6,background:'var(--panel-2)',borderRadius:99,overflow:'hidden'}}>
        <div style={{height:'100%',borderRadius:99,background:'linear-gradient(90deg,var(--blue-s),var(--blue))',width:`${pct}%`,transition:'width .55s cubic-bezier(.22,.68,0,1.1)'}}/>
      </div>
    </div>
  );
}

/* ── TOAST ──────────────────────────────── */
let _setToast=null;
export function ToastContainer() {
  const [msg,setMsg]=useState(null);
  _setToast=setMsg;
  useEffect(()=>{if(!msg)return;const t=setTimeout(()=>setMsg(null),2800);return()=>clearTimeout(t);},[msg]);
  if(!msg)return null;
  return (
    <div style={{position:'fixed',bottom:32,left:'50%',background:'var(--ink)',border:'none',color:'var(--bg)',fontSize:14,fontWeight:600,padding:'16px 32px',borderRadius:'var(--radius-full)',boxShadow:'var(--shadow-lg)',zIndex:9999,maxWidth:'90vw',textAlign:'center',animation:'toastIn .3s cubic-bezier(.22,.68,0,1.1) both',letterSpacing:'.01em'}}>
      {msg}
    </div>
  );
}
export const toast=msg=>_setToast?.(msg);

/* ── LIST ROW ───────────────────────────── */
export function ListRow({children,delay=0}) {
  const [h,setH]=useState(false);
  return (
    <Motion delay={delay%10} type="slideR">
      <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} className="hover-lift"
        style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:h?'var(--panel-2)':'var(--panel)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',border:`1px solid var(--line)`,borderRadius:'var(--radius-md)',padding:'20px',marginBottom:12,transition:'all .2s ease'}}>
        {children}
      </div>
    </Motion>
  );
}

/* ── DELETE BUTTON ──────────────────────── */
export function DelBtn({onClick}) {
  const [h,setH]=useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{background:h?'var(--red-s)':'none',border:'none',cursor:'pointer',padding:'8px',borderRadius:8,color:h?'var(--red)':'var(--muted)',transition:'all .15s ease',display:'flex',alignItems:'center',WebkitTapHighlightColor:'transparent',minWidth:44,minHeight:44,justifyContent:'center'}}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
    </button>
  );
}

/* ── SPLIT FLAP DIGIT ───────────────────── */
export function SplitFlapDigit({ value, size = 'L' }) {
  const [currentVal, setCurrentVal] = useState(value);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (value !== currentVal) {
      setAnimating(true);
      const t = setTimeout(() => {
        setCurrentVal(value);
        setAnimating(false);
      }, 400); // match flap-animate CSS
      return () => clearTimeout(t);
    }
  }, [value, currentVal]);

  const fs = size === 'L' ? 32 : size === 'M' ? 24 : 16;
  const padding = size === 'L' ? '4px 8px' : '2px 6px';
  const radius = size === 'L' ? 5 : 4;

  return (
    <div style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      background:'var(--bg-2)', border:'1px solid var(--line)', borderRadius:radius,
      padding:padding, minWidth:fs*1.5, fontFamily:'var(--font-mono)',
      fontSize:fs, fontWeight:700, color:'var(--amber)',
      lineHeight:1, overflow:'hidden', position:'relative',
    }}>
      <span className={animating ? 'flap-animate' : ''} style={{ display:'inline-block' }}>
        {animating ? currentVal : value}
      </span>
    </div>
  );
}

/* ── TOOLTIP ────────────────────────────── */
export function Tooltip({ children, text }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position:'relative', display:'inline-flex' }} onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      {children}
      {show && (
        <div style={{
          position:'absolute', bottom:'100%', left:'50%', transform:'translateX(-50%) translateY(-6px)',
          background:'var(--ink)', color:'var(--bg)', padding:'4px 8px', borderRadius:6,
          fontSize:12, fontWeight:500, whiteSpace:'nowrap', zIndex:100, pointerEvents:'none',
          fontFamily:'var(--font-body)', letterSpacing:'.02em', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {text}
          <div style={{ position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)', borderLeft:'4px solid transparent', borderRight:'4px solid transparent', borderTop:'4px solid var(--ink)' }} />
        </div>
      )}
    </div>
  );
}

/* ── CONFIRM MODAL ──────────────────────── */
export function ConfirmModal({ isOpen, title, desc, onConfirm, onCancel, confirmText="Confirm", danger=false }) {
  if (!isOpen) return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ position:'absolute', inset:0, background:'var(--bg-alpha)', backdropFilter:'blur(4px)' }} onClick={onCancel} />
      <div style={{ position:'relative', background:'var(--panel)', border:'1px solid var(--line)', borderRadius:'var(--radius-lg)', padding:'32px', width:'100%', maxWidth:420, boxShadow:'var(--shadow-lg)', animation:'scaleIn .2s cubic-bezier(.22,.68,0,1.1) forwards' }}>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:600, color:'var(--ink)', marginBottom:12, letterSpacing:'-.01em' }}>{title}</h3>
        <p style={{ fontSize:15, color:'var(--muted)', lineHeight:1.6, marginBottom:32 }}>{desc}</p>
        <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
          <Btn variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmText}</Btn>
        </div>
      </div>
    </div>
  );
}
