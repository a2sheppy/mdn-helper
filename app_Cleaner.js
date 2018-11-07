'use strict';

const fs = require('fs');
const cb = require('prompt-checkbox');
const Enquirer = require('enquirer');
const radio = require('radio-symbol');
const utils = require('./utils.js');

class _Cleaner {
  constructor() {
    this._directories = this._getDirList();
  }

  _getDirList() {
    const dirContents = fs.readdirSync(utils.OUT, {withFileTypes: true});
    let newList = [];
    for (let d of dirContents) {
      if (d.isDirectory()) { newList.push(d); }
    }
    return newList;
  }

  async _select() {
    let dirs = [];
    for (let d of this._directories) { dirs.push(d.name); }
    const enq = new Enquirer();
    enq.register('checkbox', cb);
    enq.question('outputDirs', 'which output directories do you want to delete?', {
      type: 'checkbox',
      // checkbox: radio.star,
      choices: dirs
    });
    let answers = await enq.prompt('outputDirs');
    return answers.outputDirs;
  }

  async _clean(dirsToDelete) {
    const enq = new Enquirer();
    const options = { message: "Are you sure? Y or N?" };
    enq.question('confirm', options);
    const answer = await enq.prompt('confirm');
    if (answer.confirm.toLowerCase() == 'y') {
      console.log("Removing selected directories.");
      for (let d in dirsToDelete) {
        console.log(`\tDeleting ${dirsToDelete[d]}.`);
        utils.deleteUnemptyFolder(utils.OUT + dirsToDelete[d]);
      }
      console.log('\n');
    } else {
      console.log('Will not delete selected directories.\n');
    }
  }

  async clean() {
    let dirsToDelete = await this._select();
    await this._clean(dirsToDelete);
  }
}

module.exports.Cleaner = _Cleaner;
