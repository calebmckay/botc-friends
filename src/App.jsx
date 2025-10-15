import Footer from './components/Footer'
import List from './components/List'

const demoList = [
  {
    id: 1,
    name: "Friends",
    color: '#0f0',
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
    color: '#f00',
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
    </main>
  )
}

export default App
