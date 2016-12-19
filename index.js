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

request(endpoint).then((data) => {
  if (!fs.existsSync('mirage')) {
    console.log(chalk.red('Mirage folder doesn\'t exist for this directory!'));
    return;
  }

  const jsonModelKey = inflector.pluralize(Object.keys(data)[0]);

  const targetData = ignoreCertainProperties(data, endpoint);
  const targetFile = `mirage/fixtures/${inflector.dasherize(jsonModelKey)}.js`;

  if (!fs.existsSync(targetFile)) {
    return mkdirp(getDirName(targetFile), (error) => {
      if (error) { throw error;  }

      return writeToFixtureFile(targetFile, targetData);
    });
  }

  const currentData = require(`${process.cwd()}/${targetFile}`)['default'];
  const newData = _.uniqBy(currentData.concat(targetData), 'id');

  console.log(chalk.yellow(`appending data to file: ${targetFile}`));

  writeToFixtureFile(targetFile, newData);

}).catch(() => {});

function appendToFixtureFile(targetFile, newData) {
  const existingData = require(`${process.cwd()}/${targetFile}`)['default'];
  const combinedData = _.uniqBy(existingData.concat(newData), 'id');

  console.log(`appending data to file: ${targetFile}`);

  writeToFixtureFile(targetFile, combinedData);
}


function writeToFixtureFile(targetFile, data) {
  fs.writeFile(targetFile, 'export default ' + util.inspect(data, { depth: null }) + ';', (error) => {
    if (error) { throw error; }
    console.log(chalk.green(`Data written to ${targetFile}`));
    console.log(chalk.yellow(`Fixture file has ${data.length} elements`));
  });
}


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
