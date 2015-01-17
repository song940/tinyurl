var server = require('./').listen(9000,function(){
  console.log('server is running at %s', server.address().port);
});
