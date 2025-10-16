

const UserInput = () => {
  return (
    <div className="flex flex-col" >
      <h4 className="mb-2 text-center">Add User</h4>
      <input type="text" className="border-b-1 border-b-black my-1 p-1" id="username-input" placeholder="Username" />
      <input type="text" className="border-b-1 border-b-black my-1 p-1" id="userid-input" placeholder="User ID" />
      <div className="modal-actions mt-3 flex justify-center">
        <button className="flex-0 text-black bg-gray-300 mx-1 px-1 rounded hover:brightness-70" id="cancel-btn">Cancel</button>
        <button className="flex-0 text-black bg-gray-300 mx-1 px-1 rounded hover:brightness-70" id="save-btn">Save</button>
      </div>
    </div>
  )
}

export default UserInput;