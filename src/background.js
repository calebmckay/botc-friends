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
      r: 46,
      g: 125,
      b: 50,
      a: 1
    },
    users: []
  },
  {
    name: "Block",
    color: {
      r: 189,
      g: 40,
      b: 40,
      a: 1
    },
    users: []
  },
]

const initStorageData = {
  _meta: {
    version: 1
  },
  timestamp: 0,
  preferences: {},
  token: null,
  lists: demoLists
}

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

function migrateStoredData(oldData) {
  let newData = oldData;
  if (Array.isArray(oldData)) {
    // Old, pre-versioned data format
    newData = {
      ...initStorageData,
      lists: oldData,
      timestamp: Date.now()
    };
  }

  return newData;
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

const getTextNode = (element) => {
  return Array.from(element.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
}


const handleListSelectorChange = (e) => {
  const selectElement = e.currentTarget;
  const userIdLi = selectElement.parentElement;
  const userId = parseInt(getTextNode(userIdLi).textContent.trim());
  const username = userIdLi.closest('div.user').querySelector('div.nameplate > div.name').textContent.trim();

  const defaultOption = selectElement.querySelector('option[value=""]');
  const selectedOption = selectElement.value;
  const user = { id: userId, name: username };

  if (selectedOption === "") {
    // Remove from all lists
    lists.forEach(list => {
      list.users = list.users.filter(u => u.id !== userId);
    });
    defaultOption.textContent = "Add to list...";
  } else {
    lists.forEach((list, index) => {
      const selectedIndex = parseInt(selectedOption);
      const userInList = list.users.find(u => u.id === userId);
      if (index === selectedIndex && !userInList) {
        lists[index].users.push(user);
      } else if (index !== selectedIndex && userInList) {
        lists[index].users = list.users.filter(u => u.id !== userId);
      }
    });
    defaultOption.textContent = "(remove from list)";
  }
  // Update storage and mappings
  localStorage.setItem('botc-friends', JSON.stringify(lists));
  updateLists();
  highlightAllLobbies();
}

function waitForElementToHaveContent(element, timeout = 5000) {
  return new Promise((resolve, reject) => {
    // If the element already has content, resolve immediately
    if (element && element.textContent.trim() !== '') {
      resolve(element);
      return;
    }

    // Set up a timeout to reject the promise if it takes too long
    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error('Timeout waiting for element to have content'));
    }, timeout);

    const observer = new MutationObserver((mutationList, observer) => {
      mutationList.forEach(mutation => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          if (element && element.textContent.trim() !== '') {
            observer.disconnect();
            clearTimeout(timer);
            resolve(element);
          }
        }
      });
    });
    observer.observe(element, { childList: true, characterData: true });
  });
}


const insertAddToListSelector = (element) => {
  const userId = parseInt(getTextNode(element).textContent.trim());
  const icon = document.createElement('img');
  icon.src = chrome.runtime.getURL("assets/icons/botc-friends-48.png");
  icon.style.height = "28px";
  icon.style.paddingLeft = "20px";

  const selectLabel = document.createElement('label');
  selectLabel.appendChild(icon);

  const selectElement = document.createElement('select');
  const defaultOption = document.createElement('option');
  defaultOption.value = "";
  defaultOption.textContent = "Add to list...";
  selectElement.appendChild(defaultOption);

  lists.forEach((list, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = list.name;
    selectElement.appendChild(option);
  });

  if (Object.prototype.hasOwnProperty.call(userIdMap, userId)) {
    selectElement.value = userIdMap[userId];
    defaultOption.textContent = "(remove from list)";
  } else {
    selectElement.value = "";
  }
  selectElement.onchange = handleListSelectorChange;

  element.appendChild(selectLabel);
  element.appendChild(selectElement);
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
  mutationList.forEach(mutation => {
    if (mutation.type === 'childList') {
      Array.from(mutation.addedNodes).filter(node => node.nodeType === Node.ELEMENT_NODE).forEach(node => {
        if (node.matches('div.user')) {
          const userIdLi = node.querySelector('ul.profile > li');
          const userIdText = getTextNode(userIdLi);
          if (!userIdText) return;
          waitForElementToHaveContent(userIdText).then(() => {
            insertAddToListSelector(userIdLi);
          });
        }
      });
      Array.from(mutation.removedNodes).filter(node => node.nodeType === Node.ELEMENT_NODE).forEach(node => {
        if (node.matches('div.loader')) {
          // The page just fetched the session list, so we should fetch it as well
          fetchSessions();
        }
      });
    }
  });
}

function grimoireObserverCallback(mutationList, observer) {
  mutationList.forEach(mutation => {
    if (mutation.type === 'childList') {
      Array.from(mutation.addedNodes).filter(node => node.nodeType === Node.ELEMENT_NODE).forEach(node => {
        if (node.matches('div.user')) {
          const userIdLi = node.querySelector('ul.profile > li');
          const userIdText = getTextNode(userIdLi);
          if (!userIdText) return;
          waitForElementToHaveContent(userIdText).then(() => {
            insertAddToListSelector(userIdLi);
          });
        }
      });
    }
  });
}

function appObserverCallback(mutationList, observer) {
  mutationList.forEach(mutation => {
    if (mutation.type === 'childList') {
      Array.from(mutation.addedNodes).filter(node => node.nodeType === Node.ELEMENT_NODE).forEach(node => {
        if (node.id === 'grimoire') {
          createGrimoireObserver(node);
        } else if (node.id === 'lobby') {
          createLobbyObserver(node);
        }
      });
      Array.from(mutation.removedNodes).filter(node => node.nodeType === Node.ELEMENT_NODE).forEach(node => {
        if (node.id === 'grimoire') {
          removeGrimoireObserver();
        } else if (node.id === 'lobby') {
          removeLobbyObserver();
        }
      });
    }
  });
}

function createGrimoireObserver(node) {
  if (grimoireObserver) {
    grimoireObserver.disconnect();
  }
  grimoireObserver = new MutationObserver(grimoireObserverCallback);
  grimoireObserver.observe(node, { childList: true });
}

function removeGrimoireObserver() {
  if (grimoireObserver) {
    grimoireObserver.disconnect();
    grimoireObserver = null;
  }
}

function createLobbyObserver(node) {
  if (lobbyObserver) {
    lobbyObserver.disconnect();
  }
  updateLists();
  fetchSessions().then(() => highlightAllLobbies());
  lobbyObserver = new MutationObserver(lobbyObserverCallback);
  lobbyObserver.observe(node, { childList: true });
  lobbyObserver.observe(node.querySelector("section.list"), { childList: true });

  document.getElementById("lobby").addEventListener('click', () => {
    highlightAllLobbies();
  });
}

function removeLobbyObserver() {
  if (lobbyObserver) {
    lobbyObserver.disconnect();
    lobbyObserver = null;
  }
}

function initialize() {
  updateLists();
  chrome.runtime.onMessage.addListener(messageListener);

  appObserver = new MutationObserver(appObserverCallback).observe(document.getElementById("app"), { childList: true });
  if (document.URL.includes("/play")) {
    createGrimoireObserver(document.getElementById("grimoire"));
  } else {
    createLobbyObserver(document.getElementById("lobby"));
  }

  console.log("BotC Friends background script loaded");
}

document.onreadystatechange = () => {
  if (document.readyState === "complete") {
    initialize();
  }
};
