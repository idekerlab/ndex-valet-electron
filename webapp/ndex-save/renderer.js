const remote = require('electron').remote;
const {ipcRenderer} = require('electron');

let options;


const POST_CX = {
  method: 'post',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  body: {}
};

ipcRenderer.on('ping', (event, arg) => {
  console.log('\n\n***************** Got IPC');
  console.log(arg);
  console.log(event);
  options = arg;
  console.log("Creating new entry==================");
  postCollection();
});


function addCloseButton() {
  document.getElementById('close').addEventListener('click', () => {
    remote.getCurrentWindow().close();
  });
}

let cyto = CyFramework.config([NDExSave]);

cyto.render(NDExSave, document.getElementById('save'), {
  //cxToSave is cx json as a string
  source: {},
  onSave: function (cx) {
    console.log("Creating new entry==================");
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

    const boundary = 'blob';
      console.log(cx);
      // let cxStr = '--' + boundary + '--\r\n' + JSON.stringify(cx);
      // cxStr = cxStr + '\r\n--' + boundary + '--\r\n';
      //
      // const req = new XMLHttpRequest();
      // req.open("POST", url, true);
      // req.setRequestHeader('Content-Type', 'multipart/form-data; boundary=blob');
      // req.setRequestHeader('Authorization', 'Basic ' + btoa(options.userName + ':' + options.userPass));
      // req.onload = function (e) {
      //   if (this.status == 200) {
      //     console.log(this.responseText);
      //   }
      // };
      // req.send(cxStr);


      fetch('http:localhost:5000/cx', {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'NDEx-Server': options.serverAddress,
          Authorization: 'Basic ' + btoa(options.userName + ':' + options.userPass)
        },
        body: JSON.stringify(cx)
      });
    }
  ).then(response=> {
    console.log(response);
  });
}

function getNetwork() {
  fetch('http://localhost:1234/v1/networks?source=url&format=cx&collection=From NDEx', {
    method: 'post',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(["http://dev2.ndexbio.org/rest/network/" + N.externalId + "/asCX"])
  }).then(function (response) {
    return response.json();
  }).then(function (result) {
    var suid = result[0]['networkSUID'];
    console.log('SUID: ' + suid);
    fetch('http://localhost:1234/v1/apply/layouts/force-directed/' + suid)
  });

}

addCloseButton();

