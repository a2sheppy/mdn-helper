'use strict';

const config = require('config');
const fs = require('fs');
const { help } = require('./help/help.js');
const { Questions } = require('./questions.js');
const utils = require('./utils.js');

const ANSWER_IS_NO = '';
const SKIP_KEY = config.get('Application.questionHiding.use');
const SKIP_KEYS = config.get('Application.questionHiding.' + SKIP_KEY);
const TOKEN_RE = /\[\[(?:shared:)?([\w\-]+)\]\]/;

class _Page {
  constructor(name, type, sharedQuestions) {
    this.name = name;
    this.type = type;
    this.sharedQuestions = sharedQuestions;

    // The type and name if the interface are also a question.
    this.sharedQuestions.add(type, name);
    let introMessage = `\nQuestions for the ${this.name} ${this.type} page\n` + (`-`.repeat(80)) +  help[this.type] + '\n';
    this.questions = new Questions(introMessage);
    this.questions.add(type, name);
    this.contents = utils.getTemplate(this.type);
    const reg = RegExp(TOKEN_RE, 'g');
    let matches;
    while ((matches = reg.exec(this.contents)) != null) {
      if (matches[0].startsWith('[[shared:')) {
        this.sharedQuestions.add(matches[1]);
      } else {
        this.questions.add(matches[1]);
      }
    }
  }

  async askQuestions(extraMessage) {
    if (this.sharedQuestions.needsAnswers()) {
      // extraMessage is proxy for whether this is a first call or
      // one generated by an action. Not ideal, but it's the best
      // currently available.
      if (extraMessage) {
        this.sharedQuestions.introMessage = "More shared questions found.\n" + (`-`.repeat(28))
      }
      await this._askQuestions(this.sharedQuestions);
    }
    if (this.questions.needsAnswers()) {
      if (extraMessage) {
        let len = extraMessage.length;
        extraMessage = extraMessage + '\n' + (`-`.repeat(len));
        this.questions.introMessage = extraMessage;
      }
      await this._askQuestions(this.questions);
    }
  }

  async _askQuestions(questionObject) {
    const questions = questionObject.questions;
    if (questionObject.needsAnswers()) {
      questionObject.printIntro();
    } else {
      return;
    }
    for (let q in questions) {
      if (questions[q].answer) { continue; }
      await questions[q].ask(this);
    }
  }

  render() {
    const reg = RegExp(TOKEN_RE);
    let matches;
    let answer;
    while ((matches = reg.exec(this.contents)) != null) {
      if (matches[0].startsWith('[[shared:')) {
        answer = this.sharedQuestions.questions[matches[1]].answer;
      } else {
        answer = this.questions.questions[matches[1]].answer
      }
      this.contents = this.contents.replace(matches[0], answer);
    }
  }

  write() {
    this.render();
    let outFolder = utils.OUT + '/' + this.sharedQuestions.name + '/';
    if (!fs.existsSync(outFolder)) { fs.mkdirSync(outFolder); }
    let outPath = outFolder + this.sharedQuestions.name + "_" + this.name + "_" + this.type + ".html";
    fs.writeFileSync(outPath, this.contents);
  }
}

module.exports.Page = _Page;
