import { configureStore } from "@reduxjs/toolkit"
import listReducer from "./lists/listSlice.js"
import settingsReducer from "./settings/settingsSlice.js"

const demoLists = [
  {
    name: "Friends",
    color: {
      r: '46',
      g: '125',
      b: '50',
      a: '1'
    },
    users: [
      {
        id: 8274423742618,
        name: "spellbee"
      },
      {
        id: 8330200514714,
        name: "Bones" 
      }
    ]
  },
  {
    name: "Block",
    color: {
      r: '189',
      g: '40',
      b: '40',
      a: '1'
    },
    users: [
      {
        id: 8274374230170,
        name: "Bearface"
      },
    ]
  },
]

export const store = configureStore({
  reducer: {
    lists: listReducer,
    settings: settingsReducer
  },
  preloadedState: {
    lists: demoLists,
    settings: {
      editing: false,
      includeSpectators: false,
    }
  }
})
