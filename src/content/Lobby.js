export class Lobby {
  constructor(rowElement, lobbyId) {
    this.rowElement = rowElement;
    this.lobbyId = lobbyId;
    this.session = null; // To be mapped externally
  }

  setSession(session) {
    this.session = session;
  }

  getRow() {
    return this.rowElement;
  }

  getLobbyId() {
    return this.lobbyId;
  }

  getSession() {
    return this.session;
  }
}
