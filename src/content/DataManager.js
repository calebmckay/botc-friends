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

export class DataManager {
  constructor() {
    if (DataManager.instance) {
      return DataManager.instance;
    }
    DataManager.instance = this;

    this.storedData = {};
    this.userIdMap = {};

    this.updateLists();
  }

  static getInstance() {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  static migrateStoredData(oldData) {
    let newData = oldData;
    if (Array.isArray(oldData)) {
      // Old, pre-versioned data format
      newData = {
        ...initStorageData,
        lists: oldData,
      };
    }

    return newData;
  }

  static compareData(localData, remoteData) {
    if (!remoteData) return localData;
    if (!localData) return remoteData;

    if (localData.timestamp > remoteData.timestamp) {
      return localData;
    } else if (localData.timestamp < remoteData.timestamp) {
      return remoteData;
    } else {
      // Default to local data for backwards compatibility
      return localData;
    }
  }

  injectCSS() {
    let style = document.querySelector("style#botc-friends-style");
    if (!style) {
      style = document.createElement('style');
      style.id = 'botc-friends-style';
      style = document.head.appendChild(style);
    }

    let styleText = "";
    this.storedData.lists.map((list, index) => {
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

  updateLists() {
    const localData = localStorage.getItem('botc-friends');
    if (!localData) {
      console.error("No stored data found - initializing with default data");
      localStorage.setItem('botc-friends', JSON.stringify(initStorageData));
      return;
    }
    try {
      this.storedData = DataManager.migrateStoredData(JSON.parse(localData));
    } catch (e) {
      console.error("Failed to parse stored data:", e);
      return;
    }

    // Map userId to list index for quick lookup
    this.userIdMap = {};
    this.storedData.lists.forEach((list, index) => {
      list.users.forEach(user => {
        if (!Object.prototype.hasOwnProperty.call(this.userIdMap, user.id)) {
          this.userIdMap[user.id] = index;
        }
      });
    });

    // Update the CSS classes for the lists
    this.injectCSS();
  }

  syncStoredData(remoteData) {
    const localData = this.migrateStoredData(JSON.parse(localStorage.getItem("botc-friends")));
    let syncedData = this.compareData(localData, remoteData);
    // Fall back to initial data if both are null/invalid
    if (syncedData == null) {
      syncedData = initStorageData;
    }
    // Insert token regardless of which data was chosen
    syncedData.token = localStorage.getItem("token");

    localStorage.setItem("botc-friends", JSON.stringify(syncedData));

    this.updateLists();
  }

  getListIdForUser(userId) {
    if (Object.prototype.hasOwnProperty.call(this.userIdMap, userId)) {
      return this.userIdMap[userId];
    }
    return null;
  }
}