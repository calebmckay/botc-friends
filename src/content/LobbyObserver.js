import { Lobby } from './Lobby.js';

export class LobbyObserver {
  constructor({ updateLists, fetchSessions, highlightAllLobbies, insertAddToListSelector, getTextNode }) {
    this.lobbies = new Map();
    this.updateLists = updateLists;
    this.fetchSessions = fetchSessions;
    this.highlightAllLobbies = highlightAllLobbies;
    this.insertAddToListSelector = insertAddToListSelector;
    this.getTextNode = getTextNode;
    this.observer = null;
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
            this.fetchSessions();
          }
        });
      }
    });
    this.updateLobbies();
    this.highlightAllLobbies();
  }

  updateLobbies() {
    this.lobbies.clear();
    document.querySelectorAll('table.list > tbody > tr.summary').forEach(row => {
      const lobbyId = row.querySelector('div.button.primary').textContent.trim();
      this.lobbies.set(lobbyId, new Lobby(row, lobbyId));
    });
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
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
