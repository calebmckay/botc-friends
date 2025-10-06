// Inject botc-friends.css styles directly into the page
(function injectCSS() {
  const style = document.createElement('style');
  style.id = 'botc-friends-style';
  style.textContent = `
.botc-friend { background: #55ad51ff !important; border-radius: 4px; }
.botc-block { background: #943131ff !important; border-radius: 4px; }
.botc-row-block { background: #6e1010ff !important; }
.botc-row-friend { background: #2e7d32ff !important; }
.botc-row-block.botc-row-friend { background: #6e1010ff !important; } /* block wins */
`;
  document.head.appendChild(style);
})();

// Utility: Get friends/block lists from chrome.storage.local (async)
function getLists() {
  // Helper to extract user IDs from 'username (userID)'
  function extractIds(arr) {
    return (arr || []).map(item => {
      const match = item && item.match && item.match(/\((\d+)\)$/);
      return match ? match[1] : null;
    }).filter(Boolean);
  }
  return new Promise(resolve => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['friends', 'block'], data => {
        let friends = extractIds(data.friends);
        let block = extractIds(data.block);
        resolve({ friends, block });
      });
    } else {
      // fallback to localStorage
      let friends = [];
      let block = [];
      try {
        friends = extractIds(JSON.parse(localStorage.getItem('friends')));
        block = extractIds(JSON.parse(localStorage.getItem('block')));
      } catch (e) {}
      resolve({ friends, block });
    }
  });
}

// Utility: Map userId to username from usersAll
function mapUserIds(usersAll) {
  const map = {};
  usersAll.forEach(u => {
    if (u.id && u.username) map[u.id] = u.username;
  });
  return map;
}

// Highlight usernames in the DOM
function highlightUsers(sessionData, userMap, friends, block) {
  // Merge logic: for each summary/details row pair, consider both storytellers and players
  const allRows = document.querySelectorAll('tr.summary');
  allRows.forEach(summaryRow => {
    const detailsRow = summaryRow.nextElementSibling;
    if (!detailsRow || !detailsRow.classList.contains('details')) return;

    // Remove previous highlights
    summaryRow.classList.remove('botc-row-block', 'botc-row-friend');
    detailsRow.classList.remove('botc-row-block', 'botc-row-friend');

    // Storyteller highlight logic
    const stCell = summaryRow.querySelector('td.storyteller');
    let stBlocked = false;
    let stFriend = false;
    if (stCell) {
      stCell.querySelectorAll('span').forEach(span => {
        const username = span.textContent.trim();
        const userId = Object.keys(userMap).find(id => userMap[id] === username);
        span.classList.remove('botc-friend', 'botc-block');
        if (userId) {
          if (block.includes(userId)) {
            span.classList.add('botc-block');
            stBlocked = true;
          } else if (friends.includes(userId)) {
            span.classList.add('botc-friend');
            stFriend = true;
          }
        }
      });
    }

    // Player highlight logic
    let hasBlocked = false;
    let hasFriend = false;
    detailsRow.querySelectorAll('.players .player').forEach(span => {
      const username = span.textContent.replace(/, *$/, '').trim();
      const userId = Object.keys(userMap).find(id => userMap[id] === username);
      span.classList.remove('botc-friend', 'botc-block');
      if (userId) {
        if (block.includes(userId)) {
          span.classList.add('botc-block');
          hasBlocked = true;
        } else if (friends.includes(userId)) {
          span.classList.add('botc-friend');
          hasFriend = true;
        }
      }
    });

    // Final row highlight: block wins over friend, and either storyteller or player can trigger
    if (stBlocked || hasBlocked) {
      summaryRow.classList.add('botc-row-block');
      detailsRow.classList.add('botc-row-block');
    } else if (stFriend || hasFriend) {
      summaryRow.classList.add('botc-row-friend');
      detailsRow.classList.add('botc-row-friend');
    }
  });
}

// Fetch sessions and update highlights
async function fetchAndHighlight() {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    // Try to get cached accessToken and timestamp
    let accessToken = localStorage.getItem('accessToken');
    let accessTokenTimestamp = parseInt(localStorage.getItem('accessTokenTimestamp'), 10);
    const now = Date.now();
    // Assume token expires in 10 minutes (600000 ms)
    const TOKEN_EXPIRY_MS = 10 * 60 * 1000;
    let needNewToken = !accessToken || !accessTokenTimestamp || (now - accessTokenTimestamp > TOKEN_EXPIRY_MS);
    if (needNewToken) {
      // Step 1: POST to /backend/token to get accessToken
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
      if (!accessToken) return;
      // Store accessToken and timestamp
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('accessTokenTimestamp', now.toString());
    }

    // Step 2: Use accessToken to GET /backend/sessions
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
    let userMap = {};
    data.forEach(game => {
      if (game.usersAll) {
        Object.assign(userMap, mapUserIds(game.usersAll));
      }
      if (game.storytellers) {
        game.storytellers.forEach(st => {
          if (st.id && st.username) userMap[st.id] = st.username;
        });
      }
    });
  const { friends, block } = await getLists();
  highlightUsers(data, userMap, friends, block);
  } catch (e) {}
}

// Debounce utility
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Debounced fetch for DOM triggers
const debouncedFetch = debounce(fetchAndHighlight, 1000);

// Initial run
fetchAndHighlight();
// Periodic update
setInterval(fetchAndHighlight, 15000);

// Watch for DOM changes
const observer = new MutationObserver(() => {
  debouncedFetch();
});
observer.observe(document.body, { childList: true, subtree: true });
