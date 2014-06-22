// Webserver fun

var app = require('express')();
var http = require('http').Server(app);

app.get('/', function(req, res){
  res.sendfile('html/index.html');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});


// Socket.io fun
var io = require('socket.io')(http);

io.on('connection', function(socket){
  console.log('a user connected');
  // send all important information like channels joined etc
  // so the node-irc client keeps a list of .chans, but no member information
  // so let's do this ourselves by keeping track of 'names' (on self join) and join,part and mode events
  console.log('channels: ' + Object.keys(ircclient.chans));
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

io.on('connection', function(socket){
  socket.on('chat message', function(message){
    //say it on irc
    ircclient.say('#irchacks', message);
    // broadcast it back
    io.emit('chat message', 'You:' + message);
    console.log('message: ' + message);
  });
});

// IRC fun
var irc = require("irc");

var ircclient = new irc.Client('mujo.be.krey.net', 'ircporxy', {
    channels: ['#irchacks'],
});

ircclient.addListener('message', function (from, to, message) {
    // send it to the socket
    io.emit('chat message', from + ' => ' + to + ': ' + message);
    console.log(from + ' => ' + to + ': ' + message);
});

ircclient.addListener('pm', function (from, message) {
    console.log(from + ' => ME: ' + message);
});

ircclient.addListener('error', function(message) {
    console.log('error: ', message);
});

ircclient.addListener('names', function(channel,nicks) {
    console.log( channel + ' list: '+ Object.keys(nicks));
});
