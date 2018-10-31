'use strict';

const bcd = require('mdn-browser-compat-data');
const utils = require('./utils.js');
const webidl2 = require('webidl2');

const RETRY_COUNT = 3;
const EMPTY_BURN_DATA = Object.freeze({
  key: null,
  bcd: null,
  mdn_url: null,
  mdn_exists: null,
  retry: RETRY_COUNT
});

class IDLError extends Error {
  constructor(message, fileName='', lineNumber='') {
    super(message, fileName, lineNumber);
  }
}

class InterfaceData {
  constructor(sourceFile) {
    this._loadTree(sourceFile);
    this._loadExtras();
    this._loadMembers();
  }

  _loadExtras() {
    if (!this._interface.extAttrs) { return; }
    let items = this._interface.extAttrs.items;
    this._signatures = [];
    for (let i in items) {
      switch (items[i].name) {
        case 'Constructor':
          this._constructor = true;
          if (items[i].name.signature) {
            this._signatures.push(items[i].name.signature.arguments);
          }
          break;
        case 'RuntimeEnabled':
          this._flag = items[i].rhs.value;
          break;
      }
    }
  }

  _loadTree(fileObject) {
    this.sourceContents = utils.getIDLFile(fileObject.path());
    let tree = webidl2.parse(this.sourceContents);
    for (let t in tree) {
      switch (tree[t].type) {
        case 'dictionary':
          const msg = `File ${fileObject.name} is for a dictionary.`;
          throw new IDLError(msg);
        case 'interface':
          this._interface = tree[t];
          break;
      }
    }
    if (!this._interface) {
      const msg = `The ${fileObject.path()} file does not contain interface data.`;
      throw new IDLError(msg);
    }
  }

  _getOperationSubType(member) {
    let name;
    if (member.stringifier) { return { "type": "stringifier", "name": null }; }
    if (member.getter) {
      if (member.body.name) {
        name = member.body.name.escaped;
      } else if (member.body.idlType) {
        name = member.body.idlType.baseName;
      } else if (member.extAttrs.items[0].rhs) {
        name = member.extAttrs.items[0].rhs.value;
      }
      return { "type": "getter", "name": name };
    }
    if (member.setter) {
      return { "type": "setter", "name": "[]"};
    }
    if (member.deleter) {
      return { "type": "deleter", "name": "deleter"};
    }
    name = member.body.name.escaped;
    return { "type": "method", "name": name };
  }

  _getAttributeSubType(member) {
    switch (member.idlType.baseName) {
      case 'EventHandler':
        return { "type": "eventhandler", "name": member.escapedName };
        break;
      case 'Promise':
        return { "type": "method", "name": member.escapedName };
        break;
      default:
        return { "type": "property", "name": member.escapedName };
    }
  }

  _getArgumentString(args) {
    let argString = '';
    if (args.length) {
      for (let a in args) {
        argString += (args[a].idlType.baseName + " " + args[a].name + ", ");
      }
      argString = argString.slice(0, -2); // Chop last comma and space.
    }
    return argString;
  }

  _getConstructors() {
    if (!this._interface.extAttrs) { return; }
    let extras = this._interface.extAttrs.items;
    let sig;
    for (let e in extras) {
      if (extras[e].name == 'Constructor') {
        if (extras[e].signature) {
          sig += (this._getArgumentString(extras[e].signature.arguments) || '');
        }
        this._signatures.push(sig);
      }
    }
  }

  _getOperationSubType(member) {
    let name;
    if (member.stringifier) { return { "type": "stringifier", "name": null }; }
    if (member.getter) {
      if (member.body.name) {
        name = member.body.name.escaped;
      } else if (member.body.idlType) {
        name = member.body.idlType.baseName;
      } else if (member.extAttrs.items[0].rhs) {
        name = member.extAttrs.items[0].rhs.value;
      }
      return { "type": "getter", "name": name };
    }
    if (member.setter) {
      return { "type": "setter", "name": "[]" };
    }
    if (member.deleter) {
      return { "type": "deleter", "name": "deleter" };
    }
    name = member.body.name.escaped;
    return { "type": "method", "name": name };
  }

  _getAttributeSubType(member) {
    switch (member.idlType.baseName) {
      case 'EventHandler':
        return { "type": "eventhandler", "name": member.escapedName };
        break;
      case 'Promise':
        return { "type": "method", "name": member.escapedName };
        break;
      default:
        return { "type": "property", "name": member.escapedName };
    }
  }

  _getArgumentString(args) {
    let argString = '';
    if (args.length) {
      for (let a in args) {
        argString += (args[a].idlType.baseName + " " + args[a].name + ", ");
      }
      argString = argString.slice(0, -1); // Chop last comma.
    }
    return argString;
  }

  _getConstructors() {
    if (!this._interface.extAttrs) { return; }
    let extras = this._interface.extAttrs.items;
    let sig;
    for (let e in extras) {
      if (extras[e].name == 'Constructor') {
        sig = "(";
        if (extras[e].signature) {
          sig += this._getArgumentString(extras[e].signature.arguments);
        }
        sig += ")";
      }
      this._signatures.push(sig);
    }
  }

  _loadMembers() {
    // START HERE: Test getConstructors().
    this._getConstructors();
    this._eventhandlers = [];
    this._getters = [];
    this._methods = [];
    this._properties = [];
    this._setters = [];
    let property;
    let subType;
    let args;
    let mems = this._interface.members;
    for (let m in mems) {
      switch (mems[m].type) {
        case 'attribute':
          subType = this._getAttributeSubType(mems[m]);
          property = subType;
          property.interface = subType.name;
          switch (subType.type) {
            case 'eventhandler':
              this._eventhandlers.push(property);
              break;
            case 'method':
              // args = this._getArguments(mems[m]);
              if (mems[m].body) {
                args = this._getArgumentString(mems[m].body.arguments);
                property.interface += ("(" + args + ")");
              }
              this._methods.push(property);
              break;
            case 'property':
              this._properties.push(property);
              break;
          }
          break;
        case 'operation':
          subType = this._getOperationSubType(mems[m]);
          switch (subType.type) {
            case 'getter':
              property = subType;
              property.interface = subType.name;
              this._getters.push(property);
              break;
            case 'method':
              property = subType;
              property.interface = subType.name;
              // args = this._getArguments(mems[m]);
              if (mems[m].body) {
                args = this._getArgumentString(mems[m].body.arguments);
                property.interface += ("(" + args + ")");
              }
              this._methods.push(property)
              break;
            case 'setter':
              property = subType;
              property.interface = subType.name;
              this._setters.push(property);
            case 'stringifier':
              //
              break;
          }
      }
    }
  }

  get burnRecords() {
    let keys = this.keys;
    let records = [];
    for (let k in keys) {
      let record = Object.assign({}, EMPTY_BURN_DATA);
      record.key = keys[k];
      let tokens = keys[k].split('.');
      let data = bcd.api[tokens[0]];
      if (data && tokens.length > 1) {
        data = bcd.api[tokens[0]][tokens[1]];
      }
      if (!data) {
        record.bcd = false;
        record.mdn_exists = false;
      } else {
        record.bcd = true;
        if (data.__compat) {
          // TO DO: Scheme and domain need to come off urls.
          record.mdn_url = data.__compat.mdn_url;
        } else {
          record.mdn_exists = false;
        }
      }
      records.push(record);
    }
    return records;
  }


    // let tokens = keys[k].split('.');
    // let data = bcd.api[tokens[0]];
    // if (data && tokens.length > 1) {
    //   data = bcd.api[tokens[0]][tokens[1]];
    // }
    // let record;
    // if (!data) {
    //   record = keys[k] + ",false,false";
    // } else {
    //   record = keys[k] + ",true,";
    //   if (data.__compat) {
    //     record += data.__compat.mdn_url;
    //   } else {
    //     record += false;
    //   }
    // }
    // console.log(record);

  get command() {
    let command = [];
    command.push('0');
    command.push('1');
    command.push('interface');
    command.push('-n');
    command.push(this.name);
    command.push('-o');
    command.push('-i');
    if (this.hasConstructor()) { command.push('-c'); }
    let methods = this.methods;
    for (let m in methods) {
      command.push('-m');
      command.push(method[m] + '()');
    }
    let properties = this.properties;
    for (let p in properties) {
      command.push('-p');
      command.push(properties[p]);
    }
    let cleanCommand = utils.getRealArguments(command);
    return cleanCommand;
  }

  get eventhandlers() {
    return this._eventhandlers;
  }

  get flag() {
    return this._flag;
  }

  set flag(flagName) {
    this._flag = flagName;
  }

  get getters() {
    return this._getters;
  }

  get interfaces() {
    return this._getIdentifiers('.', 'interface');
  }

  get keys() {
    return this._getIdentifiers('.');
  }

  get methods() {
    return this._methods;
  }

  get name() {
    return this._interface.name;
  }

  get properties() {
    return this._properties;
  }

  get signatures() {
    // Constructor signatures.
    return this._signatures;
  }

  get sourceContents() {
    return this._sourceContents;
  }

  set sourceContents(contents) {
    this._sourceContents = contents;
  }

  get tree() {
    return this._tree;
  }

  get urls() {
    return this._getIdentifiers('/');
  }

  _getIdentifiers(separator, type='name') {
    // The type argument should be 'name' or 'interface'.
    let identifiers = [];
    identifiers.push(this.name);
    if (this.hasConstructor()) {
      let idBase = this.name + separator + this.name;
      if (type == 'interface') {
        for (let s in this._signatures) {
          let sig = idBase + "(" + this._signatures[s] + ")";
          identifiers.push(sig);
        }
      } else {
        identifiers.push(idBase);
      }


      // let constr = this.name + separator + this.name;
      // if (type == 'interface') { constr += "()"; }
      // identifiers.push(constr);
    }
    for (let e in this._eventhandlers) {
      identifiers.push(this.name + separator + this._eventhandlers[e][type]);
    }
    for (let g in this._getters) {
      identifiers.push(this.name + separator + this._getters[g][type]);
    }
    for (let m in this._methods) {
      identifiers.push(this.name + separator + this._methods[m][type]);
    }
    for (let p in this._properties) {
      identifiers.push(this.name + separator + this._properties[p][type]);
    }
    for (let s in this._setters) {
      identifiers.push(this.name + this._setters[s][type]);
    }
    return identifiers;
  }

  hasConstructor() {
    return this._constructor;
  }
}

module.exports.InterfaceData = InterfaceData;
