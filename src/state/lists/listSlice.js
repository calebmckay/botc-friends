import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const getRandomInt = (max) => {
  return Math.floor(Math.random() * max);
}

export const listsJsonSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      name: { type: "string" },
      color: {
        type: "object",
        properties: {
          r: { type: "number" },
          g: { type: "number" },
          b: { type: "number" },
          a: { type: "number" }
        },
        required: ["r", "g", "b", "a"]
      },
      users: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "number" },
            name: { type: "string" }
          },
          required: ["id", "name"]
        }
      }
    },
    required: ["name", "color", "users"]
  }
}

export const fetchListsFromStorage = createAsyncThunk(
  'lists/fetchFromStorage',
  async () => {
    let storedData = null;
    try {
      const [tab] = await chrome.tabs.query({ url: "*://botc.app/*" });
      const response = await chrome.tabs.sendMessage(tab.id, { type: "getLists" });
      if (response.success) {
        storedData = response.lists;
      }
    } catch (e) {
      console.log("Not running in an extension - loading directly from localStorage", e);
      storedData = JSON.parse(localStorage.getItem("botc-friends"));
    }
    return storedData || [];
  }
);

export const saveListsToStorage = createAsyncThunk(
  'lists/saveToStorage',
  async (lists) => {
    try {
      const [tab] = await chrome.tabs.query({ url: "*://botc.app/*" });
      const response = await chrome.tabs.sendMessage(tab.id, { type: "saveLists", lists });
      if (!response.success) {
        console.error("Failed to save lists to storage.");
      }
    } catch (e) {
      console.log("Not running in an extension - saving directly to localStorage", e);
      localStorage.setItem("botc-friends", JSON.stringify(lists));
    }
  }
);

const listSlice = createSlice({
  name: "lists",
  initialState: [],
  reducers: {
    importLists: (state, action) => {
      const jsonData = action.payload;
      jsonData.forEach((newList) => {
        const matchingList = state.findIndex((oldList) => oldList.name === newList.name);
        if (matchingList !== -1) {
          confirm(`Overwrite existing list "${newList.name}"?`) && (state[matchingList] = newList);
        } else {
          state.push(newList);
        }
      })
    },
    deleteList(state, action) {
      return state.filter((list, index) => index !== action.payload);
    },
    createList(state) {
      // To prevent identical names, we can append a number if needed
      let newName = "New List";
      let nameSuffix = 1;
      while (state.find((list) => list.name === newName)) {
        newName = `New List (${nameSuffix})`;
        nameSuffix += 1;
      }
      state.push({
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
      state[listIndex] = {
        ...list,
        users: list.users.sort((a, b) => a.name.localeCompare(b.name)),
      };
    },
    addUser(state, action) {
      const { listIndex, user } = action.payload;
      const list = state[listIndex];
      if (list) {
        list.users.push(user);
        list.users = list.users.sort((a, b) => a.name.localeCompare(b.name));
      }
    },
    editUser(state, action) {
      const { listIndex, itemIndex, user } = action.payload;
      const list = state[listIndex];
      if (list) {
        list.users[itemIndex] = user;
        list.users = list.users.sort((a, b) => a.name.localeCompare(b.name));
      }
    },
    removeUser(state, action) {
      const { listIndex, itemIndex } = action.payload;
      const list = state[listIndex];
      if (list) {
        list.users = list.users.filter((user, index) => index !== itemIndex);
        list.users = list.users.sort((a, b) => a.name.localeCompare(b.name));
      }
    },
    moveListUp(state, action) {
      const index = action.payload;
      if (index > 0) {
        [state[index - 1], state[index]] = [state[index], state[index - 1]];
      }
    },
    moveListDown(state, action) {
      const index = action.payload;
      if (index < state.length - 1) {
        [state[index + 1], state[index]] = [state[index], state[index + 1]];
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchListsFromStorage.fulfilled, (state, action) => {
        return action.payload;
      })
      .addCase(saveListsToStorage.fulfilled, () => {
        // No state change needed after saving
      });
  }
});

export default listSlice.reducer;
export const { importLists, deleteList, createList, updateList, addUser, editUser, removeUser, moveListUp, moveListDown } = listSlice.actions;