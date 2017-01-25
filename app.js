//initialize our shit!
console.log("initializing...");

var express = require('express');
var app = express();
var serv = require('http').Server(app);

//Express
//Send the index fild to the client
app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
//client can only access the client directory.
app.use('client',express.static(__dirname + '/client'));

serv.listen(2000);//navi - "Hey Listen" (SERVER listen on port :2000)
console.log("SERVER :: Connected");

//List of the connected sockets, players.
var SOCKET_LIST = {};
var PLAYER_LIST = {};

/**
	*
	*	Player Object Constructor
	*		init
	*       updatePosition
	*/
var Player = function(pid){
	//inital create self (player)
	var self = {
		x:250,
		y:250,
		id:pid,
		number:"" + Math.floor(10 * Math.random()),
		pressingRight:false,
		pressingLeft:false,
		pressingUp:false,
		pressingDown:false,
		maxSpd:10,
	}

	//update position function
	self.updatePosition = function(){
		if(self.pressingRight)
			self.x += self.maxSpd;
		if(self.pressingLeft)
			self.x -= self.maxSpd;
		if(self.pressingUp)
			self.y -= self.maxSpd;
		if(self.pressingDown)
			self.y += self.maxSpd;
	}

	return self;
}


//load file, initialize.
var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	console.log('socket connected');

	//Store socket info
	socket.id = Math.random();//todo make better id 
	socket.number = "" + Math.floor(10 * Math.random());
	SOCKET_LIST[socket.id] = socket;

	//Store player info
	var player = Player(socket.id);
	PLAYER_LIST[socket.id] = player;
	// console.log(PLAYER_LIST[socket.id]);

	//listen for 'NAME'

	//login function
	socket.on('login',function(user, password){
		console.log('Request Login Screen : user:' + user );
		return 1;
	})

	//Remove player on disconnect
	socket.on('disconnect', function(){
		delete SOCKET_LIST[socket.id];
		delete PLAYER_LIST[socket.id];
	})


	//Send message
	socket.emit('serverMsg',{
		msg:'message',
	});

});

// Game-loop
setInterval(function() {
	var pack = [];

	//pack loop
	for(var i in PLAYER_LIST) {
		var player = PLAYER_LIST[i]
		player.updatePosition;
		pack.push({
			x:player.x,
			y:player.y,
			number:player.number
		});

	}

	//emit loop
	for(var i in SOCKET_LIST) {
		var socket = SOCKET_LIST[i];
		socket.emit('newPosition', pack);
	}
});//!Game-loop



















