require('babel-register')({
   presets: [ 'es2015' ]
});

// maybe take chalk to a seperate file
const chalk = require('chalk');
const fs = require('fs');
const util = require('util');

const request = require('./custom-request');

const endpoint = process.argv[2];
// const targetFile = process.argv[3];

// singular endpoint vs plural endpoint: /companies/:id vs /companies
request(endpoint).then((data) => {
  // find the model and mirage fixture file location
  const jsonModelKey = Object.keys(data)[0];

  // check if mirage file exists

  // read + parse that file

  // merge it with targetData

  // object processing to ignore links and other hasOne embeds, if there is hasOne add it to seperate file
  let targetData = ignoreCertainProperties(data, endpoint);

  fs.writeFile(targetFile, 'export default ' + util.inspect(targetData) + ';', (error) => {
    console.log(chalk.green('write operation finished'));
  });
}).catch(() => {});


function ignoreCertainProperties(data, endpoint) {
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
