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
		id:""
	};
	self.update = function(){
		self.updatePosition();
	};
	self.updatePosition = function(){
		self.x += self.spdX;
		self.y += self.spdY;
	};
	return self;
};
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
  self.pressingAttack = false;
  self.mouseAngle = 0;
	self.maxSpd = 10;

  //Player.update()
	var super_update = self.update;
	self.update = function(){
		self.updateSpd();
		super_update();

    //Player Attack !
    if(self.pressingAttack){
      // console.log(self.mouseAngle);//
      self.shootBullet(self.mouseAngle);
    }
	};

	//Player.shootBullet()
	self.shootBullet = function(angle){
    var b = Bullet(angle);//bullet in random direction
    b.x = self.x;
    b.y = self.y;
  };

	//Player.updateSpd()
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
	};

	Player.list[pid] = self;//add player to the list of players
	return self;
};

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
    else if(data.inputId === 'attack') {
      player.pressingAttack = data.state;
    }
    else if(data.inputId === 'mouseAngle') {
      player.mouseAngle = data.state;
    }

	});

};// !- OnConnect

Player.onDisconnect = function(socket){
	delete Player.list[socket.id];
};// !- onDisconnect
Player.update = function(){
	var pack = [];
	//pack loop
	for(var i in Player.list) {
		var player = Player.list[i];
		player.update();
		pack.push({
			x:player.x,
			y:player.y,
			number:player.number
		});

	}
	return pack;
};
// !- Player Object

// Bullet Object
var Bullet = function(angle){
	var self = Entity();
	self.id = Math.random();//todo refactor
  // console.log('Bullet : ' + angle);
  console.log('self.spdX :: ' + Math.cos(angle/180*Math.PI) * 10);
  console.log('self.spdY :: ' + Math.sin(angle/180*Math.PI) * 10);
	self.spdX = Math.cos(angle / 180 * Math.PI) * 10;
	self.spdY = Math.sin(angle / 180 * Math.PI) * 10;

	self.timer = 0;
	self.toRemove = false;
	var super_update = self.update;
	self.update = function(){
		if(self.timer++ > 100)
			self.toRemove = true;
    super_update();
	};
	Bullet.list[self.id] = self;
	return self;
};
Bullet.list = {};
Bullet.update = function(){

	var pack = [];
	//pack loop
	for(var i in Bullet.list) {
		var bullet = Bullet.list[i];
		bullet.update();
		pack.push({
			x:bullet.x,
			y:bullet.y,
			number:bullet.number
		});

	}
	return pack;
};

/*
* Server Connection
*/
var DEBUG = true;
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

  //Send msg
  socket.on('sendMsgToServer', function(data){
    var playerName = ("" + socket.id).slice(2,7);
    for(var i in SOCKET_LIST){
      SOCKET_LIST[i].emit('addToChat', playerName + ':' + data);
    }
  });

  //Evaluate command
  socket.on('evalServer', function(data) {
    var res = 'Command not found!';
    try {
      if (!DEBUG) {return;}
      res = eval(data);
    } catch (e) {
      if (e instanceof SyntaxError) {
        console.log(e.message);
      }
    }
    socket.emit('evalAnswer', res);
  });

});




// Game-loop
setInterval(function() {

  var pack = {
    player:Player.update(),
    bullet:Bullet.update()
  };

	for(var i in SOCKET_LIST) {
		var socket = SOCKET_LIST[i];
		socket.emit('newPositions', pack);
	}
},1000/25);// !- Game-loop



















