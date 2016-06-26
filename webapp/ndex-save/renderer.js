const remote = require('electron').remote;
const dialog = require('electron').remote.dialog;

const {ipcRenderer} = require('electron');

let options;

// Main window
const win = remote.getCurrentWindow();


const POST_CX = {
  method: 'post',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  body: {}
};

// For Dialogs

const MSG_ERROR = {
  title: 'Save Error:',
  type: 'error',
  buttons: ['Retry'],
  message: 'Failed to login, ',
  detail: 'Please check your inputs and try again.'
};

const MSG_SUCCESS = {
  title: 'Save Success',
  type: 'info',
  buttons: ['OK'],
  message: 'Network Collection Saved ',
  detail: 'Successfully saved network collection to NDEx '
};

ipcRenderer.on('ping', (event, arg) => {
  console.log(arg);
  console.log(event);
  options = arg;

  console.log('Options available:');
  console.log(options);
});


function addCloseButton() {
  document.getElementById('close').addEventListener('click', () => {
    remote.getCurrentWindow().close();
  });
}

const cyto = CyFramework.config([NDExStore, NDExSave]);

cyto.render(NDExSave, document.getElementById('save'), {
  //cxToSave is cx json as a string
  onSave: function (cx) {
    console.log("New Creating new entry==================");
    postCollection();
  }
});


function postCollection() {
  const q = {
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa(options.userName + ':' + options.userPass)
    }
  };

  const url = options.serverAddress + '/network/asCX';

  const cxUrl = 'http://localhost:1234/v1/collections/' + options.SUID;
  console.log(cxUrl);

  fetch(cxUrl, {
    method: 'get',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }).then(response=> {
    return response.json();
  }).then(cx => {

    console.log(cx);

    fetch('http://52.11.148.107:5000/cx', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'NDEx-Server': options.serverAddress,
        Authorization: 'Basic ' + btoa(options.userName + ':' + options.userPass)
      },
      body: JSON.stringify(cx)
    }).then(response => {
      return response.json();
    }).then(json => {
      console.log(json);
      const msg = MSG_SUCCESS;
      msg.message = msg.message + json.firstName;
      dialog.showMessageBox(win, msg, () => {
        console.log("** Success!");
        win.close();

      });
    });
  });
}

addCloseButton();

