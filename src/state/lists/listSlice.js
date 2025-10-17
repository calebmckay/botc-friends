import { createSlice } from "@reduxjs/toolkit";

const listSlice = createSlice({
  name: "lists",
  initialState: [],
  reducers: {
    loadLists: (state, action) => {
      state = action.payload;
    },
    deleteList(state, action) {
      state = state.filter((list, index) => index !== action.payload);
    },
    createList(state) {
      state.push({
        name: "New List",
        users: [],
      });
    },
    updateList(state, action) {
      state[action.payload.id] = {
        ...action.payload
      };
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
  }
});

export default listSlice.reducer;
export const { loadLists, deleteList, createList, updateList, moveListUp, moveListDown } = listSlice.actions;