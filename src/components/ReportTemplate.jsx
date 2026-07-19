import React from 'react';
import { getAvg, getJudgeTotal } from '../utils/scoring.js';

export function ReportTemplate({ ev, round, sorted, sortBy, getOverallAvg }) {
  if (!ev || !round || !sorted) return null;

  return (
    <div id="printable-report" style={{ display: 'none', background: '#fff', color: '#000', padding: '20px', fontFamily: 'var(--font-body)' }}>
      
      {/* Header */}
      <div style={{ borderBottom: '2px solid #000', paddingBottom: 16, marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, margin: 0 }}>{ev.name}</h1>
        <p style={{ fontSize: 16, color: '#4b5563', margin: '4px 0 0 0' }}>Round {round.number} Results · {new Date().toLocaleDateString()}</p>
        <p style={{ fontSize: 14, color: '#4b5563', margin: '4px 0 0 0' }}>Sorted by: {sortBy === 'overall' ? 'Overall Score' : 'Round Score'}</p>
      </div>

      {/* Teams List */}
      <div>
        {sorted.map((t, i) => {
          const track = ev.tracks?.find(tr => tr.id === t.track_id);
          const isShortlisted = round.advance_count && i < round.advance_count;
          const scoreToDisplay = sortBy === 'overall' && getOverallAvg ? getOverallAvg(t.id) : getAvg(ev, round.id, t.id);
          
          return (
            <div key={t.id} className="print-row" style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16, pageBreakInside: 'avoid' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>#{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{t.name}</div>
                    {t.projectTitle && <div style={{ fontSize: 14, color: '#4b5563' }}>{t.projectTitle}</div>}
                  </div>
                  {track && <span style={{ background: '#f1f3f5', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>{track.name}</span>}
                  {isShortlisted && <span style={{ border: '1px solid #000', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Advanced</span>}
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{scoreToDisplay}</div>
                </div>
              </div>

              {/* Judge Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {ev.judges?.map(j => {
                  const hasScored = ev.scores?.some(s => s.round_id === round.id && s.team_id === t.id && s.judge_id === j.id);
                  const total = hasScored ? getJudgeTotal(ev, round.id, j.id, t.id) : '—';
                  
                  return (
                    <div key={j.id} style={{ background: '#f8f9fa', padding: 8, borderRadius: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563' }}>{j.name}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{total}</div>
                      
                      {/* Note: the overrides/tie-breaks data model is not deeply fetched in useEventData yet, so we skip it for now */}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
