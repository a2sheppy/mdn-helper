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
    arg = _normalizeArg(arg);
    switch (arg) {
      case '--constructor':
      case '--header':
      case '--interface':
        newArgs.push(arg);
        newArgs.push(args[2]);
        break;
      case '-it':
        const iterables = ['entries', 'forEach', 'keys', 'values'];
        interables.forEach((functionName) => {
          newArgs.push('-' + functionName);
          newArgs.push(functionName);
        });
        break;
      case '-mp':
        const maplike = ['clear', 'delete', 'entries', 'forEach', 'get', 'has', 'keys', 'set', 'size', 'values'];
        maplike.forEach((functionName) => {
          newArgs.push('-' + functionName);
          newArgs.push(functionName);
        });
        break;
      case '-mr':
        const maplike = ['entries', 'forEach', 'get', 'has', 'keys', 'size', 'values'];
        maplike.forEach((functionName) => {
          newArgs.push('-' + functionName);
          newArgs.push(functionName);
        });
        break;
      case '--overview':
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
      newArgs[i] = newArgs[i].replace('--', '@@');
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

function _normalizeArg(arg) {
  let args = { "-c":"--constructor", "--constructor":"--constructor", "-d": "--directive", "--directive": "--directive", "-e":"--event", "--event":"--event", "-h":"--handler", "-H":"--header", "--handler":"--handler", "--header":"--header", "-i":"--interface", "--interface":"--interface", "-m":"--method", "--method":"--method", "-o":"--overview", "--overview":"--overview", "-p":"--property", "--property":"--property", "-s": "--css", "--css": "--css"}
  if (arg in args) {
    return args[arg];
  } else {
    return arg;
  }
}

function printHelp() {
  let doc = '';
  doc += 'Basic usage:\n';
  doc += '\tnode index.js [command] [arguments]\n';
  doc += `Commands:\n`;
  doc += '\tclean\n';
  doc += '\tcss -n _selectorName_\n';
  doc += '\theader -n _headerName_ [(-H | --header)] [(-d | --directive) _directiveName_]\n';
  doc += '\tinterface -n _interfaceName_ [-o] [-i] [-c] [-it] [-mp] [-mr]\n';
  doc += '\t\t[(-e | --event) _eventName_] [(-h | --handler) _handlerName_]\n';
  doc += '\t\t[(-m | --method) _methodName_] [(-p | --property) _propertyName_]\n';
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
