var express = require('express')
  , http = require('http')
  , path = require('path');

var RedisStore = require('connect-redis')(express);

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('17aa37a9-60bd-4df5-b9c6-36b61a76ef29'));
app.use(express.session({
store: new RedisStore({
host: "localhost",
port: 6379,
db: 2,
pass: ""
}),
secret: "9962b642-094d-42ef-8fd9-e608974600c6"
}));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

require('./routes')(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
