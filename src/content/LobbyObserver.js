import { Lobby } from './Lobby.js';
import { DataManager } from './DataManager.js';
import { SessionManager } from './SessionManager.js';
import { ProfileObserver } from './ProfileObserver.js';

export class LobbyObserver {
  constructor(node) {
    this.node = node;
    this.lobbies = [];
    this.profileObserver = null;

    DataManager.getInstance().updateLists();
    SessionManager.getInstance().fetchSessions().then(() => this.highlightAllLobbies());
    
    const lobbyTable = this.node.querySelector('table.list > tbody');
    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.observer.observe(lobbyTable, { childList: true });
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  refreshLobbies() {
    // Destroy existing lobby instances
    this.lobbies.forEach(lobby => lobby.disconnect());
    this.lobbies = [];


    const lobbyTable = this.node.querySelector('table.list > tbody');
    lobbyTable.querySelectorAll('tr.summary').forEach(row => {
      const lobbyId = row.querySelector('div.button.primary').textContent.trim();
      const lobby = new Lobby(this, lobbyId, row, row.nextElementSibling)
      this.lobbies.push(lobby);
      lobby.refreshHighlighting();
    });
  }

  handleMutations(mutationList) {
    let shouldRefresh = false
    mutationList.forEach(mutation => {
      if (mutation.type === 'childList') {
        Array.from(mutation.addedNodes).filter(node => node.nodeType === Node.ELEMENT_NODE).forEach(node => {
          if (node.matches('div.user')) {
            this.profileObserver = new ProfileObserver();
            const userIdLi = node.querySelector('ul.profile > li');
            const userIdText = this.getTextNode(userIdLi);
            if (!userIdText) return;
            this.waitForElementToHaveContent(userIdText).then(() => {
              this.insertAddToListSelector(userIdLi);
            });
          }
        });
        if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
          shouldRefresh = true;
        }
      }
    })

    if (shouldRefresh) {
      this.refreshLobbies();
    }
  }

  highlightAllLobbies() {
    this.lobbies.forEach(lobby => {
      lobby.refreshHighlighting();
    });
  }

  observe(node) {
    if (this.observer) this.observer.disconnect();
    this.observer = new MutationObserver(this.callback.bind(this));
    this.observer.observe(node, { childList: true });
    const sectionList = node.querySelector('section.list');
    if (sectionList) {
      this.observer.observe(sectionList, { childList: true });
    }
    // Also observe the tbody of the lobby table for page changes
    const tbody = node.querySelector('table.list > tbody');
    if (tbody) {
      this.observer.observe(tbody, { childList: true });
      // Observe class changes on summary/details rows to reapply highlight if needed
      tbody.querySelectorAll('tr.summary, tr.details').forEach(tr => {
        new MutationObserver(() => {
          // Reapply highlights if class list changes (e.g., expand/collapse)
          this.highlightAllLobbies();
        }).observe(tr, { attributes: true, attributeFilter: ['class'] });
      });
    }
  }

  callback(mutationList) {
    mutationList.forEach(mutation => {
      if (mutation.type === 'childList') {
        Array.from(mutation.addedNodes).filter(node => node.nodeType === Node.ELEMENT_NODE).forEach(node => {
          if (node.matches('div.user')) {
            const userIdLi = node.querySelector('ul.profile > li');
            const userIdText = this.getTextNode(userIdLi);
            if (!userIdText) return;
            this.waitForElementToHaveContent(userIdText).then(() => {
              this.insertAddToListSelector(userIdLi);
            });
          }
        });
        Array.from(mutation.removedNodes).filter(node => node.nodeType === Node.ELEMENT_NODE).forEach(node => {
          if (node.matches('div.loader')) {
            SessionManager.getInstance().fetchSessions();
          }
        });
      }
    });
    this.refreshLobbies();
    this.highlightAllLobbies();
  }

  waitForElementToHaveContent(element, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (element && element.textContent.trim() !== '') {
        resolve(element);
        return;
      }
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
}
