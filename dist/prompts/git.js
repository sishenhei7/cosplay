'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.askRepoDetails = exports.askGithubCredentials = void 0
const path_1 = __importDefault(require('path'))
const inquirer_1 = __importDefault(require('inquirer'))
exports.askGithubCredentials = () => {
  const questions = [
    {
      type: 'password',
      name: 'token',
      message: 'Enter your github access token:',
      validate: function (value) {
        if (value.length) {
          return true
        } else {
          return 'Please enter your github access token.'
        }
      },
    },
  ]
  return inquirer_1.default.prompt(questions)
}
exports.askRepoDetails = (name, desc) => {
  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Enter a name for the repository:',
      default: name || path_1.default.basename(process.cwd()),
      validate: function (value) {
        if (value.length) {
          return true
        } else {
          return 'Please enter a name for the repository.'
        }
      },
    },
    {
      type: 'input',
      name: 'desc',
      default: desc || null,
      message: 'Optionally enter a description of the repository:',
    },
  ]
  return inquirer_1.default.prompt(questions)
}
