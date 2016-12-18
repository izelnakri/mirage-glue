require('babel-register')({
   presets: [ 'es2015' ]
});

const _ = require('lodash'); // maybe use Ember instead
const chalk = require('chalk');
const fs = require('fs');
const mkdirp = require('mkdirp');
const getDirName = require('path').dirname;
const util = require('util');

const request = require('./custom-request');

const endpoint = process.argv[2];

// singular endpoint vs plural endpoint: /companies/:id vs /companies needs tests
request(endpoint).then((data) => {
  // get the entity or not endpoint of the url;
  // pluralize or singularize
  const jsonModelKey = Object.keys(data)[0];
  console.log(jsonModelKey);

  const targetData = ignoreCertainProperties(data, endpoint);
  const targetFile = `./mirage/fixtures/${jsonModelKey}.js`;

  if (fs.existsSync(targetFile)) {
    const currentData = require(targetFile)['default'];
    const newData = _.uniqBy(currentData.concat(targetData), 'id');

    console.log('newData length is: ');
    console.log(newData.length);

    fs.writeFile(targetFile, 'export default ' + util.inspect(newData, { depth: null }) + ';', (error) => {
      if (error) { throw error; }
      console.log(chalk.green('appending operation finished for ' + targetFile));
    });
  } else {
    mkdirp(getDirName(targetFile), (error) => {
      if (error) { throw error;  }

      fs.writeFile(targetFile, 'export default ' + util.inspect(targetData, { depth: null }) + ';', (error) => {
        if (error) { throw error; }
        console.log(chalk.green('write operation finished for ' + targetFile));
      });
    });
  }
}).catch(() => {});


function ignoreCertainProperties(data, endpoint) {
  // what about ignoring hasOne embeds?

  const jsonModelKey = Object.keys(data)[0];
  let ignoredPropertiesList = ['links'];
  // I can cast singularize + pluralize on the same string?
  // get it from the endpoint

  let actualData = data[jsonModelKey];

  return actualData.map((element) => {
    return Object.keys(element).reduce((result, key, index) => {
      if (ignoredPropertiesList.includes(key)) {
        return result;
      }

      result[key] = element[key];
      return result;
    }, {});
  });
}
