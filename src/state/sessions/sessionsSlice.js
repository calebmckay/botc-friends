import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

async function refreshAccessToken(token) {
  console.log('Refreshing access token...', token);
  const tokenResp = await fetch('https://botc.app/backend/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ token })
  });
  if (!tokenResp.ok) return null;
  return await tokenResp.json();
}

function getScriptName(edition) {
  switch (edition.id) {
    case "tb": return "Trouble Brewing";
    case "snv": return "Sects & Violets";
    case "bmr": return "Bad Moon Rising";
    case "custom": return `Custom: ${edition.name} by ${edition.author}`;
    case "homebrew": return `Homebrew: ${edition.name} by ${edition.author}`;
    default: return "Unknown Script";
  }
}

function parseSessions(sessions) {
  if (!sessions || !Array.isArray(sessions)) {
    return [];
  }
  const output = [];
  sessions.forEach(game => {
    const storytellers = game.storytellers.map(st => ({
      id: parseInt(st.id),
      username: st.User.username
    }));
    const players = game.players.map(p => {
      const id = parseInt(p.id);
      const username = game.usersAll.find(u => u.id === id)?.username || 'Unknown';
      return { id, username };
    });
    const spectators = game.usersAll.filter(u => !players.some(p => p.id === parseInt(u.id)) && !storytellers.some(st => st.id === parseInt(u.id))).map(u => ({ id: parseInt(u.id), username: u.username }));
    
    output.push({
      name: game.name,
      phase: game.phase,
      script: getScriptName(game.edition),
      isRunning: game.isRunning,
      storytellers,
      players,
      spectators
    });
  });
  return output;
}

export const fetchSessions = createAsyncThunk(
  'sessions/fetchSessions',
  async (_, { getState, dispatch }) => {
    let accessToken = getState().sessions?.accessToken;
    if (!accessToken || (Date.now() - accessToken.timestamp) > 15 * 60 * 1000) {
      const token = getState().data?.token;
      accessToken = await refreshAccessToken(token);
      if (accessToken && accessToken.accessToken) {
        dispatch(setAccessToken(accessToken));
      } else {
        console.error('Failed to refresh access token');
        return [];
      }
    }
    try {
      const response = await fetch('https://botc.app/backend/sessions', {
        method: 'GET',
        credentials: 'omit',
        headers: {
          "Authorization": `Bearer ${accessToken.accessToken}`,
          "Accept": "*/*"
        }
      });
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      return { accessToken, sessions: parseSessions(data) };
    } catch (error) {
      console.error(error);
      return {};
    }
  }
);

const sessionsSlice = createSlice({
  name: "sessions",
  initialState: {
    accessToken: null,
    sessions: []
  },
  reducers: {
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
    },
    clearAccessToken: (state) => {
      state.accessToken = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSessions.fulfilled, (state, action) => {
        return { ...state, ...action.payload };
      });
  }
});

export default sessionsSlice.reducer;
export const { setAccessToken, clearAccessToken } = sessionsSlice.actions;
