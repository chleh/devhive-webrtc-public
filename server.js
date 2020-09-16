'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');
const PORT = process.env.PORT || 8080

var fileServer = new(nodeStatic.Server)();
var app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(PORT);

var io = socketIO.listen(app);
io.sockets.on('connection', function(socket) {
  console.log("Server: version 1");

  // convenience function to log server messages on the client
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
    console.log.apply(console, array);
  }

  socket.on('message', function(message) {
    log('Client said: ', message);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.emit('message', message);
  });

  socket.on('create or join', function() {
    log('Received request to create or join room ' + room);

    let non_full_room = null;

    // search non-full room
    for (let room in io.sockets.adapter.rooms) {  // TODO maybe random order
      var clientsInRoom = io.sockets.adapter.rooms[room];
      var numClients = Object.keys(clientsInRoom.sockets).length;
      if (numClients < 2) { // free slots avail.
        non_full_room = room;
        break;
      }
    }

    // create new room
    if (non_full_room === null) {
      // gen new room name
      let new_room_name;
      do {
        let randInt = Math.floor(Math.random() * 1e11);
        new_room_name = '' + randInt;
        if (new_room_name in io.sockets.adapter.rooms) {
          // collision
          continue;
        } else {
          break;
        }
      } while (true);
      room = new_room_name;
    } else {
      room = non_full_room;
    }

    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    log('Room ' + room + ' now has ' + numClients + ' client(s)');

    if (numClients === 0) {
      socket.join(room);
      log('Client ID ' + socket.id + ' created room ' + room);
      socket.emit('created', room, socket.id);

    } else if (numClients === 1) {
      log('Client ID ' + socket.id + ' joined room ' + room);
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room, socket.id);
      io.sockets.in(room).emit('ready');
    } else { // max two clients
      socket.emit('full', room);
    }
  });

  socket.on('ipaddr', function() {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });

  socket.on('bye', function(){
    console.log('Server: received bye');
  });

  socket.on('end', function (){
    console.log('Server: received end');
  });

  socket.on('disconnect', function () {
    // TODO merge single person rooms upon disconnect
    // TODO cleanup empty rooms
    console.log('Server: received disconnect');
    socket.broadcast.emit('message', 'bye');
  });

});
