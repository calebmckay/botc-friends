const ExportModal = ({ jsonText, onClose }) => {
  return (
    <div className="flex flex-col" >
      <h4 className="mb-2 text-center">Export Data</h4>
      <textarea readOnly={true} value={jsonText}></textarea>
      <div className="modal-actions mt-3 flex justify-center">
        <button onClick={onClose} className="flex-0 text-black bg-gray-300 mx-1 px-1 rounded hover:brightness-70" id="close-btn">Close</button>
      </div>
    </div>
  )
}

export default ExportModal;