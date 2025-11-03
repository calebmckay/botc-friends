import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { toggleEditing, setChangesPending } from '../state/settings/settingsSlice';
import { Validator } from 'jsonschema';
import schemaV1 from '../state/data/schemas/v1.js';
import { saveListsToStorage, syncStorage, importLists } from '../state/data/dataSlice';
import ReactModal from 'react-modal';
import ImportInput from './ImportInput';
import ExportModal from "./ExportModal";
import {
  faGear,
} from "@fortawesome/free-solid-svg-icons"

export default function Header() {
  const dispatch = useDispatch();
  const isEditing = useSelector((state) => state.settings.editing);
  const changesPending = useSelector((state) => state.settings.changesPending);
  const lists = useSelector((state) => state.data?.lists);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [errorText, setErrorText] = useState(null);

  return (
    <div className="flex items-center">
      <header className="bottom-2 flex-1 w-full text-left text-xl p-1 font-bold">
        <h1>BOTC Friends</h1>
      </header>
      {isEditing ? (
        <div>
          <button
            className="flex-0 text-black bg-gray-300 mx-1 px-1 rounded hover:brightness-70"
            onClick={() => {
              setIsImportModalOpen(true)
              dispatch(setChangesPending(true))
            }}
          >
            Import
          </button>
          <button
            className="flex-0 text-black bg-gray-300 mx-1 px-1 rounded hover:brightness-70"
            onClick={() => setIsExportModalOpen(true)}
          >
            Export
          </button>
          <button
            disabled={!changesPending}
            className="flex-0 text-black bg-gray-300 mx-1 px-1 rounded hover:brightness-70 disabled:opacity-30"
            onClick={() => {
              dispatch(saveListsToStorage(lists))
              dispatch(setChangesPending(false))
              dispatch(toggleEditing())
            }}
          >
            Save
          </button>
          <button
            className="flex-0 text-black bg-gray-300 mx-1 px-1 rounded hover:brightness-70"
            onClick={() => {
              if (changesPending) {
                if (confirm('Are you sure you want to cancel your changes? All unsaved changes will be lost.')) {
                  dispatch(syncStorage())
                  dispatch(setChangesPending(false))
                }
              }
              dispatch(toggleEditing())
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          className={`flex-0 text-black mx-1 px-1 rounded hover:brightness-70 ${isEditing ? 'bg-gray-600' : 'bg-gray-300'}`}
          onClick={() => dispatch(toggleEditing())}
        >
          <FontAwesomeIcon icon={faGear} />
        </button>
      )}

      <ReactModal
        isOpen={isImportModalOpen}
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
        <ImportInput 
          onCancel={() => setIsImportModalOpen(false)}
          onSave={(payload) => {
            try {
              // Make sure the data can be parsed
              const jsonData = JSON.parse(payload);

              // Validate against schema
              const validator = new Validator();
              const validationResult = validator.validate(jsonData, schemaV1.lists);
              if (!validationResult.valid) {
                console.log('Validation errors:', validationResult.errors);
                throw new Error('JSON data does not match required schema: ' + validationResult.errors.map(e => e.stack).join(', '));
              }

              dispatch(importLists(jsonData))
              setIsImportModalOpen(false)
            } catch (e) {
              console.log('Import failed:', e);
              setErrorText('Failed to import data. Please check the format and try again.');
              return;
            }
            
          }}
        />
        {errorText && <p className="text-red-600">{errorText}</p>}
      </ReactModal>

      <ReactModal
        isOpen={isExportModalOpen}
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
        <ExportModal 
          onClose={() => setIsExportModalOpen(false)}
          jsonText={JSON.stringify(useSelector((state) => state.data?.lists))}
        />
      </ReactModal>
      
    </div>
  );
}