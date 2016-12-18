require('babel-register')({
   presets: [ 'es2015' ]
});

const chalk = require('chalk');
const fs = require('fs');
const util = require('util');

const request = require('./custom-request');

const endpoint = process.argv[2];

// singular endpoint vs plural endpoint: /companies/:id vs /companies needs tests
request(endpoint).then((data) => {
  const jsonModelKey = Object.keys(data)[0];
  const targetData = ignoreCertainProperties(data, endpoint);
  const targetFile = `./mirage/fixtures/${jsonModelKey}.js`;

  if (fs.existsSync(targetFile)) {
    const currentData = require(targetFile)['default'];
    const newData = Object.assign({}, currentData, targetData);

    fs.writeFile(targetFile, 'export default ' + util.inspect(newData) + ';', (error) => {
      console.log(chalk.green('appending operation finished for ' + targetFile));
    });
  }

  fs.writeFile(targetFile, 'export default ' + util.inspect(targetData) + ';', (error) => {
    console.log(chalk.green('write operation finished for ' + targetData));
  });
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
