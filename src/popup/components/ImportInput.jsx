import { useState } from 'react';

const ImportInput = ({ onCancel, onSave }) => {
  const [textValue, setTextValue] = useState('');

  const handleTextChange = (e) => {
    setTextValue(e.target.value);
  }

  const handleSave = () => {
    onSave(textValue);
  };


  return (
    <div className="flex flex-col" >
      <h4 className="mb-2 text-center">Import Data</h4>
      <textarea value={textValue} onChange={handleTextChange}></textarea>
      <div className="modal-actions mt-3 flex justify-center">
        <button onClick={onCancel} className="flex-0 text-black bg-gray-300 mx-1 px-1 rounded hover:brightness-70" id="cancel-btn">Cancel</button>
        <button onClick={handleSave} className="flex-0 text-black bg-gray-300 mx-1 px-1 rounded hover:brightness-70" id="save-btn">Save</button>
      </div>
    </div>
  )
}

export default ImportInput;