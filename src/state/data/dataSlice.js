import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const getRandomInt = (max) => {
  return Math.floor(Math.random() * max);
}

const _demoLists = [
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
  lists: []
}

const migrateStoredData = (oldData) => {
  let newData = oldData;
  if (Array.isArray(oldData)) {
    // Old, pre-versioned data format
    newData = {
      _meta: {
        version: 1
      },
      preferences: {},
      token: null,
      lists: oldData,
      timestamp: 0
    };
  }

  return newData;
}

const compareData = (localData, remoteData) => {
  if (!remoteData) return localData;
  if (!localData) return remoteData;

  if (localData.timestamp > remoteData.timestamp) {
    return localData;
  } else if (localData.timestamp < remoteData.timestamp) {
    return remoteData;
  } else {
    // Default to remote data for backwards compatibility
    return remoteData;
  }
};

export const syncStorage = createAsyncThunk(
  'data/syncStorage',
  async () => {
    const localData = migrateStoredData(JSON.parse(localStorage.getItem("botc-friends")));
    let remoteData = null;
    try {
      const [tab] = await chrome.tabs.query({ url: "*://botc.app/*" });
      const response = await chrome.tabs.sendMessage(tab.id, { type: "syncStorage", data: localData });
      if (response.success) {
        remoteData = migrateStoredData(response.data);
      }
    } catch (e) {
      console.log("Couldn't load remote data from extension storage", e);
    }

    const syncedData = compareData(localData, remoteData);
    // Always sync token from remote if available
    syncedData.token = remoteData?.token || localData.token;

    localStorage.setItem("botc-friends", JSON.stringify(syncedData));
    return syncedData;
  }
);

export const saveListsToStorage = createAsyncThunk(
  'data/saveListsToStorage',
  async (lists) => {
    const localData = migrateStoredData(JSON.parse(localStorage.getItem("botc-friends")));
    localData.lists = lists;
    localData.timestamp = Date.now();

    let remoteData = null;
    try {
      const [tab] = await chrome.tabs.query({ url: "*://botc.app/*" });
      const response = await chrome.tabs.sendMessage(tab.id, { type: "syncStorage", data: localData });
      if (response.success) {
        remoteData = migrateStoredData(response.data);
      }
    } catch (e) {
      console.log("Couldn't sync local data to remote storage", e);
    }

    const syncedData = compareData(localData, remoteData);
    localStorage.setItem("botc-friends", JSON.stringify(syncedData));
    return syncedData;
  }
);

const dataSlice = createSlice({
  name: "data",
  initialState: initStorageData,
  reducers: {
    importLists: (state, action) => {
      const jsonData = action.payload;
      jsonData.forEach((newList) => {
        const matchingList = state.lists.findIndex((oldList) => oldList.name === newList.name);
        if (matchingList !== -1) {
          confirm(`Overwrite existing list "${newList.name}"?`) && (state.lists[matchingList] = newList);
        } else {
          state.lists.push(newList);
        }
      })
    },
    deleteList(state, action) {
      state.lists = state.lists.filter((list, index) => index !== action.payload);
    },
    createList(state) {
      // To prevent identical names, we can append a number if needed
      let newName = "New List";
      let nameSuffix = 1;
      while (state.lists.find((list) => list.name === newName)) {
        newName = `New List (${nameSuffix})`;
        nameSuffix += 1;
      }
      state.lists.push({
        name: newName,
        color: {
          r: getRandomInt(255),
          g: getRandomInt(255),
          b: getRandomInt(255),
          a: 1
        },
        users: [],
      });
    },
    updateList(state, action) {
      const { listIndex, list } = action.payload;
      state.lists[listIndex] = {
        ...list,
        users: list.users.toSorted((a, b) => a.name.localeCompare(b.name)),
      };
    },
    addUser(state, action) {
      const { listIndex, user } = action.payload;
      const list = state.lists[listIndex];
      if (list) {
        list.users.push(user);
        list.users = list.users.toSorted((a, b) => a.name.localeCompare(b.name));
      }
    },
    editUser(state, action) {
      const { listIndex, itemIndex, user } = action.payload;
      const list = state.lists[listIndex];
      if (list) {
        list.users[itemIndex] = user;
        list.users = list.users.toSorted((a, b) => a.name.localeCompare(b.name));
      }
    },
    removeUser(state, action) {
      const { listIndex, itemIndex } = action.payload;
      const list = state.lists[listIndex];
      if (list) {
        list.users = list.users.filter((user, index) => index !== itemIndex);
        list.users = list.users.toSorted((a, b) => a.name.localeCompare(b.name));
      }
    },
    moveListUp(state, action) {
      const index = action.payload;
      if (index > 0) {
        [state.lists[index - 1], state.lists[index]] = [state.lists[index], state.lists[index - 1]];
      }
    },
    moveListDown(state, action) {
      const index = action.payload;
      if (index < state.lists.length - 1) {
        [state.lists[index + 1], state.lists[index]] = [state.lists[index], state.lists[index + 1]];
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncStorage.fulfilled, (state, action) => {
        return action.payload;
      })
      .addCase(saveListsToStorage.fulfilled, (state, action) => {
        return action.payload;
      });
  }
});

export default dataSlice.reducer;
export const { importLists, deleteList, createList, updateList, addUser, editUser, removeUser, moveListUp, moveListDown } = dataSlice.actions;