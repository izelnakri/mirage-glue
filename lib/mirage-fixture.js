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

  writeFile(targetFile, combinedData, existingData);

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

function writeFile(targetFile, data, oldData) {
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

  const fileSizeInKb = (fs.statSync(targetFile).size / 1000.0).toFixed(2);

  console.log(chalk.green(`Data written to ${targetFile}`), `(File size: ${fileSizeInKb} KB)`);
  console.log(chalk.yellow(`Fixture file has ${data.length} records`), printDifference(data, oldData));

  function objectFormatter(object) {
    return object.replace(/\[ {/g, '[\n  {').replace(/{/g , '{\n   ')
                .replace(/}/g, '\n  }').replace(/\]/g, '\n]');
  }

  function printDifference(newData, oldData) {
    if (!oldData) {
      return chalk.green(`(+${newData.length})`);
    }

    const result = newData.length - oldData.length;

    return (result > 0) ? chalk.green(`(+${result})`) : chalk.yellow('(no changes)');
  }
}
