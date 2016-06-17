const {app, globalShortcut, BrowserWindow} = require('electron');
const WebSocket = require('ws');


const WS_ADDRESS = "ws://localhost:8025/ws/echo";

// Local connection to Cytoscape app
let ws;

let isDevEnabled = false;

let mainWindow;

let block = false;

console.log("============= Starting Main2 ===============");


const MSG_SELECT_APP = {
  from: 'ndex',
  type: 'app',
  body: ''
};

const MSG_FOCUS = {
  from: "ndex",
  type: "focus",
  body: "Ndex focused "
};

function initWindow(appType) {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1150, height: 870,
    minHeight: 870, minWidth: 500,
    frame: true, alwaysOnTop:false
  });

  const dir = `${__dirname}`;
  mainWindow.loadURL('file://' + dir + '/webapp/' + appType + '/index.html');

  // Emitted when the window is closed.
  mainWindow.on('focus', () => {
    if (block) {
      return;
    }
    ws.send(JSON.stringify(MSG_FOCUS));
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function initSocket() {
  try {
    // Try Connection to server...
    ws = new WebSocket(WS_ADDRESS);

    ws.onopen = () => {
      ws.send(JSON.stringify(MSG_SELECT_APP));
    };

    // Listen for messages
    ws.onmessage = function (event) {
      let msgObj = JSON.parse(event.data);

      // Filter: ignore ndex messages
      if (msgObj.from === "ndex") {
        return;
      }

      switch (msgObj.type) {
        case 'app':
          console.log(msgObj);
          initWindow(msgObj.body);
          break;
        case "focus-success":
          // if(!mainWindow.isFocused()) {
          //   block = true;
          //   mainWindow.setAlwaysOnTop(true);
          //   mainWindow.show();
          //   mainWindow.focus();
          //   mainWindow.setAlwaysOnTop(false);
          //   block = false;
          // }
          break;
        case "focus":
          block = true;
          if(!mainWindow.isFocused()) {
            mainWindow.setAlwaysOnTop(true);
            mainWindow.showInactive();
            mainWindow.setAlwaysOnTop(false);
          }
          var msg = {
            from: "ndex",
            type: "focus-success",
            body: "Ndex focuse Success"
          };

          ws.send(JSON.stringify(msg));

          block = false;
          break;
      }
    };

    ws.onclose = function () {
      app.quit()
    };

    setInterval(function() {
      "use strict";
      let alive = {
        from: "ndex",
        type: "alive",
        body: "NDEx Main alive"
      };

      ws.send(JSON.stringify(alive));
    }, 120000);

  } catch (e) {
    console.log(e);
  }
}


function createWindow() {
  // Establish WS connection
  initSocket();
}


function addShortcuts() {
  globalShortcut.register('CommandOrControl+w', function () {
    console.log('Close (w) is pressed');
    app.quit()
  });

  // For dev tool
  globalShortcut.register('CommandOrControl+d', function () {
    console.log('Devtool');
    if (isDevEnabled) {
      mainWindow.webContents.closeDevTools();
      isDevEnabled = false;
    } else {
      mainWindow.webContents.openDevTools();
      isDevEnabled = true;
    }
  });
}

app.on('ready', () => {
  createWindow();
  addShortcuts();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  app.quit()
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
});
