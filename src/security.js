export const LIMITS = {
  // Teams
  TEAM_NAME: 60,
  teamName: 60, // alias kept for backwards-compat

  // Criteria / Parameters
  MAX_PARAMS: 10,
  PARAM_NAME: 40,
  criterionName: 40, // alias

  // Rounds
  MAX_ROUNDS: 5,
  maxRounds: 5, // alias

  // Teams count
  MAX_TEAMS: 200,
  maxTeams: 200, // alias

  // Judges
  MAX_JUDGES: 50,
  JUDGE_NAME: 80,
  EMAIL: 120,

  // Tracks & Panels
  MAX_TRACKS: 20,
  TRACK_NAME: 40,
  MAX_PANELS: 20,

  // Misc
  DESCRIPTION: 120,

  // Auth
  PASSWORD_MIN: 8,
};

export function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
}

export function truncate(str, len = 20) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

export function parseJwt(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}
