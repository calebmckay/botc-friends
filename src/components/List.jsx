import { useState } from 'react'
import reactCSS from 'reactcss';
// import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SketchPicker } from "react-color"
import { useSelector, useDispatch } from 'react-redux';
import ReactModal from 'react-modal';
import { motion } from 'motion/react';
import {
  faChevronUp,
  faChevronDown,
  faChevronRight,
  faPlus,
  faPalette,
  faTrash,
} from "@fortawesome/free-solid-svg-icons"

import ListItem from './ListItem';
import UserInput from './UserInput';
import { addUser, deleteList, moveListDown, moveListUp, updateList } from '../state/data/dataSlice';
import { setChangesPending } from '../state/settings/settingsSlice';

const List = ({ ref, listIndex, list }) => {
  const dispatch = useDispatch();
  const listCount = useSelector((state) => state.data.lists.length);
  const isEditing = useSelector((state) => state.settings.editing);

  const [isOpen, setIsOpen] = useState(false);
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [tempListName, setTempListName] = useState(list.name);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    dispatch(updateList({
      listIndex,
      list: {
        ...list,
        users: list.users.toSorted((a, b) => a.name.localeCompare(b.name)),
        color: {r: parseInt(color.rgb.r), g: parseInt(color.rgb.g), b: parseInt(color.rgb.b), a: parseInt(color.rgb.a)},
      },
    }))
    dispatch(setChangesPending(true));
  };

  const handleListNameChange = (e) => {
    setTempListName(e.target.value);
    dispatch(setChangesPending(true));
  }

  const handleListNameBlur = () => {
    dispatch(updateList({
      listIndex,
      list: {
        ...list,
        name: tempListName,
        users: list.users.toSorted((a, b) => a.name.localeCompare(b.name)),
      },
    }))
  }

  const styles = reactCSS({
    default: {
      color: {
        background: `rgba(${list.color.r}, ${list.color.g}, ${list.color.b}, ${list.color.a})`,
      }
    },
  });

  return (
    <div ref={ref}>
      <div className="p-2 flex justify-start content-center items-center relative">
        <FontAwesomeIcon className="m-1" onClick={toggleOpen} icon={isOpen ? faChevronDown : faChevronRight} />
        {isEditing ?
          <input type="text" className="flex-none border-b-1 border-b-white my-1 py-1" value={tempListName} size={list.name.length} onChange={handleListNameChange} onBlur={handleListNameBlur}/> :
          <p className="flex-0 text-nowrap" onClick={toggleOpen}>{tempListName}</p>
        }
        <div className="grow" />
        { isEditing && (
          <div>
            <button
              className="flex-0 text-black bg-gray-300 mx-1 px-1 rounded hover:brightness-70"
              onClick={() => {
                setIsOpen(true)
                setIsModalOpen(true)
              }}
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
            <button
              disabled={listIndex === 0}
              className="flex-0 text-black bg-gray-300 mx-1 px-1 rounded hover:brightness-70 disabled:opacity-30"
              onClick={() => {
                dispatch(moveListUp(listIndex));
                dispatch(setChangesPending(true));
              }}
            >
              <FontAwesomeIcon icon={faChevronUp} />
            </button>
            <button
              disabled={listIndex === listCount - 1}
              className="flex-0 text-black bg-gray-300 mx-1 px-1 rounded hover:brightness-70 disabled:opacity-30"
              onClick={() => {
                dispatch(moveListDown(listIndex));
                dispatch(setChangesPending(true));
              }}
            >
              <FontAwesomeIcon icon={faChevronDown} />
            </button>
            <button
              className="flex-0 text-white bg-red-800 mx-1 px-1 rounded hover:brightness-70"
              onClick={() => {
                if (confirm(`Delete list "${list.name}"?`)) {
                  dispatch(deleteList(listIndex));
                  dispatch(setChangesPending(true));
                }
              }}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        )}
        {isEditing ?
          <div>
            <button style={ styles.color } onClick={handleClick} className="flex-0 mx-1 px-1 rounded hover:brightness-70">
              <FontAwesomeIcon icon={faPalette} />
            </button>
            { displayColorPicker ? <div className="absolute z-2 top-9 right-3">
              <div className="fixed top-0 left-0 right-0 bottom-0" onClick={handleClose} />
              <SketchPicker disableAlpha={true} color={list.color} onChange={handleChange} />
            </div> : null }
          </div>
        :
          <div style={ styles.color } className="flex-0 mx-1 px-1 rounded">
            <FontAwesomeIcon style={{opacity: 0}} icon={faPalette} />
          </div>
        }
        
      </div>
      <div className={`transition-all duration-400 ease-in-out ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        {list.users.map((item, index) => <ListItem key={item.name} listIndex={listIndex} itemIndex={index} {...item} />)}
      </div>

      <ReactModal
        isOpen={isModalOpen}
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
        <UserInput 
          title="Add User"
          onCancel={() => setIsModalOpen(false)}
          onSave={({name, id}) => {
            dispatch(addUser({ listIndex, user: { name, id } }))
            dispatch(setChangesPending(true));
            setIsModalOpen(false)
          }}
        />
      </ReactModal>
    </div>
  );
};

const MotionList = motion.create(List);
export default MotionList;