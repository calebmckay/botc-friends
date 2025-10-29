let accessToken = null;
let accessTokenTimestamp = null;
const ACCESS_TOKEN_EXPIRY_MS = 10 * 60 * 1000;

const UNSET_PRECEDENCE = 99999999;

let lists = [];
let userIdMap = {};
let sessions = [];

let appObserver = null;
let lobbyObserver = null;
let grimoireObserver = null;

const demoLists = [
  {
    name: "Friends",
    color: {
      r: '46',
      g: '125',
      b: '50',
      a: '1'
    },
    users: []
  },
  {
    name: "Block",
    color: {
      r: '189',
      g: '40',
      b: '40',
      a: '1'
    },
    users: []
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
  const storageData = localStorage.getItem('botc-friends');
  if (!storageData) {
    console.error("No stored lists found");
    localStorage.setItem('botc-friends', JSON.stringify(demoLists));
    return;
  }
  try {
    lists = JSON.parse(storageData);
  } catch (e) {
    console.error("Failed to parse stored lists:", e);
    return;
  }


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
    } else {
      span.classList.remove(...Array.from(span.classList).filter(c => c.startsWith('botc-friends-')));
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
    } else {
      span.classList.remove(...Array.from(span.classList).filter(c => c.startsWith('botc-friends-')));
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
    } else {
      span.classList.remove(...Array.from(span.classList).filter(c => c.startsWith('botc-friends-')));
    }
  });
  return highestPrecedence;
}

function highlightLobby(lobbyId) {
  const session = sessions.find(s => s.name === lobbyId);
  const summaryRow = Array.from(document.querySelectorAll('table.list div.button.primary'))
    .find(div => div.textContent.trim() === lobbyId)?.closest('tr');
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

function waitForElement(selector, callback) {
  const interval = setInterval(() => {
    const element = document.querySelector(selector);
    if (element) {
      clearInterval(interval);
      callback(element);
    }
  }, 100); // Check every 100ms
}

function messageListener(message, sender, sendResponse) {
  console.log("Background received message:", message);
  switch (message.type) {
    case 'getLists':
      sendResponse({ success: true, lists });
      break;
    case 'saveLists':
      localStorage.setItem('botc-friends', JSON.stringify(message.lists));
      updateLists();
      sendResponse({ success: true });
      break;
    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
}

function lobbyObserverCallback(mutationList, observer) {
  // mutationList.forEach(mutation => {
  //   console.log("Lobby:",mutation);
  // });
}

function grimoireObserverCallback(mutationList, observer) {
  // mutationList.forEach(mutation => {
  //   console.log("Grimoire:",mutation);
  // });
}

function appObserverCallback(mutationList, observer) {
  mutationList.forEach(mutation => {
    if (mutation.type === 'childList') {

      Array.from(mutation.addedNodes).filter(node => node.nodeType === Node.ELEMENT_NODE).forEach(node => {
        if (node.id === 'grimoire') {
          // Grimoire page loaded
          if (grimoireObserver) {
            grimoireObserver.disconnect();
          }
          grimoireObserver = new MutationObserver(grimoireObserverCallback).observe(node, { childList: true });
        } else if (node.id === 'lobby') {
          // Lobby page loaded
          if (lobbyObserver) {
            lobbyObserver.disconnect();
          }
          updateLists();
          fetchSessions().then(() => highlightAllLobbies());
          lobbyObserver = new MutationObserver(lobbyObserverCallback).observe(node.querySelector("section.list"), { childList: true });
        }
      });
      Array.from(mutation.removedNodes).filter(node => node.nodeType === Node.ELEMENT_NODE).forEach(node => {
        if (node.id === 'grimoire') {
          // Grimoire page removed
          if (grimoireObserver) {
            grimoireObserver.disconnect();
            grimoireObserver = null;
          }
        } else if (node.id === 'lobby') {
          // Lobby page removed
          if (lobbyObserver) {
            lobbyObserver.disconnect();
            lobbyObserver = null;
          }
        } else if (node.matches('div.loader')) {
          // The page just fetched the session list, so we should fetch it as well
          fetchSessions();
        }
      });
    }
  });
}

function initialize() {
  appObserver = new MutationObserver(appObserverCallback).observe(document.getElementById("app"), { childList: true });
  waitForElement("table.list > tbody", () => {
    updateLists();
    fetchSessions().then(() => highlightAllLobbies());

    document.querySelector("div#lobby").addEventListener('click', () => {
      highlightAllLobbies();
    });

    lobbyObserver = new MutationObserver(lobbyObserverCallback).observe(document.querySelector("section.list"), { childList: true });
  });
  chrome.runtime.onMessage.addListener(messageListener);
  console.log("BotC Friends background script loaded");
}

document.onreadystatechange = () => {
  if (document.readyState === "complete") {
    initialize();
  }
};
