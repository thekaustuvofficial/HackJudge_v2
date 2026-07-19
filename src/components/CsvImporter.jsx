import { useState, useRef } from 'react';
import { Upload, ChevronRight, Check, X, AlertTriangle } from 'lucide-react';
import { Btn, Select, Input, Alert } from './ui';
import { uid } from '../security';

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (!lines.length) return { headers: [], rows: [] };
  
  // Basic split by comma, ignoring commas inside quotes
  const parseLine = line => {
    const row = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuote = !inQuote;
      } else if (c === ',' && !inQuote) {
        row.push(cur.trim().replace(/^"|"$/g, ''));
        cur = '';
      } else {
        cur += c;
      }
    }
    row.push(cur.trim().replace(/^"|"$/g, ''));
    return row;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  
  // Normalize row lengths
  const maxLen = headers.length;
  rows.forEach(r => {
    while (r.length < maxLen) r.push('');
  });
  
  return { headers, rows };
}

export function CsvImporter({ onImport, onCancel, existingTeamNames = [] }) {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Validate
  const [data, setData] = useState(null); // { headers, rows }
  const [mapping, setMapping] = useState({ name: -1, projectTitle: -1, email: -1 });
  const [validatedData, setValidatedData] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const csv = parseCsv(evt.target.result);
      if (csv.rows.length === 0) return alert('CSV is empty or invalid.');
      
      // Auto-detect columns
      const m = { name: -1, projectTitle: -1, email: -1 };
      csv.headers.forEach((h, i) => {
        const hl = h.toLowerCase();
        if (hl.includes('team') || hl === 'name') m.name = i;
        else if (hl.includes('title') || hl.includes('project')) m.projectTitle = i;
        else if (hl.includes('email') || hl.includes('leader')) m.email = i;
      });
      
      setMapping(m);
      setData(csv);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const handleMapNext = () => {
    if (mapping.name === -1) return alert('You must map a column to Team Name.');
    
    // Build validation list
    const v = data.rows.map(r => {
      const name = r[mapping.name] || '';
      const title = mapping.projectTitle !== -1 ? r[mapping.projectTitle] : '';
      const email = mapping.email !== -1 ? r[mapping.email] : '';
      
      const errors = [];
      if (!name.trim()) errors.push('Missing team name');
      if (existingTeamNames.includes(name.trim())) errors.push('Duplicate team name');
      
      return { id: uid(), name: name.trim(), projectTitle: title.trim(), email: email.trim(), errors, skip: false };
    });
    
    setValidatedData(v);
    setStep(3);
  };

  const handleImport = () => {
    const final = validatedData.filter(x => !x.skip && x.errors.length === 0).map(x => ({
      name: x.name, projectTitle: x.projectTitle, email: x.email
    }));
    onImport(final);
  };

  if (step === 1) {
    return (
      <div style={{ padding: 24, border: '2px dashed var(--line)', borderRadius: 12, textAlign: 'center' }}>
        <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--panel-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Upload size={24} color="var(--muted)" />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 8, fontFamily: 'var(--font-display)' }}>Upload Teams CSV</h3>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>Upload an export from Devfolio, Unstop, or Excel.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
          <Btn onClick={() => fileInputRef.current.click()}>Select File</Btn>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div style={{ padding: 24, border: '1px solid var(--line)', borderRadius: 12, background: 'var(--panel)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 16, fontFamily: 'var(--font-display)' }}>Map Columns</h3>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>We attempted to auto-detect your columns. Please verify the mapping.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ width: 120, fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Team Name *</span>
            <Select value={mapping.name} onChange={e => setMapping(m => ({ ...m, name: Number(e.target.value) }))} style={{ flex: 1 }}>
              <option value={-1}>— Ignore —</option>
              {data.headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i+1}`}</option>)}
            </Select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ width: 120, fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Project Title</span>
            <Select value={mapping.projectTitle} onChange={e => setMapping(m => ({ ...m, projectTitle: Number(e.target.value) }))} style={{ flex: 1 }}>
              <option value={-1}>— Ignore —</option>
              {data.headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i+1}`}</option>)}
            </Select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ width: 120, fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Leader Email</span>
            <Select value={mapping.email} onChange={e => setMapping(m => ({ ...m, email: Number(e.target.value) }))} style={{ flex: 1 }}>
              <option value={-1}>— Ignore —</option>
              {data.headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i+1}`}</option>)}
            </Select>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setStep(1)}>Back</Btn>
          <Btn onClick={handleMapNext}>Validate Data <ChevronRight size={16}/></Btn>
        </div>
      </div>
    );
  }

  if (step === 3) {
    const ready = validatedData.filter(x => !x.skip && x.errors.length === 0).length;
    const errors = validatedData.filter(x => !x.skip && x.errors.length > 0).length;
    
    return (
      <div style={{ padding: 24, border: '1px solid var(--line)', borderRadius: 12, background: 'var(--panel)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 8, fontFamily: 'var(--font-display)' }}>Validation</h3>
        
        {errors > 0 ? (
          <Alert variant="error" style={{ marginBottom: 16 }}>
            {ready} teams ready, {errors} need attention. Fix them inline or skip them.
          </Alert>
        ) : (
          <Alert variant="success" style={{ marginBottom: 16 }}>
            All {ready} teams look good and are ready to import.
          </Alert>
        )}
        
        <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 8, marginBottom: 24 }}>
          {validatedData.map((row, i) => (
            <div key={row.id} style={{ display: 'flex', gap: 12, padding: 12, borderBottom: i === validatedData.length - 1 ? 'none' : '1px solid var(--line)', background: row.skip ? 'var(--panel-2)' : row.errors.length ? 'var(--red-s)' : 'var(--bg)', opacity: row.skip ? 0.5 : 1 }}>
              <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                <Input value={row.name} onChange={e => {
                  const n = e.target.value;
                  setValidatedData(v => v.map(x => {
                    if (x.id !== row.id) return x;
                    const errs = [];
                    if (!n.trim()) errs.push('Missing team name');
                    if (existingTeamNames.includes(n.trim())) errs.push('Duplicate team name');
                    return { ...x, name: n, errors: errs };
                  }));
                }} disabled={row.skip} placeholder="Team Name" style={{ flex: 1, padding: '4px 8px', height: 32 }} />
                <Input value={row.projectTitle} onChange={e => {
                  setValidatedData(v => v.map(x => x.id === row.id ? { ...x, projectTitle: e.target.value } : x));
                }} disabled={row.skip} placeholder="Project Title" style={{ flex: 1, padding: '4px 8px', height: 32 }} />
              </div>
              <div style={{ width: 140, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {!row.skip && row.errors.map(err => <span key={err} style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600 }}>{err}</span>)}
              </div>
              <Btn size="xs" variant="ghost" onClick={() => setValidatedData(v => v.map(x => x.id === row.id ? { ...x, skip: !x.skip } : x))}>
                {row.skip ? 'Restore' : 'Skip'}
              </Btn>
            </div>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setStep(2)}>Back</Btn>
          <Btn variant="primary" onClick={handleImport} disabled={ready === 0}>Import {ready} Teams</Btn>
        </div>
      </div>
    );
  }
  
  return null;
}
