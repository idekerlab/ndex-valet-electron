const electron = require('electron');
const WebSocket = require('ws');

// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

let ws = new WebSocket("ws://localhost:8025/ws/echo")

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1000, height: 750})

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  // Setup WS

  ws.onopen = function() {
    app.on('browser-window-focus', function() {
      var msg = {
        from: "ndex",
        type: "focus",
        body: "Ndex focused "
      };

      ws.send(JSON.stringify(msg));
    });
  };

  //Listen for messages
  ws.onmessage = function(event) {
    var msg = JSON.parse(event.data)
    switch(msg.type) {
      case "focus":
        //Bring NDEx Valet into focus
        if(msg.from === "cy3") {
          mainWindow.show();
        }
        break;
    }
  }
}

app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    app.quit()
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})
