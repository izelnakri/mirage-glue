const getDirName = require('path').dirname;
const fs = require('fs');
const _ = require('lodash');
const mkdirp = require('mkdirp');
const inflector = require('i')();

const ArgumentParser = require('./argument-parser');
const MirageFixture = require('./mirage-fixture');

let modelQueues = {};

module.exports = {
  start: startSerialization,
  flushQueue: function() {
    SerializationQueue.flushAll();
  }
};

const SerializationQueue = {
  push: function(modelName, data) {
    const emberModelKey = formatName(modelName);
    const queue = modelQueues[emberModelKey];

    if (!queue) {
      return createQueue(emberModelKey, data);
    }

    queue.push(data);
  },
  flushAll: function() {
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
  const queue = modelQueues[modelName];
  startSerialization({ [modelName]: _.uniqBy(queue, 'id') });
}

function startSerialization(data) {
  const jsonModelKey = inflector.pluralize(Object.keys(data)[0]);
  const targetData = prepareData(data);

  const targetFile = `mirage/fixtures/${inflector.dasherize(jsonModelKey)}.js`;

  if (!fs.existsSync(targetFile)) {
    return mkdirp(getDirName(targetFile), (error) => {
      if (error) { throw error;  }

      return MirageFixture.writeFile(targetFile, targetData);
    });
  }

  MirageFixture.appendFile(targetFile, targetData);
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
    if (key === 'links') {
      return result;
    }

    if (!ArgumentParser.get('ignore-nesting') && obj[key] && obj[key].id) {
      SerializationQueue.push(key, obj[key]);
      removeCertainProperties(obj[key]);
      return result;
    } else if (!ArgumentParser.get('ignore-nesting') && _.isArray(obj[key])) {
      obj[key].forEach((element, index) => {
        SerializationQueue.push(key, element);
        removeCertainProperties(obj[key][index]);
      });

      return result;
    }

    result[key] = obj[key];
    
    return result;
  }, {});
}
