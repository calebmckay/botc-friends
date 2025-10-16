import ReactModal from 'react-modal';
import Footer from './components/Footer'
import List from './components/List'
import UserInput from './components/UserInput'

ReactModal.defaultStyles.content.backgroundColor = 'var(--color-gray-700)';

const demoList = [
  {
    id: 1,
    name: "Friends",
    color: {
      r: '46',
      g: '125',
      b: '50',
      a: '1'
    },
    items: [
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
    id: 2,
    name: "Block",
    color: {
      r: '189',
      g: '40',
      b: '40',
      a: '1'
    },
    items: [
      {
        id: 8274374230170,
        name: "Bearface"
      },
    ]
  },
]

function App() {
  return (
    <main>
      <List list={demoList[0]} />
      <List list={demoList[1]} />
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
