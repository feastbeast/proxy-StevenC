const express = require('express')
const path = require('path');
const app = express();
const port = 3000;
const axios = require('axios');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const redis = require('redis');
const client = redis.createClient({ host: '18.144.64.77', port: 6379 });

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

app.get('/loaderio-45ed40b001c7f8d14177808e4f968fc4', (req, res) => {
  res.end('loaderio-45ed40b001c7f8d14177808e4f968fc4');
});

// app.get('/restaurants/:id', function(req, res) {
//   const id = req.params.id;
//   axios.get(`http://13.56.11.179:3003/api/restaurants/${id}`)
//     .then(({data}) => {
//       let obj = {
//         reviewList: data,
//         rating: data.rating
//       }
//       let components = renderComponents(services, obj);
//       res.end(Layout(
//         'FeastBeast',
//         App(...components),
//         Scripts(Object.keys(services), obj)
//       ));
//     })
//     .catch((error) => {
//       console.log('error: ', error)
//     })
// });

app.get('/restaurants/:id', (req, res) => {
  let id = req.params.id;
  client.get(id, (err, result) => {
    if (result) {
      let components = renderComponents(services, JSON.parse(result));
      res.end(Layout(
        'FeastBeast',
        App(...components),
        Scripts(Object.keys(services), JSON.parse(result))
      ));
    } else {
      axios.get(`http://apateez-loadbalancer-services-237192466.us-west-1.elb.amazonaws.com /api/restaurants/${id}`)
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
          client.setex(id, 60*60, JSON.stringify(obj));
        })
        .catch((error) => {
          console.log('error: ', error)
        })
      }
  });
});

app.listen(port, () => {
  console.log(`server running at:${port}`);
});
