const {app, globalShortcut, BrowserWindow} = require('electron')
const WebSocket = require('ws')


const WS_ADDRESS = "ws://localhost:8025/ws/echo"

// Local connection to Cytoscape app
let ws

let mainWindow

function createWindow () {

  // Establish WS connection
  try {
    // Try Connection to server...
    ws = new WebSocket(WS_ADDRESS)

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
    };

    ws.onclose = function() {
      app.quit()
    };

  } catch (e) {
    console.log(e);
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1000, height: 780})
  mainWindow.loadURL(`file://${__dirname}/ndex/index.html`)
  mainWindow.webContents.openDevTools();


  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    mainWindow = null
  })

}

function addShortcuts() {
  globalShortcut.register('CommandOrControl+w', function() {
    console.log('Close (w) is pressed');
    app.quit()
  });
}

app.on('ready', () => {
  createWindow()
  addShortcuts()
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})
