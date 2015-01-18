var express     = require('express');
var redis       = require("redis");
var bodyParser  = require('body-parser');
var crypto      = require('crypto');

var client  = redis.createClient();

var app = express();

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var gen = function(name, callback){
  if(!name){
    name = new Buffer(crypto.randomBytes(5))
    .toString('base64')
    .replace(/\+/g, '')
    .replace(/\//g, '')
    .replace(/=+$/, '');
  }
  client.exists(name, function(err, exists){
    if(exists){
      gen(false, callback);
    }else{
      callback(name);
    }
  });
};

app.get('/:alias?', function(req, res){
  var alias = req.params[ 'alias' ] || req.query['alias'];
  client.get(alias, function(err, url){
    if(err){
      res.status(500).send(err);
    }else{
      if(url){
        if(req.params['alias']){
          res.redirect(url);
        }else{
          res.send(url);
        }
      }else{
        res.render('index');
      }
    }
  });
});

app.post('/:alias?', function(req, res){
  gen(req.params[ 'alias' ] || req.body[ 'alias' ], function(alias){
    client.set(alias, req.body[ 'url' ], function(err, reply){
      if(err){
        res.status(500).send(err);
      }else{
        res.json({
          alias: alias,
          url: req.body.url
        });
      }
    });
  });
});

module.exports = app;
