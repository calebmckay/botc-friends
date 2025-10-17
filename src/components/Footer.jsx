import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSelector, useDispatch } from 'react-redux';
import { toggleEditing } from '../state/settings/settingsSlice';
import {
  faGear,
} from "@fortawesome/free-solid-svg-icons"

export default function Footer() {
  const dispatch = useDispatch();
  const isEditing = useSelector((state) => state.settings.editing);

  return (
    <div className="absolute bottom-2 flex items-center">
      <footer className="bottom-2 w-full text-center text-xs p-1 italic">
        <p>This extension is not affiliated with Blood on the Clocktower or The Pandemonium Institute. Blood on the Clocktower is a trademark of Steven Medway and The Pandemonium Institute.</p>
      </footer>
      <button
        className={`flex-0 text-black mx-1 px-1 rounded hover:brightness-70 ${isEditing ? 'bg-gray-600' : 'bg-gray-300'}`}
        onClick={() => dispatch(toggleEditing())}
      >
        <FontAwesomeIcon icon={faGear} />
      </button>
    </div>
  );
}