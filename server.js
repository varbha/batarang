//ROUTES GENERATED
/*
* /dashboard
* /user
* /
* /edit
* /register
* /signin
* /signup
* /signinCheck
* /createRoom
* /compile
* /query/
* /secret
*/

// DEPENDENCIES
var r = require('rethinkdb');
var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var morgan = require('morgan');
var compression= require('compression');
var device = require('express-device');
var bodyParser= require('body-parser');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/userdb');



// MIDDLEWARE
app.use(compression());
app.use(morgan('dev'));
app.use(device.capture());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));
//---------------------------------------------------------------------------------------------
// Setup MongoDB connection
var Schema = mongoose.Schema;

var userSchema = new Schema({
  user: { type: String, required: true, unique: true},
  emailid: String,
  password: { type:String, required:true},
  rooms: [String]
});
// Creating the user model (collection: users)
var User = mongoose.model('User', userSchema);

var roomSchema = new Schema({
  rooms : [String]
});
// Creating room model (for keeping track of active rooms)
var Room = mongoose.model('Room', roomSchema);

var dummyRoom = new Room({
  rooms : []
});
dummyRoom.save(function(err){
  if(err)console.log(err);
  else{
    console.log("DUMMY ROOM CREATED");
  }
});
//----------------------------------------------------------------------------------------------

// Setup RethinkDB Database
// ALL OPERATIONS REQUIRING RETHINKDB TO BE ADDED IN THIS BLOCK
//-----------------------------------------------------------------------------------------------
r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
    if(err) throw err;
    r.db('test').tableList().run(conn, function(err, response){
      if(response.indexOf('edit') > -1){
        console.log('GENERATING DATA FROM EXISTING TABLE');
        console.log('TABLE - ' + response);
      } else {

        console.log('CREATING NEW TABLE');
        r.db('test').tableCreate('edit').run(conn);
      }
    }); // table instantiated: table is now live and running

    //-------------------------------------------------------------------------------------
    // Socket (within RethinkDB instantiation)
    io.on('connection', function(socket){
      console.log('NEW USER - CONNECTED');
      socket.on('disconnect', function(){
        console.log('USER DISCONNECTED');
      });

      // socket emits even 'document-update' from client, this method handles it
      socket.on('document-update', function(msg){
        console.log(msg);
        // insert data into the table (conflict:update is for new entries)
        r.table('edit').insert({id: msg.id,value: msg.value, user: msg.user}, {conflict: "update"}).run(conn, function(err, res){
          if (err) throw err;
        }); // table edited
      }); // socket function ends
      r.table('edit').changes().run(conn, function(err, cursor) {
          if (err) throw err;
          cursor.each(function(err, row) {
              if (err) throw err;
              io.emit('doc', row); // sends data back to the client; each row of the cursor
          }); // database querying ends
      }); // database changes() function ends

    }); // main io (socket) connection ends.
    //-----------------------------------------------------------------------------------

    //-----------------------------------------------------------------------------------
    // main API for fetching data to populate the room when logged in
    app.get('/getData/:id', function(req, res, next){
      // open database get() function
      r.table('edit').get(req.params.id).
        run(conn, function(err, result) {
            if (err) throw err;
            res.send(result);
            //return next(result);
        });
    }); // app.get() ends
    //----------------------------------------------------------------------------------

}); // rethinkdb block ends (cant access rethinkdb outside this block)
//-----------------------------------------------------------------------------------------------------


// HTML static pages
// DASHBOARD
app.get('/dashboard', function(req,res){
  var name  = req.query.name;
  res.sendFile(__dirname + '/dashboard.html');
  console.log("---------------------------------------------");
  console.log("USER NAME:" + name + "\nDASHBOARD DISPLAYED");
  console.log("---------------------------------------------");
});
// FOR GETTING DETAILS OF A PARTICULAR USER
app.get('/user', function(req,res){
  var u = req.url;
  var  i = u.indexOf('=');
  var user_name = u.substr(i+1);
  console.log("---------------------------------------------");
  console.log("RECIEVED /USER AJAX GET REQUEST FOR USER:" + user_name);
  console.log("RETRIEVING FROM MONGODB");
  console.log("---------------------------------------------");
});
// HOMEPAGE
app.get('/',function(req, res){
	if(req.device.type==='phone'){
    console.log("---------------------------------------------");
		console.log("phone");
    console.log("---------------------------------------------");
    // MOBILE HOME PAGE
		res.sendFile(__dirname + '/mobile-home.html');
	}
	else{
    console.log("---------------------------------------------");
		console.log("desktop");
    console.log("---------------------------------------------");
    // DESKTOP HOME PAGE
		res.sendFile(__dirname + '/home-page.html');
	}

}); //app.get('/') ends
//----------------------------------------------

// CODE PAGE
app.get('/edit', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
//----------------------------------------------

// REGISTERATION PAGE
app.get('/register',function(req,res){
  res.sendFile(__dirname+'/register.html');
});
//---------------------------------------------

// SIGNIN PAGE
app.get('/signin',function(req,res){
  res.sendFile(__dirname+'/signin.html');
});
//----------------------------------------------


// POST SIGNUP PAGE
app.post('/signup',(req,res) => {
  console.log("---------------------------------------------");
  console.log("ENTERING USER DETAILS IN MONGODB");
  var newUser = new User({
    user: req.body.username,
    emailid : req.body.email,
    password: req.body.password,
    rooms : []
  });

  newUser.save(function(err){
    console.log("---------------------------------------------");
    if (err) console.log(err);
    else{
      console.log("USER CREATED: "+newUser.user);
      redirection = '/dashboard?name=' + req.body.username;
      res.redirect(redirection);
    }
    console.log("---------------------------------------------");
  });
});
//----------------------------------------------

app.post('/signinCheck', function(req,res){

  console.log(req.body);

  User.count({user: req.body.username, password: req.body.password}, function(err,count){
    console.log("---------------------------------------------");
    if(err) console.log(err);
    else{
      if(count == 1){

        console.log("---------------------------------------------");
        console.log("VALIDATION APPROVED FOR: "+ req.body.username)
        redirection = '/dashboard?name=' + req.body.username;
        res.redirect(redirection);

      }
      else {
        res.redirect('/');
      }
    }
  });
});

// CREATE ROOM
app.post('/createRoom', function(req,res){
  console.log(req.body.url);
  console.log(req.body);
  var room = req.body.room;
  console.log(room);
  var u = req.body.url;
  var  i = u.indexOf('=');
  var user_name = u.substr(i+1);
  console.log(user_name);
  User.findOneAndUpdate({user: user_name}, {$push: {rooms: room}} /*{user:"varunn"}*/, function(err,user){
    if(err) console.log(err);
    else console.log(user);
  });
  /*User.count({user:"varunbhatia"}, function(err,count){
    if(err) console.log(err);
    else { console.log("COUNT"+count);}
  });
*/  //Room.update({},{$push:{rooms:room}});
  console.log('done');
  res.send('done');
  });


// COMPILATION
app.post('/compile', function(req,res){
  console.log("---------------------------------------------");
  console.log("recieved compilation request")
  console.log(req.body)
  console.log("---------------------------------------------");
  res.send("thanks for code")
});
//----------------------------------------------

/*
*****************************
*****************************
*****************************
*/

// EASTER EGG PAGE
app.get('/secret',function(req,res){
  res.sendFile(__dirname+'/secret.html');
});
//----------------------------------------------
app.post('/query/', function (req,res){
  console.log("---------------------------------------------");
	console.log(req.body);
  console.log("---------------------------------------------");
	res.send("thanks for the query");
});


app.use('/bower_components', express.static('bower_components'));

// Setup Express Listener
http.listen(9000 , '0.0.0.0', function(){
  console.log('listening on: 0.0.0.0:9000');
});
