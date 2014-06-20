// Webserver fun

var app = require('express')();
var http = require('http').Server(app);

app.get('/', function(req, res){
  res.send('<h1>Hello world</h1>');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});


// IRC fun
var irc = require("irc");

var client = new irc.Client('mujo.be.krey.net', 'ircporxy', {
    channels: ['#irchacks'],
});

client.addListener('message', function (from, to, message) {
    console.log(from + ' => ' + to + ': ' + message);
});

client.addListener('pm', function (from, message) {
    console.log(from + ' => ME: ' + message);
});

client.addListener('message#irchacks', function (from, message) {
    console.log(from + ' => #irchacks: ' + message);
});

client.addListener('error', function(message) {
    console.log('error: ', message);
});
