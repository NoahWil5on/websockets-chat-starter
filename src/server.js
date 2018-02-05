const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);

const io = socketio(app);
const users = [];
let people = [];

const onJoined = (sock) => {
  const socket = sock;

  socket.on('join', (data) => {
    socket.name = data.name;

    users.push(socket);
    people.push(socket.name);

    const joinMsg = {
      name: data.name,
      count: Object.keys(users).length,
    };
    io.sockets.in('room1').emit('msg', joinMsg);
    socket.emit('msg', joinMsg);

    socket.join('room1');

    // const response = {
    //   name: 'server',
    //   msg: `${data.name} has joined the room.`,
    // };
    // socket.broadcast.to('room1').emit('msg', response);

    console.log(`${data.name} joined`);
    // socket.emit('msg', { name: 'server', msg: 'You joined the room' });
  });
};
const onMsg = (sock) => {
  const socket = sock;

  socket.on('msgToServer', (data) => {
    io.sockets.in('room1').emit('msg', { name: socket.name, msg: data.msg });
  });
  socket.on('msg', (data) => {
    const num = Math.floor((Math.random() * 6) + 1);
    let everyone = "";
    //console.log(users[0]);
    for(let i = 0; i < people.length; i++){
      everyone = `${people[i]}\n${everyone}`;
    }

    switch (data.msg) {
      case '/help':
        return;
      case '/dance':
        io.sockets.in('room1').emit('bustMove', { name: data.name });
        break;
      case '/rollDie':
        io.sockets.in('room1').emit('rollDie', { name: data.name, number: num });
        break;
      case '/listUsers':
        socket.emit('list', { peeps: everyone});
        break;
      default:
        io.sockets.in('room1').emit('userMsg', { name: data.name, msg: data.msg });
        break;
    }
  });
};
const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', () => {
    console.log("disconnection");
    const deserter = users.indexOf(socket);
    const quitter = people.splice(deserter,1);
    users.splice(deserter, 1);

    io.sockets.in('room1').emit('announce', { msg: `ATTENTION: ${quitter} has left everyone.` });
    socket.emit('announce', { msg: `ATTENTION: ${quitter} has left everyone.` });
  });
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onJoined(socket);
  onMsg(socket);
  onDisconnect(socket);
});

