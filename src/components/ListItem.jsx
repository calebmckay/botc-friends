import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { editUser, removeUser } from '../state/data/dataSlice';
import { setChangesPending } from '../state/settings/settingsSlice';
import ReactModal from 'react-modal';
import UserInput from './UserInput';

const ListItem = ({ listIndex, itemIndex, name, id }) => {
  const dispatch = useDispatch();
  const isEditing = useSelector((state) => state.settings.editing);

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex ml-10">
      <p className="flex-0 text-nowrap px-2 py-0.3">{name}</p>
      {isEditing && <p className="flex-1 text-nowrap px-2 py-0.3">(ID: {id})</p>}
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