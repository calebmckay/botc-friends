import { createSlice } from "@reduxjs/toolkit";

const initialSettings = {
  editing: false,
  includeSpectators: false,
}

const settingsSlice = createSlice({
  name: "settings",
  initialState: initialSettings,
  reducers: {
    toggleEditing: (state) => {
      state.editing = !state.editing;
    },
    toggleIncludeSpectators: (state) => {
      state.includeSpectators = !state.includeSpectators;
    },
    resetSettings: (state) => {
      state.editing = initialSettings.editing;
      state.includeSpectators = initialSettings.includeSpectators;
    }
  }
});

export default settingsSlice.reducer;
export const { toggleEditing, toggleIncludeSpectators, resetSettings } = settingsSlice.actions;