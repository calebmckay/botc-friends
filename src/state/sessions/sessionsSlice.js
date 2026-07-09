import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

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
    const seats = Array.isArray(game.seats) ? game.seats : [];
    const users = Array.isArray(game.users) ? game.users : [];

    const occupiedSeats = seats.filter(s => s.id != null);
    const storytellers = occupiedSeats
      .filter(s => s.seat < 0)
      .map(s => ({ id: parseInt(s.id), username: s.username || 'Unknown' }));
    const players = occupiedSeats
      .filter(s => s.seat >= 0)
      .map(s => ({ id: parseInt(s.id), username: s.username || 'Unknown' }));

    const seatedIds = new Set(occupiedSeats.map(s => parseInt(s.id)));
    const spectators = users
      .filter(u => !seatedIds.has(parseInt(u.id)))
      .map(u => ({ id: parseInt(u.id), username: u.username }));
    
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
    if (!accessToken || (Date.now() - accessToken.timestamp) > ACCESS_TOKEN_EXPIRY_MS) {
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
