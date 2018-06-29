'use strict';

const fs = require('fs');
const readline = require('readline');

const OUT = 'out/';

const prompt = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

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
  let argString = args.join();
  let realArgs = argString.split('-');
  if (realArgs[0]=='') { realArgs.shift(); }
  for (let arg in realArgs) {
    if (realArgs[arg].endsWith(',')) {
      realArgs[arg] = realArgs[arg].slice(0, realArgs[arg].length -1);
    }
  }
  return realArgs;
}

module.exports.OUT = OUT;
module.exports.cleanOutput = cleanOutput;
module.exports.getRealArguments = getRealArguments;
module.exports.prompt = prompt;
