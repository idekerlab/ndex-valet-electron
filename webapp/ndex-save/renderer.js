const remote = require('electron').remote;
const dialog = require('electron').remote.dialog;
const {ipcRenderer} = require('electron');

// Main browser window
const win = remote.getCurrentWindow();

const THEME = {
  palette: {
    primary1Color: '#6E93B6',
      primary2Color: '#244060',
      primary3Color: '##EDEDED',
      accent1Color: '#D69121',
      accent2Color: '#E4E4E4',
      accent3Color: '##9695A6'
  }
};

const STYLE = {
  backgroundColor: '#EDEDED'
};

const HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

const MSG_ERROR = {
  title: 'Save Error:',
  type: 'error',
  buttons: ['Close'],
  message: 'Saving Failed, ',
  detail: 'Failed.'
};

const MSG_SUCCESS = {
  title: 'Save Success',
  type: 'info',
  buttons: ['OK'],
  message: 'Network Collection Saved ',
  detail: 'Successfully saved network collection to NDEx '
};

// Default parameters (credentials for the application)
let options;

function getTable() {

  const suid = options.SUID;
  console.log(options);

  const params = {
    method: 'get',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const url = 'http://localhost:1234/v1/collections/' + suid + '/tables/default';

  fetch(url, params)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
      }
    })
    .then(json => {
      console.log("got table");
      console.log(json);
    });
}

function init() {
  getTable();
  const cyto = CyFramework.config([NDExStore, NDExSave]);

  cyto.render(NDExSave, document.getElementById('save'), {
    theme: THEME,
    style: STYLE,

    properties: {
      'CyCatagory:Sample_1:field_1': 'AAAAAAAAAA'
    },

    onSave(newProps, isPublic) {
      console.log("@ SAVING...");
      console.log(newProps);
      console.log(isPublic);
      // postCollection();
    }
  });
}

function addCloseButton() {
  document.getElementById('close').addEventListener('click', () => {
    remote.getCurrentWindow().close();
  });
}

function startApp() {
  addCloseButton();
  init();
}


function postCx(rawCX) {
  const ndexServerAddress = options.serverAddress;
  const id = options.userName;
  const pass = options.userPass;

  const url = ndexServerAddress + '/rest/network/asCX';
  const XHR = new XMLHttpRequest();
  const FD = new FormData();
  const content = JSON.stringify(rawCX);
  const blob = new Blob([content], {type: 'application/octet-stream'});

  FD.append('CXNetworkStream', blob);

  XHR.addEventListener('load', evt => {
    const newNdexId = evt.target.response;
    console.log(newNdexId);
    saveSuccess(newNdexId);
  });

  XHR.addEventListener('error', evt => {
    console.log(evt);
    saveFailed(evt);
  });

  XHR.open('POST', url);

  const auth = 'Basic ' + btoa(id + ':' + pass);
  XHR.setRequestHeader('Authorization', auth);
  XHR.send(FD);
}

function saveSuccess(ndexId) {
  const updateUrl = options.serverAddress + '/rest/network/' + ndexId + '/summary';
  const param = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: 'Basic ' + btoa(options.userName + ':' + options.userPass)
    },
    body: JSON.stringify({ visibility: 'PUBLIC' })
  };

  fetch(updateUrl, param)
    .then(response => {
      if (response.ok) {
        dialog.showMessageBox(win, MSG_SUCCESS, () => {
          console.log('New Ndex ID: ' + ndexId);
          win.close();
        });
      } else {
        saveFailed(response);
      }
    });
}

function saveFailed(evt) {
  dialog.showMessageBox(win, MSG_ERROR, () => {
    console.log(evt);
    win.close();
  });
}

function postCollection() {
  const cxUrl = 'http://localhost:1234/v1/collections/' + options.SUID;
  fetch(cxUrl, {
    method: 'get',
    headers: HEADERS,
  }).then(response=> {
    return response.json();
  }).then(cx => {
    postCx(cx);
  });
}


// Start the application whenever the required parameters are ready.
ipcRenderer.on('ping', (event, arg) => {
  console.log(arg);
  console.log(event);
  options = arg;
  console.log('Options available:');
  console.log(options);

  startApp();
});
