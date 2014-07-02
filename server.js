// Webserver fun
var app = require('express')();
var http = require('http').Server(app);

app.get('/', function(req, res){
  res.sendfile('html/index.html');
});

app.get('/jquery.tinysort.min.js', function(req, res){
  res.sendfile('html/jquery.tinysort.min.js');
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
    if(data.message.charAt(0) == "/") {
        var raw = data.message.substring(1, data.message.length);
        var split = raw.split(" ");
	var command = split.shift();
	var command_message = split.join(" ");
	console.log("command recieved: " + command);
        ircclient.emit("webcommand." + command, command_message);
       return;
    }
    //say it on irc
    ircclient.say(data.to, data.message);
    // keep track of time
    data.time_string = get_time();
    // add nickname_prefix
    data.nickname_prefix = '';
    Object.keys(ircclient.chans).forEach(function(key) {
      if(ircclient.chans[key].key.toLowerCase() === data.to.toLowerCase()) {
        data.nickname_prefix = ircclient.chans[key].users[data.from];
      }
    });

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
      if(ircclient.chans[key].key.toLowerCase() === active_tab.toLowerCase()) {
        io.emit('refresh users', {channel:ircclient.chans[key].key, users:ircclient.chans[key].users});
        is_channel = true;
      }
    });

    // TODO: if is_channel == false, it's a privmsg window
  });
});

function get_time() {
  var currentdate = new Date();
  return currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();
}


// history
var history = {};
var counter = 0;
function save_message(data) {
  // data:from,to,message
  history[counter] = data; 
  console.log(history);
  counter++;
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

function refreshNicklist() {
  Object.keys(ircclient.chans).forEach(function(key) {
    io.emit('refresh users', {channel:ircclient.chans[key].key, users:ircclient.chans[key].users});
  });
}

// IRC fun
var irc = require("irc");

var ircclient = new irc.Client('mujo.be.krey.net', 'ircporxy', {
    channels: ['#irchacks', '#irchacks2', '#irchacks3'],
});

ircclient.addListener('message', function (from, to, message) {
    // send it to the socket
    // if to is a channel, then from is a member, so we need to add channel status to nickname
    var nickname_prefix = '';
    Object.keys(ircclient.chans).forEach(function(key) {
      if(ircclient.chans[key].key.toLowerCase() === to.toLowerCase()) {
        nickname_prefix = ircclient.chans[key].users[from];
      }
    });

    io.emit('chat recieve', {from:from, to:to, message:message, nickname_prefix:nickname_prefix, time_string:get_time()});
    save_message({from:from, to:to, message:message, nickname_prefix:nickname_prefix, time_string:get_time()});
    console.log(from + ' => ' + to + ': ' + message);
});

ircclient.addListener('pm', function (from, message) {
    console.log(from + ' => ME: ' + message);
});

ircclient.addListener('raw', function(message) {
    console.log('<< ', message);
});

/* Changing nicks! */
// so this is coming from the web client
ircclient.addListener('webcommand.nick', function(message) {
    ircclient.changenick(message);
});

// and this is coming from the irc server
// self.emit('nick', message.nick, message.args[0], channels, message);
ircclient.addListener('nick', function(old_nick, new_nick, channels, message) {
	// we need to print this on the screen for each of the channels
	//console.log(channels);
	Object.keys(channels).forEach(function (key) {
	  // send message
          var message = old_nick + " is now known as " + new_nick;
	  io.emit('chat recieve', {from:"-", to:channels[key], message:message, nickname_prefix:"-", time_string:get_time()});
	  save_message({from:"-", to:channels[key], message:message, nickname_prefix:"-", time_string:get_time()});
	}); 

        // this is so the webside can figure out if his own nick changes
	io.emit('nickchange', {old_nick:old_nick, new_nick:new_nick});

        // and force a nicklist refresh 
	refreshNicklist();
});

/* Joining channels */
// this is coming from thw web client

//this is coming from the irc server
// self.emit('join', message.args[0], message.nick, message);
ircclient.addListener('join', function(channel, nickname, message) {
	// print this on the screen 
	var message = nickname + " joined " + channel;
	io.emit('chat recieve', {from:"-", to:channel, message:message, nickname_prefix:"-", time_string:get_time()});
	save_message({from:"-", to:channel, message:message, nickname_prefix:"-", time_string:get_time()});

        //force nicklist refresh
	refreshNicklist();
});

/* Leaving channels */
// this is coming from thw web client

//this is coming from the irc server
ircclient.addListener('part', function(channel, nickname, reason, message) {
        // print this on the screen
	if(reason) {
          var message = nickname + " left " + channel + " (" + reason + ")";
	} else {
          var message = nickname + " left " + channel;
        }
        io.emit('chat recieve', {from:"-", to:channel, message:message, nickname_prefix:"-", time_string:get_time()});
        save_message({from:"-", to:channel, message:message, nickname_prefix:"-", time_string:get_time()});

        //force nicklist refresh
        refreshNicklist();
});

/* Channel kicks */
// this is coming from the web client

//this is coming from the irc server
// TODO: what if it's me thats being kicked ? handle this properly in webinterface
ircclient.addListener('kick', function(channel, nickname, by_nickname, reason, message) {
        // print this on the screen
        if(reason) {
          var message = nickname + " kicked by " + by_nickname + " (" + reason + ")";
        } else {
          var message = nickname + " kicked by " + by_nickname;
        }
        io.emit('chat recieve', {from:"-", to:channel, message:message, nickname_prefix:"-", time_string:get_time()});
        save_message({from:"-", to:channel, message:message, nickname_prefix:"-", time_string:get_time()});

        //force nicklist refresh
        refreshNicklist();
});

/* Quit event */
// this is coming from the web client

//this is coming from the irc server
ircclient.addListener('quit', function(nickname, reason, channels, message) {
        // print this on the screen
        if(reason) {
          var message = nickname + " has quit " + " (" + reason + ")";
        } else {
          var message = nickname + " has quit";
        }
        Object.keys(channels).forEach(function (key) {
          // send message
          io.emit('chat recieve', {from:"-", to:channels[key], message:message, nickname_prefix:"-", time_string:get_time()});
          save_message({from:"-", to:channels[key], message:message, nickname_prefix:"-", time_string:get_time()});
        });

        //force nicklist refresh
        refreshNicklist();
});
