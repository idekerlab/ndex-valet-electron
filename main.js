// Logging
const LOGGER = require('winston');

const APP_NAME_VALET = 'ndex';
const APP_NAME_SAVE = 'ndex-save';
const APP_NAME_LOGIN = 'ndex-login';

const APP_CONFIG_VALET = require('./webapp/ndex/config');
const APP_CONFIG_SAVE = require('./webapp/ndex-save/config');
const APP_CONFIG_LOGIN = require('./webapp/ndex-login/config');

console.log(APP_CONFIG_VALET);

const APP_CONFIG_MAP = new Map();
APP_CONFIG_MAP.set(APP_NAME_VALET, APP_CONFIG_VALET);
APP_CONFIG_MAP.set(APP_NAME_SAVE, APP_CONFIG_SAVE);
APP_CONFIG_MAP.set(APP_NAME_LOGIN, APP_CONFIG_LOGIN);

// Required Electron components
const { app, globalShortcut, BrowserWindow } = require('electron');

global.sharedObj = { temp: app.getPath('temp') };
console.log('==========temp');
console.log(global.sharedObj);

// For duplex communication
const WebSocket = require('ws');

// TODO: make this injectable
const WS_ADDRESS = 'ws://localhost:8025/ws/echo';

let ws;
let mainWindow;
let opts;

let block = false;
let isDevEnabled = false;


const MSG_SELECT_APP = {
  from: 'ndex',
  type: 'app',
  body: ''
};

const MSG_FOCUS = {
  from: 'ndex',
  type: 'focus',
  body: 'Ndex focused'
};

const MSG_SAVE = {
  from: 'ndex',
  type: 'save',
  body: ''
};

function initLogger() {
  LOGGER.add(LOGGER.transports.File, { filename: 'electron-app.log' });
  LOGGER.level = 'debug';
  LOGGER.log('debug', 'Starting app');
}

function initWindow(appType) {
  // Create the browser window.
  LOGGER.log('debug', 'Target app = ' + appType);

  mainWindow = new BrowserWindow(APP_CONFIG_MAP.get(appType));
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('ping', opts);
  });

  const dir = `${__dirname}`;
  global.sharedObj.dir = dir;
  
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

  if (appType === APP_NAME_SAVE) {
    initSave();
  }
}

function initSave() {
  ws.send(JSON.stringify(MSG_SAVE));
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

      LOGGER.log("debug", '$$$$$$$$MSG: ');
      LOGGER.log('debug', msgObj);

      // Filter: ignore ndex messages
      if (msgObj.from === "ndex") {
        return;
      }

      switch (msgObj.type) {
        case 'app':
          LOGGER.log("debug", "APP Signal:  ==================");
          LOGGER.log("debug", msgObj);
          opts = msgObj.options;
          // const tmpPath = app.getPath('temp');
          // console.log('==========temp');
          // console.log(tmpPath);
          // opts['tempPath'] = tmpPath;

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
        case "save":
          opts = msgObj.options;
          // LOGGER.log("debug", 'Fire2: Got Save Params: ' + opts);
          // mainWindow.setTitle('Save to NDEx: ' + opts.name);
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
  initLogger();
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
