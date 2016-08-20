const WS_SERVER = 'ws://localhost:8025/ws/echo';
const CYREST = {
  IMPORT_NET: 'http://localhost:1234/v1/networks?format=cx&source=url',
  COLLECTIONS: 'http://localhost:1234/v1/collections'
};

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

const EMPTY_NET = {
  data: {},
  elements: {
    nodes: [],
    edges: []
  }
};

module.exports = { WS_SERVER, CYREST, MESSAGES, EMPTY_NET };
