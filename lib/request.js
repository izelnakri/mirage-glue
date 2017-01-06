const http = require('http');
const chalk = require('chalk');

const request = (endpoint) => {
  return new Promise((resolve, reject) => {
    const url = buildUrl(endpoint);

    http.get(url, (res) => {
      const statusCode = res.statusCode;
      const contentType = res.headers['content-type'];

      let error;
      if (statusCode !== 200) {
        error = new Error(`Request Failed.\nStatus Code: ${statusCode}`);
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error(`Invalid content-type.\n` +
                          `Expected application/json but received ${contentType}`);
      }

      if (error) {
        console.log(chalk.red(error.message));
        // consume response data to free up memory
        res.resume();
        return reject(error);
      }

      res.setEncoding('utf8');

      let rawData = '';

      res.on('data', (chunk) => rawData += chunk);
      res.on('end', () => {
        try {
          let parsedData = JSON.parse(rawData);
          resolve(parsedData);
        } catch (e) {
          console.log(chalk.red(e.message));
          reject(e);
        }
      });
    }).on('error', (e) => {
      console.log(chalk.red(`Got error: ${e.message}`));
      reject(e);
    });
  });
};

module.exports = request;

function buildUrl(endpoint) {
  if (/(http:\/\/)|(https:\/\/)/g.test(endpoint)) {
    return endpoint;
  }

  return `http://${endpoint}`;
}
