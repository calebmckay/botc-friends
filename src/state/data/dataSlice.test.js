import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import reducer, {
  importLists,
  deleteList,
  createList,
  updateList,
  addUser,
  editUser,
  removeUser,
  moveListUp,
  moveListDown,
  syncStorage,
  saveListsToStorage,
} from "./dataSlice";

const initialState = {
  _meta: { version: 1 },
  timestamp: 0,
  preferences: {},
  token: null,
  lists: [],
};

describe("dataSlice reducer", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it("should return the initial state", () => {
    expect(reducer(undefined, { type: undefined })).toEqual(initialState);
  });

  it("should handle createList", () => {
    const state = reducer(initialState, createList());
    expect(state.lists.length).toBe(1);
    expect(state.lists[0].name).toMatch(/New List/);
  });

  it("should handle multiple calls to createList", () => {
    const state1 = reducer(initialState, createList());
    const state2 = reducer(state1, createList());
    const state3 = reducer(state2, createList());
    expect(state3.lists.length).toBe(3);
    expect(state3.lists[0].name).toMatch("New List");
    expect(state3.lists[1].name).toMatch("New List (1)");
    expect(state3.lists[2].name).toMatch("New List (2)");
  });

  it("should handle deleteList", () => {
    const stateWithLists = { ...initialState, lists: [{ name: "A" }, { name: "B" }] };
    const state = reducer(stateWithLists, deleteList(0));
    expect(state.lists.length).toBe(1);
    expect(state.lists[0].name).toBe("B");
  });

  it("should handle importLists (add new)", () => {
    const newLists = [{ name: "Imported", color: {}, users: [] }];
    const state = reducer(initialState, importLists(newLists));
    expect(state.lists.length).toBe(1);
    expect(state.lists[0].name).toBe("Imported");
  });

  it("should handle updateList", () => {
    const stateWithLists = { ...initialState, lists: [{ name: "A", users: [{ name: "z" }, { name: "a" }] }] };
    const updatedList = { name: "A", users: [{ name: "b" }, { name: "a" }] };
    const state = reducer(stateWithLists, updateList({ listIndex: 0, list: updatedList }));
    expect(state.lists[0].users[0].name).toBe("a");
    expect(state.lists[0].users[1].name).toBe("b");
  });

  it("should handle addUser", () => {
    const stateWithLists = { ...initialState, lists: [{ name: "A", users: [] }] };
    const user = { name: "Bob", id: 1 };
    const state = reducer(stateWithLists, addUser({ listIndex: 0, user }));
    expect(state.lists[0].users[0].name).toBe("Bob");
    expect(state.lists[0].users[0].id).toBe(1);
  });

  it("should handle editUser", () => {
    const stateWithLists = { ...initialState, lists: [{ name: "A", users: [{ name: "Bob", id: 1 }] }] };
    const user = { name: "Alice", id: 1 };
    const state = reducer(stateWithLists, editUser({ listIndex: 0, itemIndex: 0, user }));
    expect(state.lists[0].users[0].name).toBe("Alice");
    expect(state.lists[0].users[0].id).toBe(1);
  });

  it("should handle removeUser", () => {
    const stateWithLists = { ...initialState, lists: [{ name: "A", users: [{ name: "Bob", id: 1 }, { name: "Alice", id: 2 }] }] };
    const state = reducer(stateWithLists, removeUser({ listIndex: 0, itemIndex: 0 }));
    expect(state.lists[0].users.length).toBe(1);
    expect(state.lists[0].users[0].name).toBe("Alice");
    expect(state.lists[0].users[0].id).toBe(2);
  });

  it("should handle moveListUp", () => {
    const stateWithLists = { ...initialState, lists: [{ name: "A" }, { name: "B" }] };
    const state = reducer(stateWithLists, moveListUp(1));
    expect(state.lists[0].name).toBe("B");
    expect(state.lists[1].name).toBe("A");
  });

  it("should handle moveListDown", () => {
    const stateWithLists = { ...initialState, lists: [{ name: "A" }, { name: "B" }] };
    const state = reducer(stateWithLists, moveListDown(0));
    expect(state.lists[0].name).toBe("B");
    expect(state.lists[1].name).toBe("A");
  });

  it("should handle importLists (overwrite)", () => {
    global.confirm = vi.fn(() => true);
    const stateWithLists = { ...initialState, lists: [{ name: "A", color: {}, users: [] }] };
    const newLists = [{ name: "A", color: { r: 1 }, users: [{ name: "x" }] }];
    const state = reducer(stateWithLists, importLists(newLists));
    expect(state.lists[0].color).toEqual({ r: 1 });
    expect(state.lists[0].users[0].name).toBe("x");
  });
});

describe("dataSlice async thunks", () => {
  let chromeTabsQueryMock, chromeTabsSendMessageMock;

  async function runThunk(thunk) {
    const dispatch = vi.fn();
    const getState = vi.fn();
    const thunkResult = await thunk(dispatch, getState, undefined);
    expect(thunkResult.meta.requestStatus).toBe("fulfilled");
    return thunkResult.payload;
  }

  beforeEach(() => {
    vi.resetAllMocks();
    // localStorage.clear();
    Object.defineProperty(global, 'localStorage', {
      value: {
        getItem: vi.fn(() => JSON.stringify({ ...initialState, lists: [{name: "Local"}] })),
        setItem: vi.fn(),
        clear: vi.fn(),
      } 
    });
    global.chrome = {
      tabs: {
        query: vi.fn(),
        sendMessage: vi.fn(),
      },
    };
    chromeTabsQueryMock = global.chrome.tabs.query;
    chromeTabsSendMessageMock = global.chrome.tabs.sendMessage;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("syncStorage: loads from localStorage and prefers remote if newer", async () => {
    const remoteData = { ...initialState, timestamp: 200, lists: [{ name: "Remote" }] };
    chromeTabsQueryMock.mockResolvedValue([{ id: 1 }]);
    chromeTabsSendMessageMock.mockResolvedValue({ success: true, data: remoteData });

    const result = await runThunk(syncStorage());

    expect(result.lists.length).toBe(1);
    expect(result.lists[0].name).toBe("Remote");
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it("syncStorage: loads from localStorage and prefers local if newer", async () => {
    const remoteData = { ...initialState, timestamp: -1, lists: [{ name: "Remote" }] };
    chromeTabsQueryMock.mockResolvedValue([{ id: 1 }]);
    chromeTabsSendMessageMock.mockResolvedValue({ success: true, data: remoteData });

    const result = await runThunk(syncStorage());

    expect(result.lists.length).toBe(1);
    expect(result.lists[0].name).toBe("Local");
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it("syncStorage: loads from localStorage and prefers local if newer (remote schema v0)", async () => {
    const remoteData = [{ name: "Remote" }]; // Old schema without timestamp
    localStorage.getItem = vi.fn(() => JSON.stringify({ ...initialState, timestamp: 100, lists: [] }));
    chromeTabsQueryMock.mockResolvedValue([{ id: 1 }]);
    chromeTabsSendMessageMock.mockResolvedValue({ success: true, data: remoteData });

    const result = await runThunk(syncStorage());

    expect(result.lists.length).toBe(0);
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it("syncStorage: loads from localStorage and prefers remote if newer (local schema v0)", async () => {
    const remoteData = { ...initialState, timestamp: 100, lists: [{ name: "Remote" }] };
    localStorage.getItem = vi.fn(() => JSON.stringify([ ...initialState.lists ]));
    chromeTabsQueryMock.mockResolvedValue([{ id: 1 }]);
    chromeTabsSendMessageMock.mockResolvedValue({ success: true, data: remoteData });

    const result = await runThunk(syncStorage());

    expect(result.lists.length).toBe(1);
    expect(result.lists[0].name).toBe("Remote");
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it("saveListsToStorage: saves lists and prefers local if newer", async () => {
    const lists = [{ name: "Local" }];
    const remoteData = { ...initialState, timestamp: -1, lists: [{ name: "Remote" }] };
    chromeTabsQueryMock.mockResolvedValue([{ id: 1 }]);
    chromeTabsSendMessageMock.mockResolvedValue({ success: true, data: remoteData });

    // Patch Date.now
    vi.spyOn(Date, "now").mockReturnValue(200);

    const result = await runThunk(saveListsToStorage(lists));

    expect(result.lists[0].name).toBe("Local");
    expect(result.timestamp).toBe(200);
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it("syncStorage: falls back to local if remote fails", async () => {
    chromeTabsQueryMock.mockRejectedValue(new Error("fail"));
    const result = await runThunk(syncStorage());

    expect(result).toEqual({ ...initialState, lists: [{name: "Local"}] });
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it("saveListsToStorage: falls back to local if remote fails", async () => {
    chromeTabsQueryMock.mockRejectedValue(new Error("fail"));
    const lists = [{ name: "Local" }];
    vi.spyOn(Date, "now").mockReturnValue(123);

    const result = await runThunk(saveListsToStorage(lists));

    expect(result.lists[0].name).toBe("Local");
    expect(result.timestamp).toBe(123);
    expect(localStorage.setItem).toHaveBeenCalled();
  });
});