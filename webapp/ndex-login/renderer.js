const remote = require('electron').remote;
const dialog = require('electron').remote.dialog;

const win = remote.getCurrentWindow();

const cyto = CyFramework.config([NDExStore]);

const DEF_SERVER = 'http://dev2.ndexbio.org/rest/user/authenticate';

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

  const q = {
    method: 'get',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa(id + ':' + pw)
    }
  };

  fetch(DEF_SERVER, q)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        dialog.showMessageBox(win, MSG_ERROR);
      }
    })
    .then(json => {
      console.log("Response from NDEx");
      console.log(json);
      const msg = MSG_SUCCESS;
      msg.message = msg.message + json.firstName;
      dialog.showMessageBox(win, msg, () => {
        sendMessage(credential);
        win.close();
      });
    });
}

function sendMessage() {
  // Open WS connection and send credential to Cytoscape.

}
