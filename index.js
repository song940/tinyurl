var express     = require('express');
var redis       = require("redis");
var bodyParser  = require('body-parser');
var crypto      = require('crypto');

var client  = redis.createClient();

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var gen = function(name, callback){
  if(!name){
    name = new Buffer(crypto.randomBytes(5))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
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

app.post('/:name?', function(req, res){
  gen(req.params[ 'name' ] || req.body[ 'name' ], function(name){
    client.set(name, req.body[ 'url' ], function(err, reply){
      if(err){
        res.status(500).send(err);
      }else{
        res.send({
          name: name,
          url: req.body.url
        });
      }
    });
  });
});

app.get('/:name', function(req, res){
  var name = req.params[ 'name' ];
  client.get(name, function(err, reply){
    if(err){
      res.status(500).send(err);
    }else{
      res.send({
        name: name,
        url: reply
      });
    }
  });
});

module.exports = app;
