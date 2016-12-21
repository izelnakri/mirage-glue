const fs = require('fs');
const util = require('util');
const chalk = require('chalk');
const _ = require('lodash');

const ElixirFixture = require('./elixir-fixture');

module.exports = {
  appendFile: appendFile,
  writeFile: writeFile
};

function appendFile(targetFile, newData) {
  // warning: this require() has caching:
  const existingData = require(`${process.cwd()}/${targetFile}`)['default'];

  const combinedData = mergeFixtures(existingData, newData);

  console.log(`appending data to file: ${targetFile}`);

  writeFile(targetFile, combinedData);

  function mergeFixtures(existingData, newData) {
    return existingData.concat(newData).reduce((accum, element, index, array) => {
      const matches = array.filter((el) => el.id === element.id);
      const elementHasDuplication = matches.length > 1;

      if (!elementHasDuplication) {
        accum.push(element);
        return accum;
      }

      const newDataElement = newData.find((el) => el.id === element.id);

      if (!(accum.includes(newDataElement))) {
        accum.push(newDataElement);
      }

      return accum;
    }, []);
  }
}

function writeFile(targetFile, data) {
  const fixtureData = objectFormatter(
    util.inspect(data.sort((a, b) => {
      if (a.id > b.id) {
        return 1;
      }

      if (a.id < b.id) {
        return -1;
      }

      return 0;
    }), { depth: null, maxArrayLength: null })
  );

  ElixirFixture.writeFile(targetFile, fixtureData);
  fs.writeFileSync(targetFile, `export default ${fixtureData};`);

  console.log(chalk.green(`Data written to ${targetFile}`));
  console.log(chalk.yellow(`Fixture file has ${data.length} elements`));

  function objectFormatter(object) {
    return object.replace(/\[ {/g, '[\n  {').replace(/{/g , '{\n   ')
                .replace(/}/g, '\n  }').replace(/\]/g, '\n]');
  }
}
