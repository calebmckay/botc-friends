import ReactModal from 'react-modal';
import Header from './components/Header'
import Footer from './components/Footer'
import List from './components/List'

import { useSelector, useDispatch } from 'react-redux';
import { syncStorage, createList } from './state/data/dataSlice';
import { fetchSessions } from './state/sessions/sessionsSlice';
import { setChangesPending } from './state/settings/settingsSlice';
import { useEffect } from 'react';

ReactModal.defaultStyles.content.backgroundColor = 'var(--color-gray-700)';

const SESSION_FETCH_INTERVAL_MS = 15 * 1000; // 15 seconds

function App() {
  const dispatch = useDispatch();

  const settings = useSelector((state) => state.settings);
  const lists = useSelector((state) => state.data?.lists);

  useEffect(() => {
    dispatch(syncStorage()).then(() => {
      dispatch(fetchSessions())
    });

    const timerId = setInterval(() => {
      dispatch(fetchSessions())
    }, SESSION_FETCH_INTERVAL_MS);

    return () => clearInterval(timerId);
  }, [dispatch]);

  return (
    <main>
      <Header />
        
        {lists && lists.map((list, index) => (
          <List
            layout
            key={list.name}
            listIndex={index}
            list={list}
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          />
        ))}
        {settings.editing && (
          <div className="flex justify-center m-4">
            <button
              className="text-black bg-gray-300 mx-1 px-4 py-2 rounded hover:brightness-70"
              onClick={() => {
                dispatch(createList())
                dispatch(setChangesPending(true));
              }}
            >
              Add New List
            </button>
          </div>
        )}
        
      <Footer />
    </main>
  )
}

export default App
