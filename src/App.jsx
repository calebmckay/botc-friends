import ReactModal from 'react-modal';
import Footer from './components/Footer'
import List from './components/List'
import UserInput from './components/UserInput'

import { useSelector } from 'react-redux';

ReactModal.defaultStyles.content.backgroundColor = 'var(--color-gray-700)';

function App() {
  const settings = useSelector((state) => state.settings);
  const lists = useSelector((state) => state.lists);

  return (
    <main>
      {lists.map((list, index) => (
        <List key={index} list={list} />
      ))}
      <Footer />
      
      <ReactModal
        isOpen={false}
        ariaHideApp={false}
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1,
          },
          content: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
            margin: 0,
            zIndex: 2,
          }
        }}
      >
        <UserInput />
      </ReactModal>
    </main>
  )
}

export default App
