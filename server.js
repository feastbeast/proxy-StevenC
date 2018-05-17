const express = require('express')
const path = require('path');
const app = express();
const port = 3000;
const axios = require('axios');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const clientBundles = './public/services';
const serverBundles = './templates/services';
const serviceConfig = require('./service-config.json');
const services = require('./loader.js')(clientBundles, serverBundles, serviceConfig);

const React = require('react');
const ReactDom = require('react-dom/server');
const Layout = require('./templates/layout');
const App = require('./templates/app');
const Scripts = require('./templates/scripts');

// see: https://medium.com/styled-components/the-simple-guide-to-server-side-rendering-react-with-styled-components-d31c6b2b8fbf
const renderComponents = (components, props) => {
  return Object.keys(components).map(item => {
    let component = React.createElement(components[item], props);
    return ReactDom.renderToString(component);
  });
};

app.use('/', express.static(path.join(__dirname, './public')));

app.get('/restaurants/:id', function(req, res) {
  let id = req.params.id;
  axios.get(`http://127.0.0.1:3003/api/restaurants/${id}`)
    .then(({data}) => {
      let obj = {
        reviewList: data,
        rating: data.rating
      }
      let components = renderComponents(services, obj);
      res.end(Layout(
        'FeastBeast',
        App(...components),
        Scripts(Object.keys(services), obj)
      ));
    })
    .catch((error) => {
      console.log('error: ', error)
    })
});

app.listen(port, () => {
  console.log(`server running at: http://localhost:${port}`);
});
