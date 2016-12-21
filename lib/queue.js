const Serializer = require('./serializer');

let modelQueues = {};

module.exports = {
  push: function(modelName, data) {
    const emberModelKey = formatName(modelName);
    const queue = modelQueues[emberModelKey];

    if (!queue) {
      return createQueue(emberModelKey, data);
    }

    return queue.push(data);
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
  Serializer.start({ [modelName]: modelQueues[modelName] });
}
