import { useSelector } from 'react-redux';

const UserRoles = {
  STORYTELLER: "storyteller",
  PLAYER: "player",
  SPECTATOR: "spectator",
}

const UserStatus = ({ name, id }) => {
  const isEditing = useSelector(state => state.settings.editing);
  const userStatus = useSelector(state => {
    if (!state.sessions || !state.sessions.sessions) {
      return {
        status: null,
        session: null
      };
    }
    for (const session of state.sessions.sessions) {
      if (session.storytellers.find(user => user.id === id)) {
        return {
          status: UserRoles.STORYTELLER,
          session
        };
      }
      if (session.players.find(user => user.id === id)) {
        return {
          status: UserRoles.PLAYER,
          session
        };
      }
      if (session.spectators.find(user => user.id === id)) {
        return {
          status: UserRoles.SPECTATOR,
          session
        };
      }
    }
    return {
      status: null,
      session: null
    }
  });

  return (
    <p className="flex-0 text-nowrap px-2 py-0.3">{name}
      {isEditing && <span className="flex-1 text-nowrap px-2 py-0.3">(ID: {id})</span>}
      {userStatus.status && <span className="flex-1 text-nowrap px-2 py-0.3">(Status: {userStatus.status})</span>}
    </p>
  );
}

export default UserStatus;