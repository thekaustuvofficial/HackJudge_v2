import React from 'react';
import { getAvg, sortedRounds } from '../utils/scoring.js';

export function ReportTemplate({ ev }) {
  if (!ev) return null;
  const rounds = sortedRounds(ev);
  const totalJudges = ev.judges?.length || 0;
  const totalTeams = ev.teams?.length || 0;

  // Helper to compute overall avg
  const getOverallAvg = (teamId) => {
    let total = 0, count = 0;
    rounds.forEach(r => {
      const avg = getAvg(ev, r.id, teamId);
      if (avg > 0) {
        total += avg;
        count++;
      }
    });
    return count ? (total / count).toFixed(2) : '0.00';
  };

  return (
    <div id="printable-report" style={{ background: '#ffffff', color: '#000000', padding: '40px', fontFamily: 'system-ui, sans-serif', fontSize: '14px', lineHeight: 1.5 }}>
      
      {/* ── COVER PAGE / HEADER ── */}
      <div style={{ paddingBottom: 32, marginBottom: 32, borderBottom: '2px solid #000', textAlign: 'center' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>{ev.name}</h1>
        <p style={{ fontSize: 18, color: '#4b5563', margin: '0 0 24px 0', fontWeight: 500 }}>
          {ev.type === 'hackathon' ? 'Hackathon' : 'Pitch Competition'} Official Report · {new Date().toLocaleDateString()}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* Judging Panel */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Judging Panel ({totalJudges})</h3>
            <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
              {ev.judges?.map(j => (
                <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>{j.name}</span>
                  <span style={{ color: '#4b5563', fontFamily: 'monospace', fontSize: 12 }}>{j.email}</span>
                </div>
              ))}
              {totalJudges === 0 && <span style={{ color: '#9ca3af' }}>No judges assigned.</span>}
            </div>
          </div>

          {/* Evaluation Parameters */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Evaluation Parameters</h3>
            <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
              {ev.criteria?.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                  <span style={{ color: '#4b5563', fontFamily: 'monospace', fontSize: 12 }}>{c.weight}%</span>
                </div>
              ))}
              {(!ev.criteria || ev.criteria.length === 0) && <span style={{ color: '#9ca3af' }}>No parameters configured.</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── ROUND PAGES ── */}
      {rounds.map((round, rIndex) => {
        const sortedTeams = [...(ev.teams || [])].sort((a,b) => getAvg(ev, round.id, b.id) - getAvg(ev, round.id, a.id));
        
        return (
          <div key={round.id} className={rIndex > 0 ? "print-page-break" : ""} style={{ marginTop: rIndex > 0 ? 0 : 32 }}>
            
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0' }}>Round {round.number}: {round.name}</h2>
              <p style={{ color: '#6b7280', margin: 0 }}>Sorted by round score · {totalTeams} Teams Participating</p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#111827', color: '#fff' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, width: '60px' }}>Rank</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Team</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Track</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, width: '100px' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((t, i) => {
                  const track = ev.tracks?.find(tr => tr.id === t.track_id);
                  const score = getAvg(ev, round.id, t.id);
                  const isShortlisted = round.advance_count && i < round.advance_count;
                  
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #e5e7eb', background: isShortlisted ? '#f0fdf4' : '#ffffff' }}>
                      <td style={{ padding: '16px', fontWeight: 700, fontFamily: 'monospace' }}>#{i + 1}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</div>
                        {t.projectTitle && <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>{t.projectTitle}</div>}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {track ? <span style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#374151' }}>{track.name}</span> : '—'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', fontSize: 16 }}>
                        {score}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* ── OVERALL RANKINGS (Final Page) ── */}
      {rounds.length > 1 && (
        <div className="print-page-break" style={{ marginTop: 32 }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0' }}>Overall Tournament Rankings</h2>
            <p style={{ color: '#6b7280', margin: 0 }}>Aggregated averages across all {rounds.length} rounds</p>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#111827', color: '#fff' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, width: '60px' }}>Rank</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Team</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Track</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, width: '140px' }}>Overall Score</th>
              </tr>
            </thead>
            <tbody>
              {[...(ev.teams || [])].sort((a,b) => getOverallAvg(b.id) - getOverallAvg(a.id)).map((t, i) => {
                const track = ev.tracks?.find(tr => tr.id === t.track_id);
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '16px', fontWeight: 700, fontFamily: 'monospace' }}>#{i + 1}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {track ? <span style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#374151' }}>{track.name}</span> : '—'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', fontSize: 16 }}>
                      {getOverallAvg(t.id)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
