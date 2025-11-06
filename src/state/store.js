import { combineReducers, configureStore } from "@reduxjs/toolkit"
import dataReducer from "./data/dataSlice.js"
import sessionReducer from "./sessions/sessionsSlice.js"
import settingsReducer from "./settings/settingsSlice.js"

const rootReducer = combineReducers({
  data: dataReducer,
  sessions: sessionReducer,
  settings: settingsReducer
})

export const setupStore = (preloadedState) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState
  })
}
