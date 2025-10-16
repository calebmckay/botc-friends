import { createSlice } from "@reduxjs/toolkit";

const settingsSlice = createSlice({
  name: "settings",
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

export default settingsSlice.reducer;