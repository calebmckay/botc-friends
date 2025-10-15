import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGear,
} from "@fortawesome/free-solid-svg-icons"

export default function Footer() {
  return (
    <div>
      <FontAwesomeIcon className="absolute text-black bottom-10 right-3 bg-gray-300 m-1 p-1 rounded hover:brightness-70" icon={faGear} />
      <footer className="absolute bottom-2 w-full text-center text-xs p-1 italic">
        <p>This extension is not affiliated with Blood on the Clocktower or The Pandemonium Institute. Blood on the Clocktower is a trademark of Steven Medway and The Pandemonium Institute.</p>
      </footer>
    </div>
  );
}