import { configureStore } from "@reduxjs/toolkit"
import listReducer from "./lists/listSlice.js"

export const store = configureStore({
  reducer: {
    lists: listReducer,
  }
})
