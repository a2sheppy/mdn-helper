'use strict';

const cb = require('prompt-checkbox');
const Enquirer = require('enquirer');
const fm = require('./filemanager.js');
const radio = require('radio-symbol');
const utils = require('./utils.js');

async function find(interfaceNamed) {
  const idlSet = new fm.IDLFileSet();
  const matches = idlSet.findMatching(interfaceNamed);
  let names = [];
  for (let m in matches) {
    names.push(matches[m].name)
  }
  let enq = new Enquirer();
  enq.register('checkbox', cb);
  enq.question('idlFile', 'Which IDL file?', {
    type: 'checkbox',
    checkbox: radio.star,
    choices: names
  });
  await enq.prompt('idlFile')
  .then(answers => {
    // console.log(answers);
  })
  .catch(err => {
    // console.log(err);
  })
}

module.exports.create = create;
module.exports.find = find;
