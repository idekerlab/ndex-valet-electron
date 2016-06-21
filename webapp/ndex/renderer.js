const remote = require('electron').remote;

const CLOSE_BUTTON_ID = 'close';

const ID_COLUMN = {
  name: 'NDEX_UUID',
  type: 'String',
  immutable: true,
  local: true };

const EMPTY_NET = {
  data: {},
  elements: {
    nodes: [],
    edges: []
  }
};

function addCloseButton() {
  document.getElementById(CLOSE_BUTTON_ID)
    .addEventListener('click', () => {
      remote.getCurrentWindow().close();
    });

  init();
}

let cySocket;

function buildQuery(type) {
  let query = {};

  switch (type) {
    case 'column': {
      const createCol = {
        method: 'post',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([ID_COLUMN])
      };
      query = createCol;
      break;
    }
    case 'uuid': {
      const updateTable = {
        method: 'put',
        headers: {
          "Accept": 'application/json',
          "Content-Type": 'application/json'
        },
        body: []
      };
      query = updateTable;

      break;
    }
    default: { break; }
  }

  return query;
}



function createNetworkList(networkUuid) {
  "use strict";
  let source = 'http://dev2.ndexbio.org/rest/network/' + networkUuid + '/asCX';
  return {
    source_location: source,
    source_method: 'GET',
    ndex_uuid: networkUuid
  };
}

function init() {
  //Create the framework instance
  var cyto = CyFramework.config([NDExValet, NDExStore])

  // Render NDEx Valet into the div
  cyto.render(NDExValet, document.getElementById('valet'), {
    onLoad: function (networkIds) {
      console.log(networkIds)
      fetch('http://localhost:1234/v1/networks?collection=From NDEx', {
        method: 'post',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json' },
        body: JSON.stringify([EMPTY_NET])
      });

      networkIds.map(function (N) {
        console.log("----------------");
        let entry = createNetworkList(N.externalId);
        console.log(entry);

        let suid = null;

        fetch('http://localhost:1234/v1/networks?source=url&format=cx&collection=From NDEx', {

          method: 'post',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json' },
          // body: JSON.stringify(['http://dev2.ndexbio.org/rest/network/' + N.externalId + '/asCX'])
          body: JSON.stringify([entry])
        }).then(response => {
          return response.json()
        }).then(function (result) {
          suid = result[0]['networkSUID'];
          console.log('SUID: ' + suid);
          fetch('http://localhost:1234/v1/apply/layouts/force-directed/' + suid)
            .then(() => {
              let q1 = buildQuery('column');
              fetch('http://localhost:1234/v1/networks/' + suid + '/tables/defaultnetwork/columns', q1)
                .then(() => {
                  let q2 = buildQuery('uuid');
                  q2.body = JSON.stringify([]);
                  fetch('http://localhost:1234/v1/networks/' + suid + '/tables/defaultnetwork/columns/NDEX_UUID?default=' + N.externalId, q2);
                });
            });
        });

      });
    }
  });


  /////////////////////////////////////////////////////
  // The following is the Electron app dependent section.
  /////////////////////////////////////////////////////


  var MESSAGES = {
    CONNECT: {
      from: 'ndex',
      type: 'connected',
      body: ''
    },

    ALIVE: {
      from: 'ndex',
      type: 'alive',
      body: 'from renderer'
    }
  };

  var MESSAGE_TYPE = {
    QUERY: 'query'
  };

  //Connect to Cytoscape with a web socket
  cySocket = new WebSocket('ws://localhost:8025/ws/echo');

  cySocket.onopen = function () {
    cySocket.send(JSON.stringify(MESSAGES.CONNECT));
  };

  //Listen for messages
  cySocket.onmessage = function (event) {
    var msg = JSON.parse(event.data);

    if (msg.from !== 'cy3') {
      return;
    }

    switch (msg.type) {
      case MESSAGE_TYPE.QUERY:
        let query = msg.body;
        console.log('New query from Cy3: ' + query);
        cyto.dispatch(NDExValet.fieldActions.updateQuery(query));
        cyto.dispatch(NDExStore.luceneActions.searchFor(query));
        break;
    }
  }

  // Keep alive by sending notification...
  setInterval(function () {
    cySocket.send(JSON.stringify(MESSAGES.ALIVE));
  }, 120000);

}


addCloseButton();
