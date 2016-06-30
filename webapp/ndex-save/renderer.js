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

// Cytoscape preset properties
const PRESET_NAME = 'name';

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

const MSG_ERROR_CYREST = {
  title: 'Import Error:',
  type: 'error',
  buttons: ['Close'],
  message: 'Could not get properties from session',
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
  const params = {
    method: 'get',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const rootSUID = options.rootSUID;
  const url = 'http://localhost:1234/v1/collections/' + rootSUID + '/tables/default';

  console.log(options);

  fetch(url, params)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        dialog.showMessageBox(win, MSG_ERROR_CYREST, () => {
          win.close();
        });
      }
    })
    .then(json => {
      console.log(json.rows);
      win.setTitle('Save Collection of Networks: ' + options.rootname);
      init(json);
    });
}

function processTable(table) {
  const entries = table.rows[0];
  console.log(entries);
  const keys = Object.keys(entries);
  const newKeys = keys.map(key=>{
    return 'CyCatagory:Sample 1:' + key;
  });
  console.log(newKeys);
  const vals = {
    'CyCatagory:Sample 1:data source': 'IntAct',
    'CyCatagory:Sample 1:description': 'PPI network for yeast',
    'CyCatagory:Sample 1:related pathways': 'Glycolysis / Gluconeogenesis, Citrate cycle (TCA cycle), Pentose phosphate pathway'
  };
  return vals;
}

function createTable(props) {

  const params = {
    key:"SUID",
    dataKey: "SUID",
    data: []
  };

  const entry = {
    SUID: parseInt(options.rootSUID, 10)
  };

  const keys = Object.keys(props);
  for (let key of keys) {
    console.log(key);
    const val = props[key];
    if(val !== undefined && val !== null && val !== '') {
      console.log(val);
      entry[key] = val[0];
    }
  }
  params.data.push(entry);
  return params;
}

function updateCytoscape(data) {
  const params = {
    method: 'put',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };

  const rootSUID = options.rootSUID;
  const url = 'http://localhost:1234/v1/collections/' + rootSUID + '/tables/default';

  fetch(url, params)
    .then(response => {
      if (response.ok) {
        console.log('==OK!');
      } else {
        dialog.showMessageBox(win, MSG_ERROR_CYREST, () => {
          win.close();
        });
      }
    });
}


function init(table) {
  processTable(table);

  const cyto = CyFramework.config([NDExStore, NDExSave]);

  cyto.render(NDExSave, document.getElementById('save'), {
    theme: THEME,
    style: STYLE,

    properties: processTable(table),

    onSave(newProps, isPublic) {
      console.log("@ SAVING...");
      console.log(newProps);
      console.log(isPublic);

      const forPut = createTable(newProps);
      console.log(forPut);
      updateCytoscape(forPut);
      console.log('----------- Done --------------');

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
  getTable();
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
