const remote = require('electron').remote;

const {ipcRenderer} = require('electron');


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
    fetch(('public.ndexbio.org/rest/network/asCX' + networkId), {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cx)
    })
  }
});

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

