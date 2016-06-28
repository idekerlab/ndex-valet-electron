const remote = require('electron').remote;
const dialog = require('electron').remote.dialog;
const {ipcRenderer} = require('electron');

let options;

const win = remote.getCurrentWindow();


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

  const cxUrl = 'http://localhost:1234/v1/collections/' + options.SUID;

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
      if (response.ok) {
        return response.json();
      } else {
        dialog.showMessageBox(win, MSG_ERROR, () => {
          console.log("** Failed to load!");
          win.close();
          return;
        });
      }
    }).then(json => {
      console.log(json);
      const msg = MSG_SUCCESS;
      console.log("---------- Save Success -------------");
      const uuid = json;
      fetch(options.serverAddress + '/rest/network/' + uuid + '/summary', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: 'Basic ' + btoa(options.userName + ':' + options.userPass)
        },
        body: JSON.stringify({ visibility: 'PUBLIC' })
      })
        .then(response => {
          console.log("---------- Got success -------------");
          console.log(response);
        });

      dialog.showMessageBox(win, msg, () => {
        console.log("** Success!");
        win.close();
      });
    });
  });
}

addCloseButton();

