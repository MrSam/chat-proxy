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
  processConnect(ircclient.nick,ircclient.chans);
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

io.on('connection', function(socket){
  socket.on('chat send', function(data){
    // data:from,to,message
    //say it on irc
    ircclient.say(data.to, data.message);
    // broadcast it back
    io.emit('chat recieve', data);
    save_message(data);
    console.log('message: ' + data.message);
  });

  socket.on('refresh tab', function(active_tab) {
    console.log("refresh : " + active_tab);
    // is this a channel?
    var is_channel = false;
    Object.keys(ircclient.chans).forEach(function(key) {
      if(ircclient.chans[key].key === active_tab) {
        io.emit('refresh users', {channel:ircclient.chans[key].key, users:ircclient.chans[key].users});
        is_channel = true;
      }
    });

    // TODO: if is_channel == false, it's a privmsg window
  });
});


// history
var history = {};
var counter = 0;
function save_message(data) {
  // data:from,to,message
  history[counter] = {to:data.to, from:data.from, message:data.message}; 
  counter++;
  console.log(history);
}

// Webchat functions
// (don't shoot me, i'm just adding everything in one file and split it 
// up later)
function processConnect(nickname, channels) {
	var my_nickname = nickname;
	var my_channels = Object.keys(channels);
	console.log('Hello im ' + my_nickname + ' and i joined channels ' + my_channels); 
	io.emit('welcome', { my_nickname: my_nickname, my_channels:my_channels } );
	io.emit('history', history); 
}

// IRC fun
var irc = require("irc");

var ircclient = new irc.Client('mujo.be.krey.net', 'ircporxy', {
    channels: ['#irchacks', '#irchacks2', '#irchacks2'],
});

ircclient.addListener('message', function (from, to, message) {
    // send it to the socket
    io.emit('chat recieve', {from:from, to:to, message:message});
    save_message({from:from, to:to, message:message});
    console.log(from + ' => ' + to + ': ' + message);
});

ircclient.addListener('pm', function (from, message) {
    console.log(from + ' => ME: ' + message);
});

ircclient.addListener('error', function(message) {
    console.log('error: ', message);
});
