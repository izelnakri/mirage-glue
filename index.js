#! /usr/bin/env node
require('babel-register')({
   presets: [ 'es2015' ]
});

const chalk = require('chalk');
const fs = require('fs');

const request = require('./lib/request');
const Serializer = require('./lib/serializer');

const endpoint = process.argv[2];

request(endpoint).then((data) => {
  if (!fs.existsSync('mirage')) {
    // helpful message for people who dont use mirage:
    console.log(chalk.red('Mirage folder doesn\'t exist for this directory!'));
    return;
  }

  Serializer.start(data);

  Serializer.flushQueue();
}).catch((error) => { throw error; });
