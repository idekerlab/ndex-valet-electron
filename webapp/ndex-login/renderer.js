const remote = require('electron').remote;
const dialog = require('electron').remote.dialog;
const WebSocket = require('ws');

const win = remote.getCurrentWindow();

const LOGIN = {
  from: 'ndex',
  type: 'login',
  body: '',
  options: {}
};

const cyto = CyFramework.config([NDExStore]);

const DEF_SERVER = 'http://dev2.ndexbio.org/rest';
const DEF_NAME = "Dev2";

const AUTH_API = '/user/authenticate';

const MSG_ERROR = {
  title: 'Error:',
  type: 'info',
  buttons: ['Retry'],
  message: 'Failed to login, ',
  detail: 'Please check your inputs and try again.'
};

const MSG_SUCCESS = {
  title: 'NDEx Replied:',
  type: 'info',
  buttons: ['OK'],
  message: 'Welcome Back, ',
  detail: 'Status: Login Success'
};


cyto.render(NDExLogin, document.getElementById('valet'), {
  onSubmit: () => {
    const state = cyto.getStore('ndex').server.toJS();
    console.log(state);
    connect(state);
  }
});


function connect(credential) {
  const id = credential.userName;
  const pw = credential.userPass;
  let serverUrl = credential.serverAddress;

  if(serverUrl === undefined || serverUrl === '') {
    serverUrl = DEF_SERVER;
  }

  if(credential.serverName === undefined || credential.serverName === '') {
    credential.serverName = DEF_NAME;
  }

  // Add API addition
  credential.serverAddress = serverUrl;
  serverUrl = serverUrl + AUTH_API;

  const q = {
    method: 'get',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa(id + ':' + pw)
    }
  };

  fetch(serverUrl, q)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        dialog.showMessageBox(win, MSG_ERROR);
      }
    })
    .then(json => {
      console.log(json);
      const msg = MSG_SUCCESS;
      msg.message = msg.message + json.firstName;
      dialog.showMessageBox(win, msg, () => {
        sendMessage(credential);
      });
    });
}


function sendMessage(credential) {
  // Open WS connection and send credential to Cytoscape.
  const ws = new WebSocket('ws://localhost:8025/ws/echo');

  ws.onopen = function () {
    const loginSuccess = LOGIN;
    loginSuccess.options= credential;
    ws.send(JSON.stringify(loginSuccess));
    ws.close();
    win.close();
  };
}
