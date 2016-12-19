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

    if (obj[key] && obj[key].id) {
      serializationQueue.push(key, obj[key]);
      return result;
    }

    result[key] = obj[key];
    return result;
  }, {});
}

function appendToFixtureFile(targetFile, newData) {
  // warning: this require() has caching:
  const existingData = require(`${process.cwd()}/${targetFile}`)['default'];
  const combinedData = _.uniqBy(existingData.concat(newData), 'id');

  console.log(`appending data to file: ${targetFile}`);

  writeToFixtureFile(targetFile, combinedData);
}

function writeToFixtureFile(targetFile, data) {
  const fixtureData = objectFormatter(
    util.inspect(data.sort((a, b) => {
      if (a.id > b.id) {
        return 1;
      }

      if (a.id < b.id) {
        return -1;
      }

      return 0;
    }), { depth: null })
  );

  writeToElixirFixtureFile(targetFile, fixtureData);
  fs.writeFileSync(targetFile, `export default ${fixtureData};`);

  console.log(chalk.green(`Data written to ${targetFile}`));
  console.log(chalk.yellow(`Fixture file has ${data.length} elements`));

  function objectFormatter(object) {
    return object.replace(/\[ {/g, '[\n  {').replace(/{/g , '{\n   ')
                .replace(/}/g, '\n  }').replace(/\]/g, '\n]');
  }
}

function writeToElixirFixtureFile(targetFile, fixtureData) {
  if (!fs.existsSync('../backend/test/support')) {
    // Ignoring elixir fixtures since no elixir backend found under ../backend/test/support'
    return;
  }

  const projectName = process.argv[3];
  const model = inflector.singularize(targetFile.replace('mirage/fixtures/', '').replace('.js', ''));
  const modelCamelCase = inflector.camelize(inflector.underscore(model));
  const modelPlural = inflector.underscore(inflector.pluralize(model));
  const elixirFixturePath = `../backend/test/support/fixtures/${inflector.underscore(model)}.ex`;

  if (projectName) {
    mkdirp('../backend/test/support/fixtures', (error) => {
      if (error) { throw error; }

      fs.writeFileSync(elixirFixturePath,`
defmodule ${projectName}.${modelCamelCase}Fixtures do
  alias ${projectName}.${modelCamelCase}

  def ${modelPlural} do
  ${formatJSObjectsToElixir(fixtureData)}
  end

  def insert_all do
    Repo.insert_all(${modelCamelCase}, ${modelPlural}, returning: true)
  end

  # maybe make this with (id) argument
  def insert do
    struct(${modelCamelCase}, List.first(${modelPlural})) |> Repo.insert!
  end
end
`.trim());

      console.log(chalk.cyan(`Data written to ${elixirFixturePath}`));
    });
  }

  function formatJSObjectsToElixir(fixtureData) {
    return fixtureData.replace(/\{/g, '%{').replace(/"/g, '\\"')
                    .replace(/\'/g, '"').replace(/(: null)/g, ": nil");
  }
}
