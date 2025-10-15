const ListItem = ({ name, id }) => {
  return (
    <div className="flex ml-10">
      <p className="flex-1 px-2 py-0.3">{name} (ID: {id})</p>
      <button className="flex-0 text-black font-semibold bg-gray-300 m-1 py-0.3 px-2 rounded hover:brightness-70">Edit</button>
      <button className="flex-0 font-semibold bg-red-700 m-1 py-0.3 px-2 rounded hover:brightness-70">Remove</button>
    </div>
  );
}

export default ListItem;