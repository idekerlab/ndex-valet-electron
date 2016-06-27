const remote = require('electron').remote;
const {Map} = require('immutable');

const WS_SERVER = 'ws://localhost:8025/ws/echo';

const CLOSE_BUTTON_ID = 'close';

const HEADERS = {
  Accept: 'application/json',
    'Content-Type': 'application/json'
};

const CYREST = {
  IMPORT_NET: 'http://localhost:1234/v1/networks?format=cx&source=url'
};

const DEF_DEV_NAME = 'NDEx Dev 2';
const DEF_DEV_SERVER = 'http://dev2.ndexbio.org';

const DEF_PUBLIC_NAME = 'NDEx Public';
const DEF_PUBLIC_SERVER = 'http://public.ndexbio.org';

const defaultState = Map({
  serverName: DEF_DEV_NAME,
  serverAddress: DEF_DEV_SERVER,
  userName: "",
  userPass: "",
  loggedIn: false
});

// Name of the redux store
const STORE_NDEX = 'ndex';

const MESSAGES = {
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

const ID_COLUMN = {
  name: 'NDEX_UUID',
  type: 'String',
  immutable: true,
  local: true
};

const EMPTY_NET = {
  data: {},
  elements: {
    nodes: [],
    edges: []
  }
};

// CytoFramework obj.
let cyto;

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
    case 'column':
    {
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
    case 'uuid':
    {
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
    default:
    {
      break;
    }
  }

  return query;
}

function createNetworkList(idList) {
  let list = [];

  const store = cyto.getStore(STORE_NDEX);
  const server = store.server.toJS();
  console.log(server);

  idList.map(id => {
    let source = server.serverAddress + '/rest/network/' + id.externalId + '/asCX';
    let entry = {
      source_location: source,
      source_method: 'GET',
      ndex_uuid: id.externalId
    };
    list.push(entry);
  });
  return list;
}

function getImportQuery(ids) {
  return {
    method: 'post',
    headers: HEADERS,
    body: JSON.stringify(createNetworkList(ids))
  };
}

function applyLayout(results) {
  results.map(result => {
    const suid = result.networkSUID;
    fetch('http://localhost:1234/v1/apply/layouts/force-directed/' + suid);
  });
}


function importAsOneCollection(ids) {
  let ct = new Date();
  let ctStr = ct.getHours() + ':' + ct.getMinutes() + ':' + ct.getSeconds() +
    ' ' + ct.getFullYear() +'/' + (ct.getMonth() + 1) + '/' + ct.getDate();
  let collectionName = 'NDEx (' + ctStr + ')';

  createDummy(collectionName, ids);
}

function importAll(collectionName, ids, dummy) {
  fetch(CYREST.IMPORT_NET + '&collection=' + collectionName, getImportQuery(ids))
    .then(response => { return response.json(); })
    .then(json => { applyLayout(json); })
    .then(() => deleteDummy(dummy));
}

function deleteDummy(dummy) {
  const q =  {
    method: 'delete',
    headers: HEADERS
  };

  fetch('http://localhost:1234/v1/networks/' + dummy, q);

}

function createDummy(collectionName, ids) {
  const q =  {
    method: 'post',
    headers: HEADERS,
    body: JSON.stringify(EMPTY_NET)
  };

  fetch('http://localhost:1234/v1/networks?collection=' + collectionName, q)
    .then(response => { return response.json() })
    .then(json => {
      const dummySuid = json.networkSUID;
      console.log(dummySuid);
      importAll(collectionName, ids, dummySuid);
    });
}

function init() {
  initCyComponent(defaultState);
  updateWindowProps(cyto.getStore(STORE_NDEX).server.toJS());
  initWsConnection();
}

function initWsConnection() {
  cySocket = new WebSocket(WS_SERVER);

  cySocket.onopen = () => {
    cySocket.send(JSON.stringify(MESSAGES.CONNECT));
  };

  cySocket.onmessage = event => {
    const msg = JSON.parse(event.data);
    if (msg.from !== 'cy3') {
      return;
    }

    switch (msg.type) {
      case MESSAGE_TYPE.QUERY: {
        const query = msg.body;
        cyto.dispatch(NDExValet.fieldActions.updateQuery(query));
        const store = cyto.getStore(STORE_NDEX);
        const server = store.server.toJS();
        cyto.dispatch(NDExStore.luceneActions.searchFor(server, query));
        break;
      }
      default: {
        break;
      }
    }
  };

  // Keep alive by sending notification...
  setInterval(function () {
    cySocket.send(JSON.stringify(MESSAGES.ALIVE));
  }, 120000);

}

function initCyComponent(serverState) {
  cyto = CyFramework.config([NDExValet, NDExStore], {
    ndex: {
      server: serverState
    }
  });
  cyto.render(NDExValet, document.getElementById('valet'), {
    onLoad: ids => { importAsOneCollection(ids); }
  });
}

function updateWindowProps(server) {
  remote.getCurrentWindow()
    .setTitle('Connected: ' + server.serverName + ' ( ' + server.serverAddress + ' )');
}

// Start application
addCloseButton();
