import { LobbyObserver } from './observers/LobbyObserver.js';
import { GrimoireObserver } from './observers/GrimoireObserver.js';
import { AppObserver } from './observers/AppObserver.js';
import { Lobby } from './observers/Lobby.js';
import { DataManager } from './services/DataManager.js';
import { SessionManager } from './services/SessionManager.js';

let appObserverInstance = null;


// Helper to persist highlight class on a row
// function persistHighlightClass(row, className, shouldHighlight) {
//   if (row._botcFriendsObserver) {
//     row._botcFriendsObserver.disconnect();
//     row._botcFriendsObserver = null;
//   }

//   if (!shouldHighlight) {
//     row.classList.remove(...Array.from(row.classList).filter(c => c.startsWith('botc-friends-row-')));
//     return;
//   }

//   const observer = new MutationObserver(() => {
//     if (!row.classList.contains(className)) {
//       row.classList.add(className);
//     }
//   });

//   observer.observe(row, { attributes: true, attributeFilter: ["class"] });
//   row._botcFriendsObserver = observer;
// }

// function highlightLobby(lobbyId) {
//   const session = sessions.find(s => s.name === lobbyId);
//   const summaryRow = Array.from(document.querySelectorAll('table.list div.button.primary'))
//     .find(div => div.textContent.trim() === lobbyId)?.closest('tr');
//   if (!session || !summaryRow) return;
//   const detailsRow = summaryRow.nextElementSibling;
//   if (!detailsRow || !detailsRow.classList.contains('details')) return;

//   // Remove previous highlights
//   document.querySelectorAll('tr').forEach(tr => {
//     tr.classList.remove(...Array.from(tr.classList).filter(c => c.startsWith('botc-friends-row-')));
//   });

//   const p1 = highlightStorytellers(summaryRow, session.storytellers);
//   const p2 = highlightPlayers(detailsRow, session.players);
//   const p3 = highlightSpectators(detailsRow, session.spectators);

//   const highestPrecedence = Math.min(p1, p2, p3);
//     // Remove highlight if not needed
//   const shouldHighlight = highestPrecedence !== UNSET_PRECEDENCE;
//   const className = `botc-friends-row-${highestPrecedence}`;
//   persistHighlightClass(summaryRow, className, shouldHighlight);
//   persistHighlightClass(detailsRow, className, shouldHighlight);
// }

// function highlightAllLobbies() {
//   document.querySelectorAll('table.list > tbody > tr.summary').forEach(row => {
//     const lobbyId = row.querySelector('div.button.primary').textContent.trim();
//     highlightLobby(lobbyId);
//   });
// }

// const getTextNode = (element) => {
//   return Array.from(element.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
// }


// const handleListSelectorChange = (e) => {
//   const selectElement = e.currentTarget;
//   const userIdLi = selectElement.parentElement;
//   const userId = parseInt(getTextNode(userIdLi).textContent.trim());
//   const username = userIdLi.closest('div.user').querySelector('div.nameplate > div.name').textContent.trim();

//   const defaultOption = selectElement.querySelector('option[value=""]');
//   const selectedOption = selectElement.value;
//   const user = { id: userId, name: username };

//   if (selectedOption === "") {
//     // Remove from all lists
//     storedData.lists.forEach(list => {
//       list.users = list.users.filter(u => u.id !== userId);
//     });
//     defaultOption.textContent = "Add to list...";
//   } else {
//     storedData.lists.forEach((list, index) => {
//       const selectedIndex = parseInt(selectedOption);
//       const userInList = list.users.find(u => u.id === userId);
//       if (index === selectedIndex && !userInList) {
//         storedData.lists[index].users.push(user);
//       } else if (index !== selectedIndex && userInList) {
//         storedData.lists[index].users = list.users.filter(u => u.id !== userId);
//       }
//     });
//     defaultOption.textContent = "(remove from list)";
//   }
//   // Update storage and mappings
//   storedData.timestamp = Date.now();
//   localStorage.setItem('botc-friends', JSON.stringify(storedData));
//   DataManager.getInstance().updateLists();
//   highlightAllLobbies();
// }

function _waitForElementToHaveContent(element, timeout = 5000) {
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

// const insertAddToListSelector = (element) => {
//   const userId = parseInt(getTextNode(element).textContent.trim());
//   const icon = document.createElement('img');
//   icon.src = chrome.runtime.getURL("assets/icons/botc-friends-48.png");
//   icon.style.height = "28px";
//   icon.style.paddingLeft = "20px";

//   const selectLabel = document.createElement('label');
//   selectLabel.appendChild(icon);

//   const selectElement = document.createElement('select');
//   const defaultOption = document.createElement('option');
//   defaultOption.value = "";
//   defaultOption.textContent = "Add to list...";
//   selectElement.appendChild(defaultOption);

//   storedData.lists.forEach((list, index) => {
//     const option = document.createElement('option');
//     option.value = index;
//     option.textContent = list.name;
//     selectElement.appendChild(option);
//   });

//   if (Object.prototype.hasOwnProperty.call(userIdMap, userId)) {
//     selectElement.value = userIdMap[userId];
//     defaultOption.textContent = "(remove from list)";
//   } else {
//     selectElement.value = "";
//   }
//   selectElement.onchange = handleListSelectorChange;

//   element.appendChild(selectLabel);
//   element.appendChild(selectElement);
// }

function messageListener(message, sender, sendResponse) {
  switch (message.type) {
    case 'syncStorage':
      sendResponse({ success: true, data: JSON.parse(localStorage.getItem("botc-friends")) });
      DataManager.getInstance().syncStoredData(DataManager.migrateStoredData(message.data));
      // if (lobbyObserverInstance) {
      //   lobbyObserverInstance.highlightAllLobbies();
      // }
      break;
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
}

function initialize() {
  DataManager.getInstance().updateLists();
  chrome.runtime.onMessage.addListener(messageListener);

  appObserverInstance = new AppObserver();
  appObserverInstance.observe(document.getElementById("app"));

  if (document.URL.includes("/play")) {
    appObserverInstance.createGrimoireObserver(document.getElementById("grimoire"));
  } else {
    appObserverInstance.createLobbyObserver(document.getElementById("lobby"));
  }

}

let initialized = false;

const mainElement = document.getElementById("main");
if (!mainElement) {
  console.error("[BotC Friends] #main element not found!");
} else {
  new MutationObserver((mutationList, observer) => {
    mutationList.forEach((mutation, idx) => {
      Array.from(mutation.addedNodes)
        .filter((node) => node.nodeType === Node.ELEMENT_NODE)
        .forEach((node) => {
          if ((node.id === "lobby" || node.id === "grimoire") && !initialized) {
            observer.disconnect();
            initialized = true;
            initialize();
          }
        });
    });
  }).observe(mainElement, { childList: true, subtree: true });
}
