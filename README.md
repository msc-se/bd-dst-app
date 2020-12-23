# bd-dst-app
This monorepo contains the Express API and the frontend Vue.js application required for the visualization.

## Usage
In order to access the visualization, two ports need to be forwarded: 80 for the frontend and 8000 for the API.

This can be done like so:
```
Host group6-node0
  HostName bddst-group6-node0.uvm.sdu.dk
  User hadoop
  LocalForward 127.0.0.1:80 bddst-group6-node0.uvm.sdu.dk:80
  LocalForward 127.0.0.1:8000 bddst-group6-node0.uvm.sdu.dk:8000
```
Though the local port forwarded from port 80 on the host can be forwarded to any port, the API will have to be forwarded
to port 8000 in order for it to be picked up by the frontend.
