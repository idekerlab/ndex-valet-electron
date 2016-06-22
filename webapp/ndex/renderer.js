const remote = require('electron').remote;

const CLOSE_BUTTON_ID = 'close';

const CYREST_CALL = {
  NETWORKS: 'http://localhost:1234/v1/networks' };


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



function createNetworkList(idList) {

  let list = [];

  idList.map( id => {
    let source = 'http://dev2.ndexbio.org/rest/network/' + id.externalId + '/asCX';
    let entry = {
      source_location: source,
      source_method: 'GET',
      ndex_uuid: id.externalId
    };
    list.push(entry);
  });

  return list;
}

function getCyRestQuery(query, ids) {
  if (query === 'import') {
    return {
      method: 'post',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json' },
      body: JSON.stringify(createNetworkList(ids))
    };
  }
}

function init() {
  // Create the framework instance
  const cyto = CyFramework.config([NDExValet, NDExStore]);

  // Render NDEx Valet into the div
  cyto.render(NDExValet, document.getElementById('valet'), {
      onLoad: function (networkIds) {
        const q = getCyRestQuery('import', networkIds);
        console.log("Calling:");
        console.log(q);
        fetch(CYREST_CALL.NETWORKS, q);
      }
    }
  );

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
