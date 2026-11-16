
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("vertex", {
  getState: () => ipcRenderer.invoke("get-state"),
  newTab: () => ipcRenderer.invoke("new-tab"),
  navigate: (id, url) => ipcRenderer.invoke("navigate", id, url),
  activate: id => ipcRenderer.invoke("activate", id),
  close: id => ipcRenderer.invoke("close", id),
  back: () => ipcRenderer.invoke("back"),
  forward: () => ipcRenderer.invoke("forward"),
  reload: () => ipcRenderer.invoke("reload"),
  home: () => ipcRenderer.invoke("home"),

  onState: callback => {
    ipcRenderer.on("state", (_, data) => callback(data));
  }
});
