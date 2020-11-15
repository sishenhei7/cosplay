'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.askRepoDetails = void 0
const path_1 = __importDefault(require('path'))
const minimist_1 = __importDefault(require('minimist'))
const inquirer_1 = __importDefault(require('inquirer'))
exports.askRepoDetails = () => {
  const argv = minimist_1.default(process.argv.slice(2))
  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Enter a name for the repository:',
      default: argv._[0] || path_1.default.basename(process.cwd()),
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
      name: 'body',
      default: argv._[1] || null,
      message: 'Optionally enter a description of the repository:',
    },
  ]
  return inquirer_1.default.prompt(questions)
}
