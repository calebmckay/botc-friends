import { createSlice } from "@reduxjs/toolkit";

const initialSettings = {
  editing: false,
  includeSpectators: false,
  changesPending: false,
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
    },
    setChangesPending: (state, action) => {
      state.changesPending = action.payload;
    }
  }
});

export default settingsSlice.reducer;
export const { toggleEditing, setChangesPending } = settingsSlice.actions;