'use strict';

const { Burner } = require('./app_Burn.js');
const { Directory } = require('./app_Directory.js');
const { Manual } = require('./app_manual.js');
const { InterfaceData } = require('./idl.js');
const utils = require('./utils.js');

utils.printWelcome();

let command;
try {
  command = utils.validateCommand(process.argv);
}
catch(e) {
  console.error(e.message);
  utils.printHelp();
  process.exit(1);
}

let dirApp;
switch (command) {
  case 'burn':
    let burner = new Burner();
    let includeFlags = false;
    if (['-f', '--flags'].includes(process.argv[3])) { includeFlags = true; }
    burner.burn(includeFlags)
    break;
  case 'clean':
    utils.cleanOutput()
    .then(() => { process.exit(); });
    break;
  case 'find':
    dirApp = new Directory();
    dirApp.findAndShow(process.argv[3]);
    break;
  case 'build':
    dirApp = new Directory();
    dirApp.findAndBuild(process.argv[3])
    .then((interfaces) => {
      const id = new InterfaceData(interfaces[0].path());
      const { Manual } = require('./app_manual.js');
      const manApp = new Manual(id.command);
      manApp.create();
    })
    break;
  case 'css':
  case 'header':
  case 'interface':
    const realArguments = utils.getRealArguments(process.argv);
    const manApp = new Manual(realArguments);
    manApp.create();
    break;
  case 'help':
  default:
    utils.printHelp();
}
