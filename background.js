// Inject friends/block lists from extension storage into page context
(function() {
  // Use browser.runtime.sendMessage to request lists from the extension
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'BOTC_SET_LISTS') {
      window.BOTC_FRIENDS = event.data.friends || [];
      window.BOTC_BLOCK = event.data.block || [];
    }
  });

  // Request lists from content script
  window.postMessage({ type: 'BOTC_GET_LISTS' }, '*');
})();

// Utility: Get friends/block lists from browser.storage.local
function getLists() {
  // Use lists injected into window
  const parseIds = arr => (arr || []).map(item => {
    const match = item.match(/\((\d+)\)$/);
    return match ? match[1] : null;
  }).filter(Boolean);
  return Promise.resolve({
    friends: parseIds(window.BOTC_FRIENDS),
    block: parseIds(window.BOTC_BLOCK)
  });
}

// Utility: Map userId to username from usersAll
function mapUserIds(usersAll) {
  const map = {};
  usersAll.forEach(u => {
    if (u.id) map[u.id] = u.username;
  });
  return map;
}

// Store user mapping globally for use in MutationObserver
window.BOTC_USER_MAP = {};

async function tagPlayersFromSession(sessionData) {
  const { friends, block } = await getLists();
  sessionData.forEach(game => {
    console.log('Tagging players for game:', game.name);
    if (!game.usersAll || !game.players) return;
    // Update global user map
    game.usersAll.forEach(u => {
      if (u.id && u.username) window.BOTC_USER_MAP[u.id] = u.username;
    });

    // Tag players in the DOM
    const summaryRows = Array.from(document.querySelectorAll('tr.summary'));
    const gameRow = summaryRows.find(row => {
      const btn = row.querySelector('.button.primary');
      return btn && btn.textContent.trim() === game.name;
    });
    if (!gameRow) return;
    const detailsRow = gameRow.nextElementSibling;
    if (!detailsRow) return;
    const playerSpans = detailsRow.querySelectorAll('.players .player');
    playerSpans.forEach(span => {
      const username = span.textContent.replace(/, *$/, '').trim();
      const userId = Object.keys(window.BOTC_USER_MAP).find(id => window.BOTC_USER_MAP[id] === username);
      if (!userId) return;
      if (friends.includes(userId)) span.classList.add('botc-friend');
      if (block.includes(userId)) span.classList.add('botc-block');
    });
  });
}

// Patch fetch to /sessions
(function() {
  const origFetch = window.fetch;
  window.fetch = async function(url, opts) {
    const resp = await origFetch.apply(this, arguments);
    if (url.includes('sessions')) {
      try {
        const data = await resp.clone().json();
        window.BOTC_SESSION_DATA = data; // Save for later use
        tagPlayersFromSession(data);
        setTimeout(tagVisiblePlayers, 1000);
      } catch (e) {}
    }
    return resp;
  };
})();

// Tag visible players using the latest user map
async function tagVisiblePlayers() {
  const { friends, block } = await getLists();
  const detailsRows = document.querySelectorAll('tr.details');
  detailsRows.forEach(detailsRow => {
    let hasBlocked = false;
    let hasFriend = false;
    const playerSpans = detailsRow.querySelectorAll('.players .player');
    // Highlight players
    playerSpans.forEach(span => {
      const username = span.textContent.replace(/, *$/, '').trim();
      const userId = Object.keys(window.BOTC_USER_MAP).find(id => window.BOTC_USER_MAP[id] === username);
      if (!userId) return;
      if (friends.includes(userId)) {
        span.classList.add('botc-friend');
        hasFriend = true;
      }
      if (block.includes(userId)) {
        span.classList.add('botc-block');
        hasBlocked = true;
      }
    });

    // Find the summary row and game name
    const summaryRow = detailsRow.previousElementSibling;
    let gameName = null;
    if (summaryRow && summaryRow.classList.contains('summary')) {
      const btn = summaryRow.querySelector('.button.primary');
      if (btn) gameName = btn.textContent.trim();
    }

    // Find the session data for this game
    let sessionData = null;
    if (window.BOTC_SESSION_DATA && gameName) {
      sessionData = window.BOTC_SESSION_DATA.find(game => game.name === gameName);
    }

    // Highlight storytellers in td.storyteller (in summary row)
    let stBlocked = false;
    let stFriend = false;
    if (sessionData && sessionData.storytellers) {
      sessionData.storytellers.forEach(st => {
        const stId = st.id || (st.User && st.User.id);
        if (block.includes(stId)) stBlocked = true;
        if (friends.includes(stId)) stFriend = true;
      });
    }
    if (summaryRow) {
      const storytellerCell = summaryRow.querySelector('td.storyteller span');
      if (storytellerCell) {
        storytellerCell.classList.remove('botc-friend', 'botc-block');
        if (stBlocked) {
          storytellerCell.classList.add('botc-block');
        } else if (stFriend) {
          storytellerCell.classList.add('botc-friend');
        }
      }
    }

    // Block priority: if blocked, remove friend highlight and apply block
    if (hasBlocked || stBlocked) {
      detailsRow.classList.add('botc-row-block');
      detailsRow.classList.remove('botc-row-friend');
      if (summaryRow && summaryRow.classList.contains('summary')) {
        summaryRow.classList.add('botc-row-block');
        summaryRow.classList.remove('botc-row-friend');
      }
    } else if (hasFriend || stFriend) {
      detailsRow.classList.add('botc-row-friend');
      detailsRow.classList.remove('botc-row-block');
      if (summaryRow && summaryRow.classList.contains('summary')) {
        summaryRow.classList.add('botc-row-friend');
        summaryRow.classList.remove('botc-row-block');
      }
    } else {
      detailsRow.classList.remove('botc-row-block', 'botc-row-friend');
      if (summaryRow && summaryRow.classList.contains('summary')) {
        summaryRow.classList.remove('botc-row-block', 'botc-row-friend');
      }
    }
  });
}

// MutationObserver to re-tag players when DOM changes
const observer = new MutationObserver(() => {
  tagVisiblePlayers();
});
observer.observe(document.body, { childList: true, subtree: true });

// Also run once after DOMContentLoaded
document.addEventListener('DOMContentLoaded', tagVisiblePlayers);

// Inject custom CSS for botc-friend, botc-block, and row highlights
(function() {
  const style = document.createElement('style');
  style.textContent = `
    .botc-friend { background: #55ad51ff !important; border-radius: 4px; }
    .botc-block { background: #943131ff !important; border-radius: 4px; }
    .botc-row-block { background: #6e1010ff !important; }
    .botc-row-friend { background: #2e7d32ff !important; }
    .botc-row-block.botc-row-friend { background: #6e1010ff !important; } /* block wins */
  `;
  document.head.appendChild(style);
})();