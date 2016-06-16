const {app, globalShortcut, BrowserWindow} = require('electron');
const WebSocket = require('ws');


const WS_ADDRESS = "ws://localhost:8025/ws/echo";

// Local connection to Cytoscape app
let ws;

let isDevEnabled = false;

let mainWindow;

let block = false;



function createWindow() {
  // Establish WS connection
  try {
    // Try Connection to server...
    ws = new WebSocket(WS_ADDRESS);

    ws.onopen = function () {
      mainWindow.on('focus', () => {
        if (block) {
          return;
        }

        var msg = {
          from: "ndex",
          type: "focus",
          body: "Ndex focused "
        };
        ws.send(JSON.stringify(msg));
      });
    };

    //Listen for messages
    ws.onmessage = function (event) {
      let msgObj = JSON.parse(event.data);

      // Filter: ignore ndex messages
      if (msgObj.from === "ndex") {
        return;
      }

      switch (msgObj.type) {
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

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1150, height: 870,
    minHeight: 870, minWidth: 500,
    frame: true, alwaysOnTop:false
  });

  mainWindow.loadURL(`file://${__dirname}/webapp/ndex/index.html`);

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    mainWindow = null
  })
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
