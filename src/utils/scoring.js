export const GRADE_MAP = { 'A+':10, A:9, 'B+':8, B:7, 'C+':6, C:5, D:3, F:0 };

// Helper to filter out superseded scores based on client_id.
// If multiple client_ids exist for the same (round_id, judge_id, team_id, criterion_id),
// the one with the newest created_at is the active one.
function getActiveScores(scores) {
  const latest = new Map(); // key -> score row
  for (const s of scores) {
    const key = `${s.round_id}_${s.judge_id}_${s.team_id}_${s.criterion_id}`;
    if (!latest.has(key) || new Date(s.client_submitted_at) > new Date(latest.get(key).client_submitted_at)) {
      latest.set(key, s);
    }
  }
  return Array.from(latest.values());
}

export function getAvg(ev, roundId, teamId) {
  if (!ev.scores) return 0;
  const activeScores = getActiveScores(ev.scores).filter(
    s => s.round_id === roundId && s.team_id === teamId
  );
  
  if (activeScores.length === 0) return 0;

  // Group scores by judge
  const judgeScores = {};
  for (const s of activeScores) {
    if (!judgeScores[s.judge_id]) judgeScores[s.judge_id] = [];
    judgeScores[s.judge_id].push(s);
  }

  let totalAvg = 0;
  let numJudges = 0;

  for (const judgeId in judgeScores) {
    const scores = judgeScores[judgeId];
    let judgeTotal = 0;
    
    for (const s of scores) {
      const p = ev.criteria?.find(c => c.id === s.criterion_id);
      if (!p || p.type === 'text') continue;
      const isActiveForRound = p.round_ids?.length === 0 || p.round_ids?.includes(roundId);
      if (!isActiveForRound) continue;
      
      const maxScore = Number(p.max_score) || 10;
      const weight = Number(p.weight) || 0;
      judgeTotal += (Number(s.value) / maxScore) * weight;
    }
    
    totalAvg += judgeTotal;
    numJudges++;
  }

  const baseAvg = numJudges ? +(totalAvg / numJudges).toFixed(2) : 0;
  return baseAvg;
}

export function getJudgeTotal(ev, roundId, judgeId, teamId) {
  if (!ev.scores) return 0;
  const activeScores = getActiveScores(ev.scores).filter(
    s => s.round_id === roundId && s.judge_id === judgeId && s.team_id === teamId
  );

  let sum = 0;
  for (const s of activeScores) {
    const p = ev.criteria?.find(c => c.id === s.criterion_id);
    if (!p || p.type === 'text') continue;
    const isActiveForRound = p.round_ids?.length === 0 || p.round_ids?.includes(roundId);
    if (!isActiveForRound) continue;
    
    const maxScore = Number(p.max_score) || 10;
    const weight = Number(p.weight) || 0;
    sum += (Number(s.value) / maxScore) * weight;
  }
  return +sum.toFixed(1);
}

export function sortedRounds(ev) {
  if (!ev.rounds) return [];
  // Sort by created_at since number isn't reliably available in schema, though we might use a timestamp or sort by id? 
  // Wait, schema rounds table has NO `number` column. It relies on created_at or we just sort by created_at.
  return [...ev.rounds].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((r, i) => ({
    ...r,
    number: i + 1 // Add logical number based on creation order
  }));
}
