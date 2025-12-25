import { SessionManager } from "../services/SessionManager.js";
import { DataManager } from "../services/DataManager.js";

const UNSET_PRECEDENCE = 99999999;

export class Lobby {
  constructor(parent, lobbyId, summaryRow, detailsRow) {
    this.parent = parent;
    this.summaryRow = summaryRow;
    this.detailsRow = detailsRow;
    this.lobbyId = lobbyId;

    this.session = null;

    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.observer.observe(this.summaryRow, { attributes: true, attributeFilter: ["class"] });
    this.observer.observe(this.detailsRow, { attributes: true, attributeFilter: ["class"] });
    this.summaryRow.querySelectorAll('td.storyteller').forEach((span) => {
      console.log(span);
      this.observer.observe(span, { childList: true });
    });
    this.summaryRow.querySelectorAll('td.storyteller span').forEach((span) => {
      this.observer.observe(span, { characterData: true });
      console.log(span);
    });
    this.detailsRow.querySelectorAll('td li.players').forEach((span) => {
      this.observer.observe(span, { childList: true });
      console.log(span);
    });
    this.detailsRow.querySelectorAll('td li.players span.player').forEach((span) => {
      this.observer.observe(span, { characterData: true });
      console.log(span);
    });
    this.detailsRow.querySelectorAll('td li.spectators').forEach((span) => {
      this.observer.observe(span, { childList: true });
      console.log(span);
    });
    this.detailsRow.querySelectorAll('td li.spectators span').forEach((span) => {
      this.observer.observe(span, { characterData: true });
      console.log(span);
    });
    // Also observe lobby ID changes
    this.observer.observe(this.summaryRow.querySelector('div.button.primary'), { characterData: true });

    this.refreshSession();
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  handleMutations(mutationList) {
    mutationList.forEach((mutation, idx) => {
      console.log(mutation);
      if (mutation.type === 'attributes' || mutation.type === 'childList') {
        this.refreshSession();
      }
      if (mutation.type === 'characterData') {
        if (mutation.target.matches('div.button.primary')) {
          const newLobbyId = mutation.target.textContent.trim();
          if (newLobbyId !== this.lobbyId) {
            this.lobbyId = newLobbyId;
            this.refreshSession();
          }
        }
        if (mutation.target.matches('td.storyteller span') || mutation.target.matches('td li.players span.player') || mutation.target.matches('td li.spectators span')) {
          this.refreshSession();
        }
      }
    });
    
  }

  refreshSession() {
    this.session = SessionManager.getInstance().getSession(this.lobbyId);
    this.refreshHighlighting();
  }

  refreshHighlighting() {
    // Get precedence for each category to determine overall lobby highlight
    const p1 = this.highlightStorytellers();
    const p2 = this.highlightPlayers();
    const p3 = this.highlightSpectators();
    const highestPrecedence = Math.min(p1, p2, p3);
    this.highlightBackground(highestPrecedence);
  }

  highlightBackground(listId) {
    const currentHighlight = Array.from(this.summaryRow.classList).find(c => c.startsWith('botc-friends-row-'));
    if (listId !== UNSET_PRECEDENCE && currentHighlight === undefined) {
      const className = `botc-friends-row-${listId}`;
      this.summaryRow.classList.add(className);
      this.detailsRow.classList.add(className);
    } else if (listId === UNSET_PRECEDENCE && currentHighlight !== undefined) {
      // Remove previous highlights
      this.summaryRow.classList.remove(...Array.from(this.summaryRow.classList).filter(c => c.startsWith('botc-friends-row-')));
      this.detailsRow.classList.remove(...Array.from(this.detailsRow.classList).filter(c => c.startsWith('botc-friends-row-')));
    }
  }

  highlightStorytellers() {
    let highestPrecedence = UNSET_PRECEDENCE;
    this.summaryRow.querySelectorAll('td.storyteller span').forEach((span, index) => {
      const userId = this.session.storytellers[index].id;
      const listId = DataManager.getInstance().getListIdForUser(userId);
      if (listId) {
        span.classList.add(`botc-friends-${listId}`);
        highestPrecedence = Math.min(highestPrecedence, listId);
      } else {
        span.classList.remove(...Array.from(span.classList).filter(c => c.startsWith('botc-friends-')));
      }
    });
    return highestPrecedence;
  }

  highlightPlayers() {
    let highestPrecedence = UNSET_PRECEDENCE;
    this.detailsRow.querySelectorAll('td li.players span.player').forEach((span, index) => {
      const userId = this.session.players[index].id;
      const listId = DataManager.getInstance().getListIdForUser(userId);
      if (listId) {
        span.classList.add(`botc-friends-${listId}`);
        highestPrecedence = Math.min(highestPrecedence, listId);
      } else {
        span.classList.remove(...Array.from(span.classList).filter(c => c.startsWith('botc-friends-')));
      }
    });
    return highestPrecedence;
  }

  highlightSpectators() {
    let highestPrecedence = UNSET_PRECEDENCE;
    this.detailsRow.querySelectorAll('td li.spectators span').forEach((span) => {
      // Spectators could be ordered differently, so we match by username
      const username = span.textContent.trim();
      const userId = this.session.spectators.find(s => s.username === username)?.id;
      if (userId) {
        const listId = DataManager.getInstance().getListIdForUser(userId);
        if (listId) {
          span.classList.add(`botc-friends-${listId}`);
          highestPrecedence = Math.min(highestPrecedence, listId);
        } else {
          span.classList.remove(...Array.from(span.classList).filter(c => c.startsWith('botc-friends-')));
        }
      } else {
        span.classList.remove(...Array.from(span.classList).filter(c => c.startsWith('botc-friends-')));
      }
    });
    return highestPrecedence;
  }
}
