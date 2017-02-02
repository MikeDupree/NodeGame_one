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

serv.listen(2000);//navi - "Hey Listen"
console.log("SERVER :: Connected");

//List of the connected sockets, players.
var SOCKET_LIST = {};
var PLAYER_LIST = {};

/*
*	Entity Object Constructor
*/
var Entity = function(){
	//inital create self (player)
	var self = {
		x:250,
		y:250,
		spdX:0,
		spdY:0,
		id:"",
	}
	self.update = function(){
		self.updatePosition();
	}
	self.updatePosition = function(){
		self.x += self.spdX;
		self.y += self.spdY;
	}
	return self;
}
/*
*	Player Object Constructor
*/
var Player = function(pid){
	//inital create self (player)
	var self = Entity();
	self.id = pid;
	self.number = "" + Math.floor(10 * Math.random());
	self.pressingRight = false;
	self.pressingLeft = false;
	self.pressingUp = false;
	self.pressingDown = false;
	self.maxSpd = 10;

	var super_update = self.update;
	self.update = function(){
		self.updateSpd();
		super_update();
	}

	//update position function
	self.updateSpd = function(){
		//Handle LEFT/ Right
		if( self.pressingRight )
			self.spdX = self.maxSpd;
		else if( self.pressingLeft )
			self.spdX = -self.maxSpd;
		else
			self.spdX = 0;

		//Handle Up/ Down
		if( self.pressingUp )
			self.spdY = -self.maxSpd;
		else if( self.pressingDown )
			self.spdY = self.maxSpd;
		else
			self.spdY = 0;
	}

	Player.list[pid] = self;//add player to the list of players
	return self;
}
Player.list = {};
Player.onConnect = function(socket){
	//Store player info
	var player = Player(socket.id);

	socket.on('keyPress', function(data){
		if(data.inputId === 'left'){
			player.pressingLeft = data.state;
		} 
		else if(data.inputId === 'right') {
			player.pressingRight = data.state;
		}
		else if(data.inputId === 'up') {
			player.pressingUp = data.state;
		}
		else if(data.inputId === 'down') {
			player.pressingDown = data.state;
		}
	});

}// !- OnConnect

Player.onDisconnect = function(socket){
	delete Player.list[socket.id];
}// !- onDisconnect
Player.update = function(){
	var pack = [];
	//pack loop
	for(var i in Player.list) {
		var player = Player.list[i]
		player.update();
		pack.push({
			x:player.x,
			y:player.y,
			number:player.number
		});

	}
	return pack;
}
// !- Player Object




/*
* Server Connection
*/
var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){

	socket.id = Math.random();//todo make better id, number 
	SOCKET_LIST[socket.id] = socket;

	Player.onConnect(socket);

	//todo
	//login function
	socket.on('login',function(user, password){
		console.log('Request Login Screen : user:' + user );
		return 1;
	});

	//Remove player on disconnect
	socket.on('disconnect', function(){
		delete SOCKET_LIST[socket.id];
		Player.onDisconnect(socket);
	});

});




// Game-loop
setInterval(function() {
	var pack = Player.update();
	for(var i in SOCKET_LIST) {
		var socket = SOCKET_LIST[i];
		socket.emit('newPosition', pack);
	}
},1000/25);// !- Game-loop



















