export class AppObserver {
  constructor({ createGrimoireObserver, createLobbyObserver, removeGrimoireObserver, removeLobbyObserver }) {
    this.createGrimoireObserver = createGrimoireObserver;
    this.createLobbyObserver = createLobbyObserver;
    this.removeGrimoireObserver = removeGrimoireObserver;
    this.removeLobbyObserver = removeLobbyObserver;
    this.observer = null;
  }

  observe(node) {
    if (this.observer) this.observer.disconnect();
    this.observer = new MutationObserver(this.callback.bind(this));
    this.observer.observe(node, { childList: true });
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
