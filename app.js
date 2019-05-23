var http = require('http');
var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var bodyParser = require("body-parser");
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var config = require('./config/database');
var util = require('util');


mongoose.connect(config.database, {useCreateIndex: true, useNewUrlParser: true});
var db = mongoose.connection;

//Check connection
db.once('open', function () {
    console.log('connect to db');
});
//Check for db errors
db.on('error', function (error) {
    console.log(error);
});

var app = express();

app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));

// Express Session Middleware
app.use(session({
    secret: 'keyboard',
    resave: true,
    saveUninitialized: true
}));

// Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});

//Express validator Middleware
app.use(expressValidator({
    errorFormatter: function (param, msg, value) {
        let namespace = param.split('.')
            , root = namespace.shift()
            , formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    }
}));
//Passport Config
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

//Set global for user
app.use(function (req, res, next) {
    res.locals.login = req.isAuthenticated();
    next();
});

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var appChat = require('./routes/app');

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/', appChat);

// let server = app.listen(3000, '0.0.0.0', function () {
//     var host = server.address().address;
//     var port = server.address().port;

//     console.log('Server run on http://%s:%s/', host, port);
// });

var server = http.createServer(app);
// Pass a http.Server instance to the listen method
var io = require('socket.io').listen(server);

// The server should start listening
server.listen(80);

var usernames = [];
var rooms = ['Lobby'];
var test;

//listen on every connection
io.sockets.on('connection', function (socket) {

    socket.on('user_data', function (data, callback) {

            socket.id = data.id;
            socket.username = data.name;
            console.log(socket.username);


            usernames.push(socket.username);
            io.sockets.emit('usernames', usernames);
    
            socket.room = 'Lobby';
            usernames[data.name] = data.name;
            socket.join('Lobby');
            socket.emit('updatechat', 'SERVER', 'you have connected to room1');
            socket.broadcast.to('Lobby').emit('updatechat', 'SERVER', socket.username + ' has connected to this room');
            socket.emit('updaterooms', rooms, 'Lobby');
        
    });

    socket.on('create', function (room) {
        rooms.push(room);
        socket.emit('updaterooms', rooms, socket.room);
    });

    socket.on('switchRoom', function (newroom) {
		// leave the current room (stored in session)
		socket.leave(socket.room);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
        socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');

        socket.join(newroom);
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		socket.emit('updaterooms', rooms, newroom);
    });

    socket.on('new_message', (data) => {
        console.log(socket.username, data);
        io.sockets.in(socket.room).emit('new_message', socket.username, data);
    });

    socket.on('typing', (data) => {
        //socket.broadcast.emit('typing', {username:socket.username, typing:data});
        socket.broadcast.to(socket.room).emit('typing', {username: socket.username, typing: data});
    });

    //Disconnect
    socket.on('disconnect', function (data) {
        if (!socket.nickname) {
            return;
        }

		delete usernames[socket.username];
		io.sockets.emit('updateusers', usernames);
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
    })
});

module.exports = app;