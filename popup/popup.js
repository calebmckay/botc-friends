window.browser = window.browser || window.chrome;

const friendsList = document.getElementById('friends-list');
const blockList = document.getElementById('block-list');
const addFriendBtn = document.getElementById('add-friend-btn');
const addBlockBtn = document.getElementById('add-block-btn');
const modalBg = document.getElementById('modal-bg');
const modalTitle = document.getElementById('modal-title');
const usernameInput = document.getElementById('username-input');
const useridInput = document.getElementById('userid-input');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');

let currentList = null; // "friends" or "block"
let editingItem = null; // The <li> being edited, or null if adding

function showModal(listType, li = null, username = '', userId = '') {
  currentList = listType;
  editingItem = li;
  modalTitle.textContent = listType === 'friends' ? (li ? 'Edit Friend' : 'Add Friend') : (li ? 'Edit Blocked User' : 'Add Blocked User');
  usernameInput.value = username;
  useridInput.value = userId;
  modalBg.style.display = 'flex';
  usernameInput.focus();
}

function hideModal() {
  modalBg.style.display = 'none';
  editingItem = null;
}

function saveListsToStorage() {
  const extractData = li => {
    const match = li.textContent.match(/^(.+)\s\((\d+)\)/);
    return match ? `${match[1]} (${match[2]})` : '';
  };
  const friends = Array.from(friendsList.children).map(extractData).filter(Boolean);
  const block = Array.from(blockList.children).map(extractData).filter(Boolean);
  browser.storage.local.set({ friends, block });
}

function createListItem(listType, username, userId) {
  const li = document.createElement('li');
  li.textContent = `${username} (${userId})`;

  // Edit button
  const editBtn = document.createElement('button');
  editBtn.textContent = 'Edit';
  editBtn.style.marginLeft = '8px';
  editBtn.addEventListener('click', () => {
    showModal(listType, li, username, userId);
  });

  // Remove button
  const removeBtn = document.createElement('button');
  removeBtn.textContent = 'Remove';
  removeBtn.style.marginLeft = '4px';
  removeBtn.addEventListener('click', () => {
    li.remove();
    saveListsToStorage();
  });

  li.appendChild(editBtn);
  li.appendChild(removeBtn);
  return li;
}

function loadListsFromStorage() {
  browser.storage.local.get(['friends', 'block'], (data) => {
    friendsList.innerHTML = '';
    blockList.innerHTML = '';
    (data.friends || []).forEach(text => {
      const match = text.match(/^(.+)\s\((\d+)\)$/);
      if (match) {
        friendsList.appendChild(createListItem('friends', match[1], match[2]));
      }
    });
    (data.block || []).forEach(text => {
      const match = text.match(/^(.+)\s\((\d+)\)$/);
      if (match) {
        blockList.appendChild(createListItem('block', match[1], match[2]));
      }
    });
  });
}

function addItemToList(listType, username, userId) {
  const li = createListItem(listType, username, userId);
  if (listType === 'friends') {
    friendsList.appendChild(li);
  } else {
    blockList.appendChild(li);
  }
  saveListsToStorage();
}

addFriendBtn.addEventListener('click', () => showModal('friends'));
addBlockBtn.addEventListener('click', () => showModal('block'));
cancelBtn.addEventListener('click', hideModal);

saveBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const userId = useridInput.value.trim();
  if (!username || !userId) {
    alert('Please enter both username and user ID.');
    return;
  }
  if (editingItem) {
    // Replace the edited item with new values
    const newLi = createListItem(currentList, username, userId);
    editingItem.parentNode.replaceChild(newLi, editingItem);
    editingItem = null;
  } else {
    addItemToList(currentList, username, userId);
  }
  saveListsToStorage();
  hideModal();
});

// Optional: Close modal on background click
modalBg.addEventListener('click', (e) => {
  if (e.target === modalBg) hideModal();
});

document.addEventListener('DOMContentLoaded', loadListsFromStorage);