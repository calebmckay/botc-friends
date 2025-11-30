import { GrimoireObserver } from './GrimoireObserver.js';
import { LobbyObserver } from './LobbyObserver.js';
import { DataManager } from './DataManager.js';
import { SessionManager } from './SessionManager.js';

export class AppObserver {
  constructor() {
    this.lobbyObserver = null;
    this.grimoireObserver = null;
    
    this.observer = null;
  }

  observe(node) {
    if (this.observer) this.observer.disconnect();
    this.observer = new MutationObserver(this.callback.bind(this));
    this.observer.observe(node, { childList: true });
  }

  createGrimoireObserver(node) {
    if (this.grimoireObserver) this.grimoireObserver.disconnect();
    this.grimoireObserver = new GrimoireObserver();
    this.grimoireObserver.observe(node);
  }
  
  removeGrimoireObserver() {
    if (this.grimoireObserver) {
      this.grimoireObserver.disconnect();
      this.grimoireObserver = null;
    }
  }
  
  createLobbyObserver(node) {
    if (this.lobbyObserver) this.lobbyObserver.disconnect();
    this.lobbyObserver = new LobbyObserver(node);
    this.lobbyObserver.observe(node);
  }
  
  removeLobbyObserver() {
    if (this.lobbyObserver) {
      this.lobbyObserver.disconnect();
      this.lobbyObserver = null;
    }
  }


  callback(mutationList) {
    mutationList.forEach(mutation => {
      if (mutation.type === 'childList') {
        Array.from(mutation.addedNodes).filter(node => node.nodeType === Node.ELEMENT_NODE).forEach(node => {
          if (node.id === 'grimoire') {
            this.createGrimoireObserver(node);
          } else if (node.id === 'lobby') {
            this.createLobbyObserver(node);
          }
        });
        Array.from(mutation.removedNodes).filter(node => node.nodeType === Node.ELEMENT_NODE).forEach(node => {
          if (node.id === 'grimoire') {
            this.removeGrimoireObserver();
          } else if (node.id === 'lobby') {
            this.removeLobbyObserver();
          }
        });
      }
    });
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
