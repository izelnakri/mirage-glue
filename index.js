#! /usr/bin/env node
require('locus');

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

let serializationQueue = function() {
  let modelQueues = {};

  return {
    push(modelName, data) {
      const emberModelKey = formatName(modelName);
      const queue = modelQueues[emberModelKey];

      if (!queue) {
        return createQueue(emberModelKey, data);
      }

      return queue.push(data);
    },
    flushAll() {
      Object.keys(modelQueues).forEach((emberModelKey) => writeToFile(emberModelKey));
    }
  };

  function formatName(name) {
    return inflector.pluralize(inflector.underscore(name));
  }

  function createQueue(modelName, data) {
    modelQueues[modelName] = [data];
  }

  function writeToFile(modelName) {
    startSerialization({ [modelName]: modelQueues[modelName] });
  }
}();

request(endpoint).then((data) => {
  if (!fs.existsSync('mirage')) {
    // helpful message for people who dont use mirage:
    console.log(chalk.red('Mirage folder doesn\'t exist for this directory!'));
    return;
  }

  startSerialization(data);

  serializationQueue.flushAll();
}).catch((error) => { throw error; });

function startSerialization(data) {
  const jsonModelKey = inflector.pluralize(Object.keys(data)[0]);
  const targetData = prepareData(data, endpoint);

  const targetFile = `mirage/fixtures/${inflector.dasherize(jsonModelKey)}.js`;

  if (!fs.existsSync(targetFile)) {
    return mkdirp(getDirName(targetFile), (error) => {
      if (error) { throw error;  }

      return writeToFixtureFile(targetFile, targetData);
    });
  }

  appendToFixtureFile(targetFile, targetData);
}

function appendToFixtureFile(targetFile, newData) {
  // warning: this require has caching:
  const existingData = require(`${process.cwd()}/${targetFile}`)['default'];
  const combinedData = _.uniqBy(existingData.concat(newData), 'id');

  console.log(`appending data to file: ${targetFile}`);

  writeToFixtureFile(targetFile, combinedData);
}

function writeToFixtureFile(targetFile, data) {
  const fixtureData = objectFormatter(util.inspect(data, { depth: null }));

  fs.writeFileSync(targetFile, `export default ${fixtureData};`);

  console.log(chalk.green(`Data written to ${targetFile}`));
  console.log(chalk.yellow(`Fixture file has ${data.length} elements`));

  function objectFormatter(object) {
    // this might slow down things a bit but awesome formatting:
    return object.replace(/\[ {/g, '[\n  {').replace(/{/g , '{\n   ')
                .replace(/}/g, '\n  }').replace(/\]/g, '\n]');
  }
}

function prepareData(data) {
  const jsonKey = Object.keys(data)[0];
  const actualData = data[inflector.singularize(jsonKey)] || data[inflector.pluralize(jsonKey)];

  if (Array.isArray(actualData)) {
    return actualData.map((element, index) => removeCertainProperties(element));
  }

  return [ removeCertainProperties(actualData) ];
}

function removeCertainProperties(obj) {
  return Object.keys(obj).reduce((result, key, index) => {
    if (key === 'link') {
      return result;
    }

    if (obj[key] && obj[key].id) {
      serializationQueue.push(key, obj[key]);
      return result;
    }

    result[key] = obj[key];
    return result;
  }, {});
}
