import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { editUser, removeUser } from '../state/data/dataSlice';
import { setChangesPending } from '../state/settings/settingsSlice';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookOpen,
  faEye,
  faScroll,
  faUser,
  faHourglassHalf,
  faSun,
  faCloud,
  faCloudMoon,
} from "@fortawesome/free-solid-svg-icons"
import ReactModal from 'react-modal';
import UserInput from './UserInput';
import UserStatus from './UserStatus';

const ListItem = ({ listIndex, itemIndex, name, id, userStatus }) => {
  const dispatch = useDispatch();
  const isEditing = useSelector((state) => state.settings.editing);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const faIcon = () => {
    return (userStatus.status === "Storytelling") ? faBookOpen :
           (userStatus.status === "Playing") ? faUser :
           (userStatus.status === "Spectating") ? faEye : null;
  }

  const getPhaseElement = (session) => {
    if (!session.isRunning) {
      return (<><FontAwesomeIcon icon={faHourglassHalf} /> In between games</>);
    }
    if (session.phase === 0) {
      return (<><FontAwesomeIcon icon={faCloud} /> Preparing Night 1</>);
    }
    let dayNumber = Math.floor((session.phase - 1) / 2) + 1;
    if (session.phase % 2 === 1) {
      return (<><FontAwesomeIcon icon={faCloudMoon} /> Night {dayNumber}</>);
    } else {
      return (<><FontAwesomeIcon icon={faSun} /> Day {dayNumber}</>);
    }
  }

  return (
    <div className="flex ml-10">
      <div className="flex flex-col w-full">
        <div className="flex flex-row justify-between items-center">
          <div className={`flex-0 text-nowrap px-2 py-0.3 cursor-pointer hover:underline ${userStatus.status ? "text-base font-semibold" : "text-sm font-light opacity-40"}`} onClick={() => setIsExpanded(!isExpanded)}><FontAwesomeIcon icon={faIcon()} /><span className="pl-1">{name}</span>
            {isEditing && <span className="flex-0 text-nowrap px-2 py-0.3">(ID: {id})</span>}
            {!isEditing && userStatus.status && <span className="text-nowrap px-0 font-thin"> - {userStatus.session.name}</span>}
          </div>
          {!isEditing && userStatus.status && (
            <button
              className="flex-0 text-sm text-black font-semibold bg-gray-300 mx-8 py-0.3 px-2 rounded hover:brightness-70"
              onClick={() => {
                if (confirm(`Join session "${userStatus.session.name}"?`)) {
                  window.open(`https://botc.app/join/${userStatus.session.name}`, '_blank')
                }
              }}
            >
              Join
            </button>
          )}
        </div>
        
        {userStatus.status && isExpanded && (
          <div className="flex-0 px-8 text-sm font-thin">
            <div className="text-nowrap px-2"><FontAwesomeIcon icon={faScroll} /> {userStatus.session.script}</div>
            <div className="text-nowrap px-2"><FontAwesomeIcon icon={faBookOpen} /> {userStatus.session.storytellers.map(user => user.username).join(', ') || 'None'}</div>
            <div className="text-nowrap px-2"><FontAwesomeIcon icon={faUser} /> {userStatus.session.players.reduce((acc, user) => acc + (user.id ? 1 : 0), 0)}/{userStatus.session.players.length} <FontAwesomeIcon icon={faEye} /> {userStatus.session.spectators.length}</div>
            <div className="text-nowrap px-2">{getPhaseElement(userStatus.session)}</div>
          </div>
        )}
      </div>
      {isEditing && (
        <>
          <button
            className="flex-0 text-black font-semibold bg-gray-300 m-1 py-0.3 px-2 rounded hover:brightness-70"
            onClick={() => setIsModalOpen(true)}
          >
            Edit
          </button>
          <button
            className="flex-0 font-semibold bg-red-700 m-1 py-0.3 px-2 rounded hover:brightness-70"
            onClick={() => {
              if (confirm(`Remove user "${name}"?`)) {
                dispatch(removeUser({ listIndex, itemIndex }))
                dispatch(setChangesPending(true));
              }
            }}
          >
            Remove
          </button>
        </>
      )}
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
          title="Edit User"
          initialUsername={name}
          initialUserId={id}
          onCancel={() => setIsModalOpen(false)}
          onSave={({name, id}) => {
            dispatch(editUser({ listIndex, itemIndex, user: { name, id } }))
            dispatch(setChangesPending(true));
            setIsModalOpen(false)
          }}
        />
      </ReactModal>
    </div>
  );
}

export default ListItem;