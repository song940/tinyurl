var crypto      = require('crypto');
var level       = require("level");
var express     = require('express');
var bodyParser  = require('body-parser');

var db  = level('tinyurl');

var app = express();

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
/**
 * [function description]
 * @param  {[type]}   name     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
var gen = function(name, callback){
  if(!name){
    name = new Buffer(crypto.randomBytes(5))
    .toString('base64')
    .replace(/\+/g, '')
    .replace(/\//g, '')
    .replace(/=+$/, '');
  }
  db.get(name, function(err){
    if(err && err.notFound) return callback(name);
    if(err) gen(null, callback);
  });
};

app.get('/:alias?', function(req, res){
  var alias = req.params[ 'alias' ] || req.query[ 'alias' ];
  db.get(alias, function(err, url){
    if(err)                     return res.render('index');
    if(req.query.alias  && url) return res.send(url);
    res.redirect(url);
  });
});

app.post('/:alias?', function(req, res){
  var url   = req.body[ 'url' ];
  var alias = req.params[ 'alias' ] || req.query['alias'] || req.body[ 'alias' ];
  gen(alias, function(alias){
    db.put(alias, url, function(err){
      if(err) return res.status(500).send(err);
      res.json({
        alias : alias,
        url   : url
      });
    });
  });
});

module.exports = app;
