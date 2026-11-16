
const {
  app,
  BrowserWindow,
  WebContentsView,
  ipcMain
} = require("electron");

const path = require("path");
const fs = require("fs");
const { randomUUID } = require("crypto");

let win;
let tabs = [];
let activeId = null;

const HEADER = 140;

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:;">
<title>Vertex Browser</title>
<style>
:root {
--bg:#0c1422;
--panel:#142136;
--surface:#1c2a3e;
--border:#293a50;
--blue:#2684ff;
--text:#f2f6fc;
--muted:#8da2bd;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:Segoe UI,Arial;overflow:hidden}
button{cursor:pointer;font-family:inherit}
header{height:140px;background:#0c1422}
.tabbar{height:48px;background:#09111e;display:flex;align-items:center;padding:7px 12px 0;gap:8px}
#tabs{display:flex;gap:5px;flex:1;overflow:hidden}
.tab{height:37px;min-width:110px;max-width:220px;padding:0 10px;background:#142135;color:var(--muted);border-radius:9px 9px 0 0;display:flex;align-items:center;gap:8px;font-size:12px;border:1px solid transparent}
.tab.active{background:var(--panel);color:white;border-color:var(--border)}
.tab span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.tab button{background:transparent;color:var(--muted);border:0}
.newtab{background:transparent;border:0;color:white;font-size:23px;width:35px}
.nav{height:92px;display:flex;align-items:center;padding:0 20px;gap:13px;border-bottom:1px solid var(--border)}
.nav button{width:35px;height:35px;border:0;background:transparent;color:#b4c4d9;font-size:19px;border-radius:8px}
.nav button:hover{background:var(--surface)}
#addressform{display:flex;align-items:center;flex:1;height:43px;background:#17253a;border:1px solid var(--border);border-radius:12px;padding:0 13px;gap:10px}
#address{flex:1;min-width:0;background:transparent;border:0;outline:0;color:white;font-size:14px}
main{position:absolute;top:140px;left:0;width:100%;height:calc(100% - 140px);overflow:auto;background:radial-gradient(ellipse at 50% 35%,#15345a55,transparent 55%),var(--bg)}
.content{width:min(750px,90%);margin:auto;padding-top:clamp(55px,11vh,115px)}
.brand{text-align:center;margin-bottom:38px}
.logo{width:66px;height:66px;margin:0 auto 13px;border-radius:20px;background:linear-gradient(135deg,#2684ff,#1452b7);display:grid;place-items:center;font-size:38px;font-weight:800;box-shadow:0 10px 40px #2684ff30}
h1{font-size:43px;letter-spacing:9px;margin:0}
.brand p{color:var(--muted);font-size:13px}
#searchform{height:57px;display:flex;align-items:center;gap:14px;padding:0 19px;background:#17253a;border:1px solid var(--border);border-radius:16px}
#searchform:focus-within{border-color:var(--blue)}
#search{flex:1;min-width:0;background:transparent;border:0;outline:0;color:white;font-size:15px}
#searchform button{background:var(--blue);color:white;border:0;width:35px;height:35px;border-radius:10px;font-size:19px}
#shortcuts{display:grid;grid-template-columns:repeat(3,1fr);gap:17px;margin-top:38px}
.shortcut{min-height:125px;background:var(--panel);border:1px solid var(--border);border-radius:16px;color:white;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:12px;position:relative;transition:.2s}
.shortcut:hover{background:#1d304a;border-color:var(--blue);transform:translateY(-3px)}
.shortlogo{height:45px;width:45px;border-radius:13px;background:var(--blue);display:grid;place-items:center;font-size:20px;font-weight:bold;overflow:hidden}
.shortlogo img{height:100%;width:100%;object-fit:contain}
.shortname{font-size:13px;font-weight:600}
.remove{position:absolute;right:8px;top:7px;background:transparent;border:0;color:#8295ad;opacity:0}
.shortcut:hover .remove{opacity:1}
footer{display:flex;justify-content:space-between;margin-top:65px;padding-bottom:25px;font-size:10px;color:#62758e;letter-spacing:1px}
.overlay{position:fixed;inset:0;background:#000a;z-index:100;display:grid;place-items:center}
.hidden{display:none!important}
.modal{width:min(420px,90%);background:#17253a;border:1px solid var(--border);border-radius:18px;padding:25px}
.modalhead{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.modal h2{font-size:20px;margin:0}
.modal label{display:block;font-size:12px;color:var(--muted);margin:15px 0 7px}
.modal input{width:100%;height:42px;background:#0e1929;border:1px solid var(--border);border-radius:9px;padding:0 12px;color:white;outline:0}
.actions{display:flex;justify-content:flex-end;gap:10px;margin-top:22px}
.actions button{border:0;border-radius:8px;padding:10px 15px;font-weight:600}
.primary{background:var(--blue);color:white}
.secondary{background:#293b52;color:white}
#error{font-size:12px;color:#ff7777}
@media(max-width:600px){#shortcuts{grid-template-columns:repeat(2,1fr)}}
</style>
</head>
<body>
<header>
<div class="tabbar"><div id="tabs"></div><button class="newtab" id="newtab">+</button></div>
<div class="nav">
<button id="back" title="Back">←</button>
<button id="forward" title="Forward">→</button>
<button id="reload" title="Refresh">↻</button>
<button id="home" title="Home">⌂</button>
<form id="addressform">
<span>⌕</span>
<input id="address" placeholder="Search Google or enter a URL" autocomplete="off">
<button type="submit" style="color:#2684ff">→</button>
</form>
<button id="fullscreen" title="Fullscreen">⛶</button>
</div>
</header>
<main id="homepage">
<div class="content">
<div class="brand">
<div class="logo">V</div>
<h1>VERTEX</h1>
<p>Your internet. Your workspace.</p>
</div>
<form id="searchform">
<span style="color:#8da2bd;font-size:24px">⌕</span>
<input id="search" placeholder="Search the web..." autocomplete="off">
<button>→</button>
</form>
<div id="shortcuts"></div>
<footer><span>VERTEX BROWSER</span><span>VERSION 1.0</span></footer>
</div>
</main>
<div class="overlay hidden" id="overlay">
<div class="modal">
<div class="modalhead">
<h2>Add shortcut</h2>
<button id="close" style="background:none;border:0;color:white;font-size:24px">×</button>
</div>
<label>Website name</label><input id="name" placeholder="e.g. YouTube">
<label>Website URL</label><input id="url" placeholder="https://example.com">
<label>Logo image URL (optional)</label><input id="icon" placeholder="https://example.com/logo.png">
<div class="actions">
<button class="secondary" id="cancel">Cancel</button>
<button class="primary" id="save">Add shortcut</button>
</div>
<p id="error"></p>
</div>
</div>
<script>
const $=id=>document.getElementById(id);
const api=window.vertex;
let state={tabs:[],activeId:null};
let shortcuts=JSON.parse(localStorage.getItem("vertex-shortcuts")||"null")||[
{name:"Vertex Login",url:"https://classlink02.vercel.app/",letter:"V"},
{name:"Vertex Free",url:"https://vertexrevisionhub.vercel.app/",letter:"VR"}
];
function activeTab(){return state.tabs.find(t=>t.id===state.activeId)}
function render(){
$("tabs").replaceChildren();
state.tabs.forEach(t=>{
let el=document.createElement("div");el.className="tab"+(t.active?" active":"");
let title=document.createElement("span");title.textContent=t.title||"New Tab";
let close=document.createElement("button");close.textContent="×";
close.onclick=e=>{e.stopPropagation();api.close(t.id)};
el.append(title,close);el.onclick=()=>api.activate(t.id);$("tabs").append(el);
});
let t=activeTab();
if(t){
$("homepage").classList.toggle("hidden",!t.home);
$("address").value=t.home?"":t.url||"";
}
}
api.onState(s=>{state=s;render()});
api.getState().then(s=>{state=s;render()});
function go(value){let t=activeTab();if(t&&value.trim())api.navigate(t.id,value.trim())}
$("addressform").onsubmit=e=>{e.preventDefault();go($("address").value)};
$("searchform").onsubmit=e=>{e.preventDefault();go($("search").value)};
$("newtab").onclick=()=>api.newTab();
$("back").onclick=()=>api.back();
$("forward").onclick=()=>api.forward();
$("reload").onclick=()=>api.reload();
$("home").onclick=()=>api.home();
$("fullscreen").onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
function renderShortcuts(){
$("shortcuts").replaceChildren();
shortcuts.forEach((s,i)=>{
let card=document.createElement("div");card.className="shortcut";
let logo=document.createElement("div");logo.className="shortlogo";
if(s.icon){
let img=document.createElement("img");img.src=s.icon;
img.onerror=()=>{img.remove();logo.textContent=s.letter||s.name[0]};
logo.append(img);
}else logo.textContent=s.letter||s.name[0];
let name=document.createElement("span");name.className="shortname";name.textContent=s.name;
let remove=document.createElement("button");remove.className="remove";remove.textContent="×";
remove.onclick=e=>{e.stopPropagation();shortcuts.splice(i,1);save();renderShortcuts()};
card.append(logo,name,remove);card.onclick=()=>go(s.url);$("shortcuts").append(card);
});
let add=document.createElement("button");add.className="shortcut";
let logo=document.createElement("div");logo.className="shortlogo";logo.textContent="+";
let name=document.createElement("span");name.className="shortname";name.textContent="Add shortcut";
add.append(logo,name);add.onclick=()=>{$("overlay").classList.remove("hidden");$("name").focus()};
$("shortcuts").append(add);
}
function save(){localStorage.setItem("vertex-shortcuts",JSON.stringify(shortcuts))}
function closeModal(){$("overlay").classList.add("hidden");["name","url","icon"].forEach(id=>$(id).value="");$("error").textContent=""}
$("close").onclick=$("cancel").onclick=closeModal;
$("save").onclick=()=>{
let name=$("name").value.trim(),url=$("url").value.trim(),icon=$("icon").value.trim();
if(!name||!url){$("error").textContent="Enter a name and URL.";return}
if(!/^https?:\\/\\//i.test(url))url="https://"+url;
try{if(!["http:","https:"].includes(new URL(url).protocol))throw Error()}catch{$("error").textContent="Invalid website URL.";return}
if(icon){try{if(!["http:","https:"].includes(new URL(icon).protocol))throw Error()}catch{$("error").textContent="Invalid image URL.";return}}
shortcuts.push({name,url,icon,letter:name.slice(0,2).toUpperCase()});save();renderShortcuts();closeModal();
};
document.addEventListener("keydown",e=>{
if(e.key==="Escape")closeModal();
if(e.ctrlKey&&e.key.toLowerCase()==="t"){e.preventDefault();api.newTab()}
if(e.ctrlKey&&e.key.toLowerCase()==="w"){e.preventDefault();let t=activeTab();if(t)api.close(t.id)}
if(e.ctrlKey&&e.key.toLowerCase()==="l"){e.preventDefault();$("address").focus();$("address").select()}
});
renderShortcuts();
</script>
</body>
</html>`;

function sendState() {
  if (!win || win.isDestroyed()) return;

  win.webContents.send("state", {
    activeId,
    tabs: tabs.map(t => ({
      id: t.id,
      title: t.title,
      url: t.url,
      home: !t.view,
      active: t.id === activeId
    }))
  });
}

function current() {
  return tabs.find(t => t.id === activeId);
}

function resizeViews() {
  if (!win) return;

  const { width, height } = win.getContentBounds();

  for (const tab of tabs) {
    if (!tab.view) continue;

    tab.view.setBounds(tab.id === activeId ? {
      x: 0,
      y: HEADER,
      width,
      height: Math.max(0, height - HEADER)
    } : {
      x: 0,
      y: HEADER,
      width: 0,
      height: 0
    });
  }
}

function normalise(input) {
  input = String(input || "").trim();
  if (!input) return null;

  if (/\s/.test(input) || !input.includes(".")) {
    return "https://www.google.com/search?q=" +
      encodeURIComponent(input);
  }

  if (!/^https?:\/\//i.test(input)) {
    input = "https://" + input;
  }

  try {
    const parsed = new URL(input);
    if (!["https:", "http:"].includes(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    return "https://www.google.com/search?q=" +
      encodeURIComponent(input);
  }
}

function createTab(url) {
  const tab = {
    id: randomUUID(),
    title: "New Tab",
    url: "",
    view: null
  };

  tabs.push(tab);
  activeId = tab.id;

  if (url) navigate(tab.id, url);
  else {
    resizeViews();
    sendState();
  }

  return tab.id;
}

function navigate(id, input) {
  const tab = tabs.find(t => t.id === id);
  if (!tab) return;

  const url = normalise(input);
  if (!url) return;

  if (!tab.view) {
    tab.view = new WebContentsView({
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    });

    win.contentView.addChildView(tab.view);

    const contents = tab.view.webContents;

    contents.on("page-title-updated", (_, title) => {
      tab.title = title || "New Tab";
      sendState();
    });

    contents.on("did-navigate", (_, newUrl) => {
      tab.url = newUrl;
      sendState();
    });

    contents.on("did-navigate-in-page", (_, newUrl) => {
      tab.url = newUrl;
      sendState();
    });

    contents.setWindowOpenHandler(({ url: target }) => {
      const safe = normalise(target);
      if (safe) createTab(safe);
      return { action: "deny" };
    });

    contents.on("will-navigate", (event, target) => {
      try {
        if (!["http:", "https:"].includes(new URL(target).protocol)) {
          event.preventDefault();
        }
      } catch {
        event.preventDefault();
      }
    });
  }

  activeId = id;
  tab.url = url;
  tab.title = "Loading...";

  resizeViews();
  sendState();

  tab.view.webContents.loadURL(url).catch(() => {
    tab.title = "Page unavailable";
    sendState();
  });
}

function closeTab(id) {
  const index = tabs.findIndex(t => t.id === id);
  if (index < 0) return;

  const tab = tabs[index];

  if (tab.view) {
    win.contentView.removeChildView(tab.view);
    tab.view.webContents.close();
  }

  tabs.splice(index, 1);

  if (!tabs.length) {
    createTab();
    return;
  }

  if (activeId === id) {
    activeId = tabs[Math.min(index, tabs.length - 1)].id;
  }

  resizeViews();
  sendState();
}

function home() {
  const tab = current();
  if (!tab) return;

  if (tab.view) {
    win.contentView.removeChildView(tab.view);
    tab.view.webContents.close();
    tab.view = null;
  }

  tab.url = "";
  tab.title = "New Tab";

  resizeViews();
  sendState();
}

function createWindow() {
  win = new BrowserWindow({
    width: 1450,
    height: 900,
    minWidth: 850,
    minHeight: 600,
    backgroundColor: "#0c1422",
    title: "Vertex Browser",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadFile(path.join(__dirname, "index.html"));
  win.on("resize", resizeViews);
  win.on("closed", () => { win = null; });
}

app.whenReady().then(() => {
  fs.writeFileSync(path.join(__dirname, "index.html"), html);

  ipcMain.handle("get-state", () => ({
    activeId,
    tabs: tabs.map(t => ({
      id: t.id,
      title: t.title,
      url: t.url,
      home: !t.view,
      active: t.id === activeId
    }))
  }));

  ipcMain.handle("new-tab", () => createTab());
  ipcMain.handle("navigate", (_, id, url) => navigate(id, url));
  ipcMain.handle("activate", (_, id) => {
    if (tabs.some(t => t.id === id)) {
      activeId = id;
      resizeViews();
      sendState();
    }
  });
  ipcMain.handle("close", (_, id) => closeTab(id));
  ipcMain.handle("home", home);

  ipcMain.handle("back", () => {
    const t = current();
    if (t?.view?.webContents.canGoBack()) {
      t.view.webContents.goBack();
    }
  });

  ipcMain.handle("forward", () => {
    const t = current();
    if (t?.view?.webContents.canGoForward()) {
      t.view.webContents.goForward();
    }
  });

  ipcMain.handle("reload", () => {
    const t = current();
    if (t?.view) t.view.webContents.reload();
  });

  createWindow();
  createTab();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      createTab();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

