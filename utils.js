'use strict';

const config = require('config');
const fs = require('fs');
const readline = require('readline');

const OUT = config.get('Application.outputDirectory');
if (!fs.existsSync(OUT)) { fs.mkdirSync(OUT); }

const prompt = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function getConfig(parameter) {
  if (config.has('User.' + parameter)) {
    return config.get('User.' + parameter);
  }
  return config.get('Application.' + parameter);
}

function cleanOutput() {
  return new Promise((resolve, reject) => {
    let question = "Are you sure? Y or N";
    prompt.question(question, (answer) => {
      if (answer === 'Y') {
        console.log("Cleaning");
        fs.readdir(OUT, (e, files) => {
          files.forEach(file => {
            fs.unlinkSync(OUT + file);
          })
        })
      }
      resolve();
    });
  });
}

function getRealArguments(args) {
  args.shift();
  args.shift();
  let commands = ['clean', 'css', 'header', 'help', 'interface'];
  if (!commands.includes(args[0])) {
    throw new Error("The command must be one of clean, css, header, help, or interface.");
  }
  let newArgs = new Array();
  args.forEach((arg, index, args) => {
    switch (arg) {
      case '-c':
      case '--constructor':
      case '-h':
      case '-i':
        newArgs.push(arg);
        newArgs.push(args[2]);
        break;
      // UNTESTED
      // case '-it':
      //   const iterables = ['entries()', 'forEach()', 'keys()', 'values()'];
      //   interables.forEach((iterable) => {
      //     newArgs.push('-m');
      //     newArgs.push(iterable);
      //   });
      //   break;
      case '-o':
      case '-overview':
        newArgs.push(arg)
        newArgs.push((args[0] + '_overview'));
        break;
      default:
        newArgs.push(arg);
    };
  });

  let realArgs = new Array();
  realArgs.push(newArgs[0]);
  if (newArgs[0] in ['clean','help']) { return realArgs; }

  newArgs.shift();
  if (newArgs.length == 0) {
    throw new Error("This command requires flags.");
    printHelp();
  }
  for (let i = 0; i < newArgs.length; i++) {
    if (newArgs[i].startsWith('--')) {
      newArgs[i] = args[i].replace('--', '@@');
    }
    if (newArgs[i].startsWith('-')) {
      newArgs[i] = newArgs[i].replace('-', '@@');
    }
  }
  let argString = newArgs.join();
  // let realArgs = argString.split('@@');
  let argArray = argString.split('@@');
  if (argArray[0]=='') { argArray.shift(); }
  for (let arg in argArray) {
    if (argArray[arg].endsWith(',')) {
      argArray[arg] = argArray[arg].slice(0, argArray[arg].length -1);
    }
  }
  realArgs = realArgs.concat(argArray);
  return realArgs;
}

function printHelp() {
  let doc = '';
  doc += 'Basic usage:\n';
  doc += '\tnode index.js [command] [arguments]\n';
  doc += `Commands:\n`;
  doc += '\tclean\n';
  doc += '\tcss -n _selectorName_\n';
  doc += '\theader -n _headerName_ [-h] [(-d | --directive) _directiveName_]\n';
  doc += '\tinterface -n _interfaceName_ [-o] [-i] [-c]\n\t\t[(-m | --method) _methodName_] [(-p | --property) _propertyName_]\n';
  doc += '\thelp\n';
  doc += 'See the README file for details.\n'

  console.log(doc);
  process.exit();
}

function printWelcome() {
  console.clear();
  console.log("=".repeat(80));
  console.log(" ".repeat(30) + "Welcome to mdn-helper" + " ".repeat(29));
  console.log("=".repeat(80));
}

module.exports.OUT = OUT;
module.exports.cleanOutput = cleanOutput;
module.exports.getConfig = getConfig;
module.exports.getRealArguments = getRealArguments;
module.exports.printHelp = printHelp;
module.exports.printWelcome = printWelcome;
module.exports.prompt = prompt;
