'use strict';

const { Builder } = require('./app_Builder.js');
const { Burner } = require('./app_Burn.js');
const { Cleaner } = require('./app_Cleaner.js');
const { Finder } = require('./app_Finder.js');
const utils = require('./utils.js');

utils.printWelcome();

let command;
try {
  command = utils.validateCommand(process.argv);
} catch (e) {
  console.error(e.message);
  utils.printHelp();
  process.exit(1);
}

let finder;
switch (command) {
  case 'burn':
    let burner = new Burner();
    burner.burn(process.argv)
    break;
  case 'clean':
    let cleaner = new Cleaner();
    cleaner.clean();
    break;
  case 'find':
    finder = new Finder();
    finder.findAndShow(process.argv);
    break;
  case 'build':
    finder = new Finder();
    finder.findAndBuild(process.argv)
    break;
  case 'css':
  case 'header':
  case 'interface':
    const builder = new Builder();
    builder.build(process.argv);
    break;
  case 'help':
  default:
    utils.printHelp();
}
