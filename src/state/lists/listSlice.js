import { createSlice } from "@reduxjs/toolkit";

const listSlice = createSlice({
  name: "lists",
  initialState: [],
  reducers: {
    loadFromStorage: () => {
      return JSON.parse(localStorage.getItem("friendLists")) || [];
    },
    saveToStorage: (state) => {
      localStorage.setItem("friendLists", JSON.stringify(state));
    }
  }
});

export default listSlice.reducer;