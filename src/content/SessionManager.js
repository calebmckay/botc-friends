const ACCESS_TOKEN_EXPIRY_MS = 10 * 60 * 1000;

export class SessionManager {
  constructor() {
    if (SessionManager.instance) {
      return SessionManager.instance;
    }
    SessionManager.instance = this;

    this.accessToken = null;
    this.accessTokenTimestamp = null;
    this.sessions = [];

    this.fetchSessions();
  }

  static getInstance() {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  getScriptName(edition) {
    switch (edition.id) {
      case "tb": return "Trouble Brewing";
      case "snv": return "Sects & Violets";
      case "bmr": return "Bad Moon Rising";
      case "custom": return `Custom: ${edition.name} by ${edition.author}`;
      case "homebrew": return `Homebrew: ${edition.name} by ${edition.author}`;
      default: return "Unknown Script";
    }
  }

  getSession(id) {
    return this.sessions.find(s => s.id === id)
  }

  async refreshAccessToken(token) {
    const tokenResp = await fetch('/backend/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ token })
    });
    if (!tokenResp.ok) return;
    const tokenData = await tokenResp.json();

    this.accessToken = tokenData.accessToken;
    this.accessTokenTimestamp = Date.now();
  }

  async fetchSessions() {
    if (!this.accessToken || !this.accessTokenTimestamp || (Date.now() - this.accessTokenTimestamp > ACCESS_TOKEN_EXPIRY_MS)) {
      await this.refreshAccessToken(localStorage.getItem('token'));
    }
    if (!this.accessToken) return;
    const resp = await fetch('/backend/sessions', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': '*/*'
      },
      credentials: 'include'
    });
    if (!resp.ok) return;
    const data = await resp.json();
    this.sessions = [];
    data.forEach(game => {
      const storytellers = game.storytellers.map(st => ({
        id: st.id,
        username: st.User.username
      }));
      const players = game.players.map(p => {
        const id = p.id;
        const username = game.usersAll.find(u => u.id === id)?.username || 'Unknown';
        return { id, username };
      });
      const spectators = game.usersAll.filter(u => !players.some(p => p.id === u.id) && !storytellers.some(st => st.id === u.id)).map(u => ({ id: u.id, username: u.username }));
      
      this.sessions.push({
        name: game.name,
        phase: game.phase,
        script: this.getScriptName(game.edition),
        storytellers,
        players,
        spectators
      });
    });
    console.log(`Fetched ${this.sessions.length} sessions from backend`);
  }
}