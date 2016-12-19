#! /usr/bin/env node
require('babel-register')({
   presets: [ 'es2015' ]
});

const inflector = require('i')();
const _ = require('lodash');
const chalk = require('chalk');
const fs = require('fs');
const mkdirp = require('mkdirp');
const getDirName = require('path').dirname;
const util = require('util');

const request = require('./custom-request');

const endpoint = process.argv[2];

// singular endpoint vs plural endpoint: /companies/:id vs /companies needs tests
request(endpoint).then((data) => {
  if (!fs.existsSync('mirage')) {
    console.log(chalk.red('Mirage folder doesnt exist for this directory!'));
    return;
  }

  const jsonModelKey = inflector.pluralize(Object.keys(data)[0]);

  const targetData = ignoreCertainProperties(data, endpoint);
  const targetFile = `mirage/fixtures/${inflector.dasherize(jsonModelKey)}.js`;

  if (fs.existsSync(targetFile)) {
    console.log(`${targetFile} exists, appending operation start:`);
    // require below doesnt work for global!!:
    const currentData = require(`${process.cwd()}/${targetFile}`)['default'];
    console.log('currentData is:');
    console.log(currentData);
    const newData = _.uniqBy(currentData.concat(targetData), 'id');

    fs.writeFile(targetFile, 'export default ' + util.inspect(newData, { depth: null }) + ';', (error) => {
      if (error) { throw error; }
      console.log(chalk.green('appending operation finished for ' + targetFile));
      console.log(`Fixture file has ${newData.length} elements`);
    });
  } else {
    mkdirp(getDirName(targetFile), (error) => {
      if (error) { throw error;  }

      fs.writeFile(targetFile, 'export default ' + util.inspect(targetData, { depth: null }) + ';', (error) => {
        if (error) { throw error; }
        console.log(chalk.green('write operation finished for ' + targetFile));
        console.log(`Fixture file has ${targetData.length} elements`);
      });
    });
  }
}).catch(() => {});


function ignoreCertainProperties(data, endpoint) {
  // what about ignoring hasOne embeds?

  const jsonModelKey = Object.keys(data)[0];
  let ignoredPropertiesList = ['links'];

  let actualData = data[inflector.singularize(jsonModelKey)] || data[inflector.pluralize(jsonModelKey)];

  if (Array.isArray(actualData)) {
    return actualData.map((element) => removeIgnoredProperties(element));
  } else {
    return [ removeIgnoredProperties(actualData) ];
  }

  function removeIgnoredProperties(obj) {
    return Object.keys(obj).reduce((result, key, index) => {
      if (ignoredPropertiesList.includes(key)) {
        return result;
      }

      result[key] = obj[key];
      return result;
    }, {});
  }
}
