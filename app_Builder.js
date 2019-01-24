'use strict';

const actions = require('./actions');
const bcd = require('mdn-browser-compat-data');
const { BCDManager } = require('./app_BCD.js');
const fs = require('fs');
const { help } = require('./help.js');
const page = require('./page.js');
const utils = require('./utils.js');

const FLAGS = {
  "-c":"--constructor",
  "--constructor":"--constructor",
  "-d": "--directive",
  "--directive": "--directive",
  "-e":"--event",
  "--event":"--event",
  "-h":"--handler",
  "-H":"--header",
  "--handler":"--handler",
  "--header":"--header",
  "-l":"--landing",
  "--landing":"--landing",
  "-m":"--method",
  "--method":"--method",
  "-p":"--property",
  "--property":"--property",
  "-r":"--reference",
  "--reference":"--reference",
  "-s": "--css",
  "--css": "--css"
}

class _Builder {
  constructor(interfaceData) {
    this._interfaceData = interfaceData;
  }

  _initPages() {
    args = this._normalizeArguments(this._interfaceData.command);
    let parentType = args[0];
    let parentName = args[1].split(',')[1];

    // Add space for interface or header name to sharedQuestions,
    //  and remove it from args.
    let introMessage = help.intro + (`-`.repeat(80)) + `\nSHARED QUESTIONS\n` + (`-`.repeat(80)) + `\n` + help.shared;
    let sharedQuestions = new page.Questions(introMessage);
    sharedQuestions[parentType] = parentName;
    sharedQuestions['name'] = parentName;
    sharedQuestions.add(parentType, parentName);

    // We no longer need the conent type and name.
    args.shift();
    args.shift();

    // Process remaining arguments.
    this.pages = new Array();
    args.forEach((arg, index, args) => {
      let members = arg.split(',');
        // Step 4. Ping MDN for page. If MDN page doesn't exist then do the next
        //  two steps. Also notify user that page already exists.
      let aPage = new page.Page(members[1], members[0], sharedQuestions);
      this.pages.push(aPage);
    });
  }

  _pageExists() {

  }

  _getNamedArg(arg) {
    if (arg in FLAGS) {
      return FLAGS[arg];
    } else {
      return arg;
    }
  }

  _normalizeArguments(args) {
    // Remove 'node index.js' from args.
    args.shift();
    args.shift();
    switch (args[0]) {
      case 'css':
        return this._normalizeCSSArgs(args);
        break;
      case 'header':
        if (!FLAGS[args[3]]) {
          throw new Error('This command requires more than one flag.');
        }
        return this._normalizeHeaderArgs(args);
        break;
      case 'interface':
        if (!FLAGS[args[3]]) {
          throw new Error('This command requires more than one flag.');
        }
        return this._normalizeInterfaceArgs(args);
        break;
    }
  }

  _normalizeCSSArgs(args) {
    let trueArgs = new Array();
    trueArgs.push(args[0]);
    trueArgs.push('n,' + args[2]);
    trueArgs.push('css,' + args[2]);
    return trueArgs;
  }

  _normalizeHeaderArgs(args) {
    let trueArgs = new Array();
    args.forEach((arg, index, args) => {
      arg = this._getNamedArg(arg);
      switch (arg) {
        case '--directive':
          trueArgs.push(arg);
          break;
        case '--header':
          trueArgs.push(arg);
          trueArgs.push(args[2]);
          break;
        default:
          trueArgs.push(arg);
      }
    });
    trueArgs = this._rearrangeArgs(trueArgs);
    return trueArgs;
  }

  _normalizeInterfaceArgs(args) {
    let trueArgs = new Array();
    args.forEach((arg, index, args) => {
      arg = this._getNamedArg(arg);
      switch (arg) {
        case '--constructor':
        case '--header':
        case '--reference':
          trueArgs.push(arg);
          trueArgs.push(args[2]);
          break;
        case '-it':
          const iterables = ['entries', 'forEach', 'keys', 'values'];
          iterables.forEach((functionName) => {
            trueArgs.push('-' + functionName);
            trueArgs.push(functionName);
          });
          break;
        case '-m':
        case '--method':
          if (args[index+1].endsWith(')')) {
            args[index+1] = args[index+1].slice(0, -1);
          }
          if (args[index+1].endsWith('(')) {
            args[index+1] = args[index+1].slice(0, -1);
          }
          trueArgs.push(arg);
          break;
        case '-mp':
          const maplike = ['clear', 'delete', 'entries', 'forEach', 'get', 'has', 'keys', 'set', 'size', 'values'];
          maplike.forEach((functionName) => {
            trueArgs.push('-' + functionName);
            trueArgs.push(functionName);
          });
          break;
        case '-mr':
          const readonlyMaplike = ['entries', 'forEach', 'get', 'has', 'keys', 'size', 'values'];
          readonlyMaplike.forEach((functionName) => {
            trueArgs.push('-' + functionName);
            trueArgs.push(functionName);
          });
          break;
        case '--landing':
          trueArgs.push(arg)
          trueArgs.push(args[2]);
          break;
        default:
          trueArgs.push(arg);
      };
    });

    trueArgs = this._rearrangeArgs(trueArgs);
    return trueArgs;
  }

  _rearrangeArgs(args) {
    for (let i = 0; i < args.length; i++) {
      if (args[i].startsWith('--')) {
        args[i] = args[i].replace('--', '@@');
      }
      if (args[i].startsWith('-')) {
        args[i] = args[i].replace('-', '@@');
      }
    }
    let argString = args.join();
    let arrangedArgs = argString.split('@@');
    if (arrangedArgs[0]=='') { arrangedArgs.shift(); }
    for (let arg in arrangedArgs) {
      if (arrangedArgs[arg].endsWith(',')) {
        arrangedArgs[arg] = arrangedArgs[arg].slice(0, arrangedArgs[arg].length -1);
      }
    }
    return arrangedArgs;
  }

  _writreBCD() {
    let name = this._interfaceData.name;
    if (bcd.api[name]) { return; }
    let bcdm = new BCDManager();
    let outPath = utils.OUT + name + '/';
    if (!fs.existsSync(outPath)) { fs.mkdirSync(outPath); }
    let outFilePath = outPath + name + '.json';
    bcdm.getBCD(this._interfaceData, outFilePath);
  }

  writeBCD(interfaceData) {
    let name = interfaceData.name
    if (bcd.api[name]) { return; }
    let bcdm = new BCDManager();
    let outPath = utils.OUT + name + '/';
    if (!fs.existsSync(outPath)) { fs.mkdirSync(outPath); }
    let outFilePath = outPath + name + '.json';
    bcdm.getBCD(interfaceData, outFilePath);
  }

  // Step 2. Get args from internal InterfaceData instance reference (and
  //  perhaps use an interface instead of commands.

  async build() {
    this._initPages();
    for (let p of this.pages) {
      await p.askQuestions();
      this.pages[p].write();
    }
  }

  async build_(args) {
    // Step 3. Pull writeBCD to an internal call.
    this._initPages(args);
    for (let p in this.pages) {
      await this.pages[p].askQuestions();
      this.pages[p].write();
    }
  }
}

module.exports.Builder = _Builder;
