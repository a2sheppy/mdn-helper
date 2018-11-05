'use strict';

const { Burner } = require('./app_Burn.js');
const { Cleaner } = require('./cleaner.js');
const { Directory } = require('./app_Directory.js');
const { Manual } = require('./app_manual.js');
const utils = require('./utils.js');

utils.printWelcome();

let command;
try {
  // command = utils.validateCommand(process.argv);
  command = process.argv[3];
}
catch(e) {
  console.error(e.message);
  utils.printHelp();
  process.exit(1);
}

let dirApp;
switch (command) {
  case 'burn':
    let burner = new Burner(process.argv);
    burner.burn()
    break;
  case 'clean':
    let cleaner = new Cleaner();
    cleaner.clean();
    break;
  case 'find':
    dirApp = new Directory();
    dirApp.findAndShow(process.argv);
    break;
  case 'build':
    dirApp = new Directory();
    dirApp.findAndBuild(process.argv)
    break;
  case 'css':
  case 'header':
  case 'interface':
    const realArguments = utils.normalizeInterfaceArgs(process.argv);
    const manApp = new Manual(realArguments);
    manApp.create();
    break;
  case 'help':
  default:
    utils.printHelp();
}
