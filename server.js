// Create the configuration
var config = {
	channels: ["#irchacks"],
	server: "mujo.be.krey.net",
	botName: "ircporxy"
};

// Get the lib
var irc = require("irc");

// Create the bot name
var bot = new irc.Client(config.server, config.botName, {
	channels: config.channels
});

// Listen for joins
bot.addListener("join", function(channel, who) {
	// Welcome them in!
	bot.say(channel, who + "...dude...welcome back!");
});

// Listen for any message, PM said user when he posts
bot.addListener("message", function(from, to, text, message) {
	bot.say(from, "¿Que?");
});

// Listen for any message, say to him/her in the room
bot.addListener("message", function(from, to, text, message) {
	bot.say(config.channels[0], "¿Public que?");
});
