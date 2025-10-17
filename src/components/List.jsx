import { useState } from 'react'
import reactCSS from 'reactcss';
// import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SketchPicker } from "react-color"
import { useSelector } from 'react-redux';
import {
  faChevronUp,
  faChevronDown,
  faChevronRight,
  faPlus,
  faPalette,
  faTrash,
} from "@fortawesome/free-solid-svg-icons"

import ListItem from './ListItem';

const List = ({ open, list }) => {
  const isEditing = useSelector((state) => state.settings.editing);
  const [isOpen, setIsOpen] = useState(open);
  const [listName, setListName] = useState(list.name);
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [color, setColor] = useState(list.color || { r: '241', g: '112', b: '19', a: '1' });

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleClick = () => {
    setDisplayColorPicker(!displayColorPicker);
  };

  const handleClose = () => {
    setDisplayColorPicker(false);
  };

  const handleChange = (color) => {
    setColor(color.rgb);
  };

  const handleListNameChange = (e) => {
    setListName(e.target.value)
  }

  const styles = reactCSS({
    default: {
      color: {
        background: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
      }
    },
  });

  return (
    <div>
      <div className="p-2 flex justify-start content-center items-center relative">
        <FontAwesomeIcon className="m-1" onClick={toggleOpen} icon={isOpen ? faChevronDown : faChevronRight} />
        {isEditing ?
          <input type="text" className="flex-none border-b-1 border-b-white my-1 py-1" value={listName} size={listName.length} onChange={handleListNameChange}/> :
          <p className="flex-0" onClick={toggleOpen}>{listName}</p>
        }
        <div className="grow" />
        <button className="flex-0 text-black bg-gray-300 mx-1 px-1 rounded hover:brightness-70">
          <FontAwesomeIcon icon={faPlus} />
        </button>
        <button style={ styles.color } onClick={handleClick} className="flex-0 mx-1 px-1 rounded hover:brightness-70">
          <FontAwesomeIcon icon={faPalette} />
        </button>
        { displayColorPicker ? <div className="absolute z-2 top-9 right-3">
          <div className="fixed top-0 left-0 right-0 bottom-0" onClick={handleClose} />
          <SketchPicker disableAlpha={true} color={color} onChange={handleChange} />
        </div> : null }
        <button className="flex-0 text-black bg-gray-300 mx-1 px-1 rounded hover:brightness-70">
          <FontAwesomeIcon icon={faChevronUp} />
        </button>
        <button className="flex-0 text-black bg-gray-300 mx-1 px-1 rounded hover:brightness-70">
          <FontAwesomeIcon icon={faChevronDown} />
        </button>
        <button className="flex-0 text-white bg-red-800 mx-1 px-1 rounded hover:brightness-70">
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
      <div className={`transition-all duration-400 ease-in-out ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
        {list.users.map(item => <ListItem key={item.id} {...item} />)}
      </div>
    </div>
  );
};

// const Lists = () => {
//   const lists = useSelector((state) => state.lists);

//   return (
//     <div>
//       {lists.map((list) => (
//         <List key={list.id} list={list} />
//       ))}
//     </div>
//   );
// };

export default List;