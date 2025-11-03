import { combineReducers, configureStore } from "@reduxjs/toolkit"
import dataReducer from "./data/dataSlice.js"
import settingsReducer from "./settings/settingsSlice.js"

const rootReducer = combineReducers({
  data: dataReducer,
  settings: settingsReducer
})

export const setupStore = (preloadedState) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState
  })
}
