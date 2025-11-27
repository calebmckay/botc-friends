import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { setupStore } from "./state/store.js"
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <Provider store={setupStore()}>
    <App />
  </Provider>
);
