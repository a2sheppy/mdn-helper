'use-strict';

const { Finder } = require('./finder.js');
const { printWelcome, update } = require('./utils.js');

// global.__basedir = __dirname;

printWelcome();
update(process.argv);

const finder = new Finder();
finder.findAndBuild(process.argv);
