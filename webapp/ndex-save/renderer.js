const remote = require('electron').remote;
const dialog = require('electron').remote.dialog;
const {ipcRenderer} = require('electron');
const {BrowserWindow} = require('electron').remote;

// Main browser window
const win = remote.getCurrentWindow();

// For loading animation
const child = new BrowserWindow({
  parent: win, modal: true, show: false,
  width: 400, height: 400
});

const UUID_TAG = 'ndex:uuid'

const PRESET_PROPS = [
  'networkName', 'private',
  'author', 'organism',
  'disease', 'tissue',
  'rightsHolder', 'rights',
  'reference','description'
]

// Color theme of the UI
const THEME = {
  palette: {
    primary1Color: '#6E93B6',
    primary2Color: '#244060',
    primary3Color: '##EDEDED',
    accent1Color: '#D69121',
    accent2Color: '#E4E4E4',
    accent3Color: '##9695A6'
  }
}

const STYLE = {
  backgroundColor: '#EDEDED'
}


const HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
}

const MSG_ERROR = {
  title: 'Save Error:',
  type: 'error',
  buttons: ['Close'],
  message: 'Failed to save file, ',
  detail: 'Failed.'
};

const MSG_ERROR_CYREST = {
  title: 'Import Error:',
  type: 'error',
  buttons: ['Close'],
  message: 'Could not get properties from session',
  detail: 'Failed.'
};


// Default parameters (credentials for the application)
let options;

let isPrivate = true
let existingUuid = null


function fillForm(table) {
  const row = table.rows[0];
  existingUuid = row[UUID_TAG]

  console.log('** uuid:')
  console.log(row)

  return {
    UUID: row[UUID_TAG],
    networkName: row.name,
    private: true,
    toggleDisabled: false,
    author: row.author,
    organism: row.organism,
    disease: row.disease,
    tissue: row.tissue,
    rightsHolder: row.rightsHolder,
    rights: row.rights,
    reference: row.reference,
    description: row.description,
    theme: THEME,
    style: STYLE,

    onSave(newProps) {
      console.log(newProps);
      isPrivate = newProps.private
      showLoading()
      updateRootTable(options.rootSUID, newProps)
    }
  }
}


/**
 * Import Collection table from Cytoscape
 */
function getTable() {

  const params = {
    method: 'get',
    headers: HEADERS
  }

  const url = 'http://localhost:1234/v1/collections/' + options.rootSUID + '/tables/default'

  fetch(url, params)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        dialog.showMessageBox(win, MSG_ERROR_CYREST, () => {
          win.close()
        });
      }
    })
    .then(json => {
      win.setTitle('Save a Collection of Networks: ' + options.rootname);
      init(json);
    });
}


function createUpdateTable(props, suid) {
  const params = {
    key: 'SUID',
    dataKey: 'SUID',
    data: []
  };

  const entry = {
    SUID: parseInt(suid, 10)
  };

  for (let key of PRESET_PROPS) {
    console.log(key);
    const val = props[key];
    if (val !== undefined && val !== null && val !== '') {
        if(key === 'networkName') {
          entry['name'] = val;
        } else {
          entry[key] = val;
        }
    }
  }
  params.data.push(entry);

  return params;
}


/**
 * Update the network table of the Collection
 *
 * @param rootSuid
 * @param newProps
 * @returns {*}
 */
function updateRootTable(rootSuid, newProps) {
  const data = createUpdateTable(newProps, rootSuid);
  const params = {
    method: 'put',
    headers: HEADERS,
    body: JSON.stringify(data)
  }

  const url = 'http://localhost:1234/v1/collections/' + rootSuid + '/tables/default';
  fetch(url, params)
    .then(postCollection());
}


function init(table) {
  const cyto = CyFramework.config([NDExStore])
  const params = fillForm(table)
  cyto.render(NDExSave, document.getElementById('save'), params);
}


function addCloseButton() {
  document.getElementById('close').addEventListener('click', () => {
    win.close();
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
  let isUpdate = false

  let url = ndexServerAddress + '/rest/network/asCX';
  if(existingUuid !== null && existingUuid !== undefined) {
    url = url + '/' + existingUuid
    isUpdate = true
  }

  const XHR = new XMLHttpRequest();
  const FD = new FormData();
  const content = JSON.stringify(rawCX);
  const blob = new Blob([content], {type: 'application/octet-stream'});

  FD.append('CXNetworkStream', blob);

  XHR.addEventListener('load', evt => {
    console.log('Load listener:')
    console.log(evt);

    const resCode = evt.target.status

    console.log(resCode)
    if(resCode !== 200) {
      // Failed to load.
      saveFailed(evt)
      return
    }

    const newNdexId = evt.target.response;
    saveSuccess(newNdexId);
  });

  XHR.addEventListener('error', evt => {
    console.log('!!!!!!!!!!ERR listener:')
    console.log(evt);
    saveFailed(evt);
  });

  if(isUpdate) {
    XHR.open('PUT', url);
  } else {
    XHR.open('POST', url);
  }

  const auth = 'Basic ' + btoa(id + ':' + pass);
  XHR.setRequestHeader('Authorization', auth);
  XHR.send(FD);
}

function saveSuccess(ndexId) {

  const flagPrivate = 'PRIVATE';
  const flagPublic = 'PUBLIC';

  let visibility = flagPrivate

  if (isPrivate) {
    visibility = flagPrivate
  } else {
    visibility = flagPublic
  }

  const updateUrl = options.serverAddress + '/rest/network/' + ndexId + '/summary';
  const param = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: 'Basic ' + btoa(options.userName + ':' + options.userPass)
    },
    body: JSON.stringify({visibility: visibility})
  };

  fetch(updateUrl, param)
    .then(response => {
      if (response.ok) {
        // Assign UUID
        assignNdexId(ndexId)

        // Save the image:
        getImage(options.SUID, ndexId);

        win.close()
      } else {
        saveFailed(response);
      }
    });
}

function saveFailed(evt) {
  const errorMsg = MSG_ERROR
  errorMsg.detail = evt.target.response
  child.close()

  dialog.showMessageBox(errorMsg, () => {
    win.close()
  });
}

function assignNdexId(uuid) {
  // This should be assigned to the collection, not an individual network.

  const data = {
    key: 'SUID',
    dataKey: 'SUID',
    data: [
      {
        SUID: parseInt(options.rootSUID, 10),
        "ndex:uuid": uuid
      }
    ]
  }

  const params = {
    method: 'put',
    headers: HEADERS,
    body: JSON.stringify(data)
  }

  const url = 'http://localhost:1234/v1/collections/' + options.rootSUID + '/tables/default';
  fetch(url, params);
}

function postCollection() {
  const cxUrl = 'http://localhost:1234/v1/collections/' + options.rootSUID;
  fetch(cxUrl, {
    method: 'get',
    headers: HEADERS,
  }).then(response=> {
    return response.json();
  }).then(cx => {
    postCx(cx);
  });
}

function showLoading() {
  const gl = remote.getGlobal('sharedObj');
  const contentDir = gl.dir;
  child.loadURL('file://' + contentDir + '/webapp/ndex-save/waiting/index.html');
  child.once('ready-to-show', () => {
    child.show();
  });
}

function getImage(suid, uuid) {
  const url = 'http://localhost:1234/v1/networks/' + suid + '/views/first.png?h=2000';
  const imageUrl = 'http://ci-dev-serv.ucsd.edu:8081/image/png/' + uuid;

  const oReq = new XMLHttpRequest();
  oReq.open('GET', url, true);
  oReq.responseType = 'blob';

  oReq.onload = oEvent => {
    // To image cache
    const blob = oReq.response;
    const pReq = new XMLHttpRequest();
    pReq.open('POST', imageUrl, true);
    pReq.onload = evt => {
      child.close()
      win.close()
    };
    pReq.send(blob);
  };
  oReq.send();
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
