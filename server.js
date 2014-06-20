// Get the lib
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
