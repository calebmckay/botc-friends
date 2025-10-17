let accessToken = null;
let accessTokenTimestamp = null;
const ACCESS_TOKEN_EXPIRY_MS = 10 * 60 * 1000;

const UNSET_PRECEDENCE = 99999999;

let lists = [];
let userIdMap = {};
let sessions = [];

const demoLists = [
  {
    name: "Friends",
    color: {
      r: '46',
      g: '125',
      b: '50',
      a: '1'
    },
    users: [
      {
        id: 8274423742618,
        name: "spellbee"
      },
      {
        id: 8330200514714,
        name: "Bones" 
      },
      {
        id: 8277248671898,
        name: "Satyr"
      }
    ]
  },
  {
    name: "Block",
    color: {
      r: '189',
      g: '40',
      b: '40',
      a: '1'
    },
    users: [
      {
        id: 8274374230170,
        name: "Bearface"
      },
    ]
  },
]

function injectCSS() {
  let style = document.querySelector("style#botc-friends-style");
  if (!style) {
    style = document.createElement('style');
    style.id = 'botc-friends-style';
    style = document.head.appendChild(style);
  }

  let styleText = "";
  lists.map((list, index) => {
    const color = list.color;
    // Helper to darken RGB color by a percentage
    function darkenColor(r, g, b, percent) {
      r = Math.round(r * (1 - percent));
      g = Math.round(g * (1 - percent));
      b = Math.round(b * (1 - percent));
      return `${r}, ${g}, ${b}`;
    }

    const baseColor = `${color.r}, ${color.g}, ${color.b}`;
    const darkColor = darkenColor(Number(color.r), Number(color.g), Number(color.b), 0.3);

    styleText += `
      .botc-friends-${index} { background: rgba(${baseColor}, ${color.a}) !important; border-radius: 4px; }
      .botc-friends-row-${index} { background: rgba(${darkColor}, ${color.a}) !important; }
    `;
  });
  style.textContent = styleText;
}

function updateLists() {
  // For now, use demo data
  // lists = JSON.parse(localStorage.getItem('botc-friends-lists'));
  lists = demoLists;

  // Map userId to list index for quick lookup
  userIdMap = {};
  lists.forEach((list, index) => {
    list.users.forEach(user => {
      if (!Object.prototype.hasOwnProperty.call(userIdMap, user.id)) {
        userIdMap[user.id] = index;
      }
    });
  });

  // Inject the CSS classes for the lists
  injectCSS();
}


async function refreshAccessToken(token) {
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

  accessToken = tokenData.accessToken;
  accessTokenTimestamp = Date.now();
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

async function fetchSessions() {
  if (!accessToken || !accessTokenTimestamp || (Date.now() - accessTokenTimestamp > ACCESS_TOKEN_EXPIRY_MS)) {
    await refreshAccessToken(localStorage.getItem('token'));
  }
  if (!accessToken) return;
  const resp = await fetch('/backend/sessions', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': '*/*'
    },
    credentials: 'include'
  });
  if (!resp.ok) return;
  const data = await resp.json();
  sessions = [];
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
    
    sessions.push({
      name: game.name,
      phase: game.phase,
      script: getScriptName(game.edition),
      storytellers,
      players,
      spectators
    });
  });
  console.log(`Fetched ${sessions.length} sessions from backend`);
  highlightAllLobbies();
}

function highlightStorytellers(summaryRow, storytellers) {
  let highestPrecedence = UNSET_PRECEDENCE;
  summaryRow.querySelectorAll('td.storyteller span').forEach((span, index) => {
    const userId = storytellers[index].id;
    if (Object.prototype.hasOwnProperty.call(userIdMap, userId)) {
      span.classList.add(`botc-friends-${userIdMap[userId]}`);
      highestPrecedence = Math.min(highestPrecedence, userIdMap[userId]);
    }
  });
  return highestPrecedence;
}

function highlightPlayers(detailsRow, players) {
  let highestPrecedence = UNSET_PRECEDENCE;
  detailsRow.querySelectorAll('td li.players span.player').forEach((span, index) => {
    const userId = players[index].id;
    if (Object.prototype.hasOwnProperty.call(userIdMap, userId)) {
      span.classList.add(`botc-friends-${userIdMap[userId]}`);
      highestPrecedence = Math.min(highestPrecedence, userIdMap[userId]);
    }
  });
  return highestPrecedence;
}

function highlightSpectators(detailsRow, spectators) {
  let highestPrecedence = UNSET_PRECEDENCE;
  detailsRow.querySelectorAll('td li.spectators span').forEach((span) => {
    // Spectators could be ordered differently, so we match by username
    const username = span.textContent.trim();
    const userId = spectators.find(s => s.username === username)?.id;
    if (userId && Object.prototype.hasOwnProperty.call(userIdMap, userId)) {
      span.classList.add(`botc-friends-${userIdMap[userId]}`);
      highestPrecedence = Math.min(highestPrecedence, userIdMap[userId]);
    }
  });
  return highestPrecedence;
}

function highlightLobby(lobbyId) {
  const session = sessions.find(s => s.name === lobbyId);
  const summaryRow = $(`table.list div.button.primary:contains("${lobbyId}")`).closest('tr')[0];
  if (!session || !summaryRow) return;
  const detailsRow = summaryRow.nextElementSibling;
  if (!detailsRow || !detailsRow.classList.contains('details')) return;

  // Remove previous highlights
  document.querySelectorAll('tr').forEach(tr => {
    tr.classList.remove(...Array.from(tr.classList).filter(c => c.startsWith('botc-friends-row-')));
  });

  const p1 = highlightStorytellers(summaryRow, session.storytellers);
  const p2 = highlightPlayers(detailsRow, session.players);
  const p3 = highlightSpectators(detailsRow, session.spectators);

  const highestPrecedence = Math.min(p1, p2, p3);
  if (highestPrecedence !== UNSET_PRECEDENCE) {
    // Use a timeout to ensure the class is applied after any existing class changes
    setTimeout(() => {
      summaryRow.classList.add(`botc-friends-row-${highestPrecedence}`);
      detailsRow.classList.add(`botc-friends-row-${highestPrecedence}`);
    }, 1);
  }
}

function highlightAllLobbies() {
  document.querySelectorAll('table.list > tbody > tr.summary').forEach(row => {
    const lobbyId = row.querySelector('div.button.primary').textContent.trim();
    highlightLobby(lobbyId);
  });
}

// const observer = new MutationObserver((mutationList) => {
//   for (const mutation of mutationList) {
//     if (mutation.type === 'childList' || mutation.type === 'attributes') {
//       let lobbyId = null
//       if (mutation.target.classList.contains('summary')) {
//         lobbyId = mutation.target.querySelector("div.button.primary").textContent.trim();
//       } else if (mutation.target.classList.contains('details')) {
//         lobbyId = mutation.target.previousElementSibling.querySelector("div.button.primary").textContent.trim();
//       }
//       if (lobbyId) {
//         console.log(`Highlighting lobby ${lobbyId}`);
//         highlightLobby(lobbyId);
//       }
//     }
//   }
// });

const updateObserver = new MutationObserver((mutationList) => {
  mutationList.forEach(mutation => {
    if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
      mutation.removedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && node.matches('div.loader')) {
          // The page just fetched the session list, so we should fetch it as well
          fetchSessions();
        }
      });
    }
  });
});

function waitForElement(selector, callback) {
  const interval = setInterval(() => {
    const element = document.querySelector(selector);
    if (element) {
      clearInterval(interval);
      callback(element);
    }
  }, 100); // Check every 100ms
}

$(document).ready(() => {
  waitForElement("table.list > tbody", () => {
    updateLists();
    fetchSessions().then(() => highlightAllLobbies());

    document.querySelector("div#lobby").addEventListener('click', () => {
      highlightAllLobbies();
    });
    updateObserver.observe(document.querySelector("section.list"), { childList: true });
  });
});
