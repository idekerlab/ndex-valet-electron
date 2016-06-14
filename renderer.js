const remote = require('electron').remote;


function addCloseButton() {

  document.getElementById("close").addEventListener("click", function (e) {
    var window = remote.getCurrentWindow();
    window.close();
  });

  init();
}

let cySocket;

function init() {
  //Create the framework instance
  var cyto = CyFramework.config([NDExValet, NDExStore])

  //Render NDEx Valet into the div
  cyto.render(NDExValet, document.getElementById('valet'), {
    onLoad: function (networkIds) {
      console.log(networkIds)
      networkIds.map(function (N) {
        console.log(N.externalId);
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
      })
    }
  })


  /////////////////////////////////////////////////////
  // The following is the Electron app dependent section.
  /////////////////////////////////////////////////////

  var MESSAGES = {
    CONNECT: {
      from: "ndex",
      type: "connected",
      body: ""
    },

    ALIVE: {
      from: "ndex",
      type: "alive",
      body: "from renderer"
    }
  };

  var MESSAGE_TYPE = {
    QUERY: "query"
  };

  //Connect to Cytoscape with a web socket
  cySocket = new WebSocket("ws://localhost:8025/ws/echo");

  cySocket.onopen = function () {
    cySocket.send(JSON.stringify(MESSAGES.CONNECT));
  };

  //Listen for messages
  cySocket.onmessage = function (event) {
    var msg = JSON.parse(event.data);

    if (msg.from !== "cy3") {
      return;
    }

    switch (msg.type) {
      case MESSAGE_TYPE.QUERY:
        let query = msg.body;
        console.log("New query from Cy3: " + query);
        cyto.dispatch(NDExValet.fieldActions.updateQuery(query));
        cyto.dispatch(NDExStore.luceneActions.searchFor(query));
        break;
    }
  }

  // Keep alive by sending notification...
  setInterval(function() {
    cySocket.send(JSON.stringify(MESSAGES.ALIVE));
  }, 120000);

}


addCloseButton();
