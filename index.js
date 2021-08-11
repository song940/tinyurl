const crypto = require('crypto');
const level  = require("level");
const http   = require('http');
const kelp   = require('kelp');
const body   = require('kelp-body');
const send   = require('kelp-send');
const Router  = require('kelp-router');
const logger = require('kelp-logger');

const db  = level('tinyurl');
const gen = async name => {
  if(!name){
    name = new Buffer(crypto.randomBytes(5))
    .toString('base64')
    .replace(/\+/g, '')
    .replace(/\//g, '')
    .replace(/=+$/, '');
  }
  try{
    await db.get(name);
    return await gen(name);
  }catch(e){
    if(e.notFound) return name;
  }
};

const app = kelp();

app.use(send);
app.use(body);
app.use(logger);

const router = new Router();


app.use(router.route('get', '/:alias?', async (req, res) => {
  const { alias } = Object.assign({
    // alias
  }, req.params, req.body, req.query);
  if(!alias) return res.send(await render(req));
  try {
    const url = await db.get(alias);
    if(url) return res.redirect(url);
  } catch(e) {
    res.status(e.notFound ? 404 : 500).send(e.toString());
  }
}));

app.use(router.route('post', '/:alias?', async (req, res) => {
  let { url, alias = req.params.alias } = req.body || req.query;
  if(!url) return res.status(500).send('url is required');
  try {
    alias = await gen(alias);
    await db.put(alias, url);
    return res.send({ alias, url });
  } catch(e) {
    res.status(500).send(e.toString());
  }
}));

app.use((req, res) => res.send(404));
const server = http.createServer(app);
server.listen(9000, (err) => {
  console.log('server is running at %s', server.address().port);
});

const render = async props => {
  return `
  <!doctype html>
  <html lang="en" >
  <head>
  <title>TinyURL</title>
  <meta name="viewport" content="width=device-width" />
  <style>
  .container{
    width: 20%;
    margin: auto;
    text-align: center;
  }
  input, button{
    border: none;
    width: 100%;
    padding: 5px 0;
    outline: 0;
    display: block;
    margin: 10px auto;
    border-bottom: 1px solid #ccc;
  }
  button{
    color: white;
    cursor: pointer;
    background: black;
  }
  @media screen and (max-width: 768px){
    .container{
      width: 80%;
    }
  }
  </style>
  </head>
  <body class="container" >
    <h1>Tiny URL</h1>
    <form action="" method="post" >
      <p>Enter a long URL to make tiny:</p>
      <input name="url" type="url" placeholder="url" required />
      <input name="alias", placeholder="alias (optional)" />
      <button type="submit" >submit</button>
    </form>
    <footer>
      <p>&copy; 2017 LSONG.ORG</p>
    </footer>
  </body>
  </html>`;
};