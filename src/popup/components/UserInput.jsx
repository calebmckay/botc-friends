import { useState } from 'react';

const UserInput = ({ title, initialUsername, initialUserId, onCancel, onSave }) => {
  const [username, setUsername] = useState(initialUsername || '');
  const [userId, setUserId] = useState(initialUserId || '');
  
  const handleSave = () => {
    onSave({ name: username, id: userId });
  };

  const handleChangeUsername = (e) => {
    setUsername(e.target.value);
  }

  const handleChangeUserId = (e) => {
    setUserId(parseInt(e.target.value));
  }

  return (
    <div className="flex flex-col" >
      <h4 className="mb-2 text-center">{title}</h4>
      <input type="text" className="border-b-1 border-b-black my-1 p-1" id="username-input" placeholder="Username" value={username} onChange={handleChangeUsername}/>
      <input type="text" className="border-b-1 border-b-black my-1 p-1" id="userid-input" placeholder="User ID" value={userId} onChange={handleChangeUserId}/>
      <div className="modal-actions mt-3 flex justify-center">
        <button onClick={onCancel} className="flex-0 text-black bg-gray-300 mx-1 px-1 rounded hover:brightness-70" id="cancel-btn">Cancel</button>
        <button onClick={handleSave} className="flex-0 text-black bg-gray-300 mx-1 px-1 rounded hover:brightness-70" id="save-btn">Save</button>
      </div>
    </div>
  )
}

export default UserInput;