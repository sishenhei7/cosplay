#!/usr/bin/env node
'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
const commander_1 = require('commander')
const chalk_1 = __importDefault(require('chalk'))
const leven_1 = __importDefault(require('leven'))
// import { version } from '../package.json'
const program = new commander_1.Command()
program.version(`cosplay ${require('../package.json').version}`).usage('<command> [options]')
program
  .command('create <app-name>')
  .description('create a new project powered by cosplay')
  .option('-p, --preset <presetName>', 'Skip prompts and use saved or remote preset')
  .option('-d, --default', 'Skip prompts and use default preset')
  .option('-i, --inlinePreset <json>', 'Skip prompts and use inline JSON string as preset')
  .option('-m, --packageManager <command>', 'Use specified npm client when installing dependencies')
  .option('-r, --registry <url>', 'Use specified npm registry when installing dependencies (only for npm)')
  .option('-g, --git [message]', 'Force git initialization with initial commit message')
  .option('-n, --no-git', 'Skip git initialization')
  .option('-f, --force', 'Overwrite target directory if it exists')
  .option('--merge', 'Merge target directory if it exists')
  .option('-c, --clone', 'Use git clone when fetching remote preset')
  .option('-x, --proxy <proxyUrl>', 'Use specified proxy when creating project')
  .option('-b, --bare', 'Scaffold project without beginner instructions')
  .option('--skipGetStarted', 'Skip displaying "Get started" instructions')
  .action((name, cmd) => {
    console.log('name', name)
    console.log('cmd', cleanArgs(cmd))
  })
// output help information on unknown commands
program.arguments('<command>').action(cmd => {
  program.outputHelp()
  console.log(`  ` + chalk_1.default.red(`Unknown command ${chalk_1.default.yellow(cmd)}.`))
  console.log()
  suggestCommands(cmd)
})
// add some useful info on help
program.on('--help', () => {
  console.log()
  console.log(`  Run ${chalk_1.default.cyan(`cosplay <command> --help`)} for detailed usage of given command.`)
  console.log()
})
program.commands.forEach(c => c.on('--help', () => console.log()))
program.parse(process.argv)
function suggestCommands(unknownCommand) {
  const availableCommands = program.commands.map(cmd => cmd._name)
  let suggestion = ''
  availableCommands.forEach(cmd => {
    const isBestMatch = leven_1.default(cmd, unknownCommand) < leven_1.default(suggestion || '', unknownCommand)
    if (leven_1.default(cmd, unknownCommand) < 3 && isBestMatch) {
      suggestion = cmd
    }
  })
  if (suggestion) {
    console.log(`  ` + chalk_1.default.red(`Did you mean ${chalk_1.default.yellow(suggestion)}?`))
  }
}
function camelize(str) {
  return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''))
}
// commander passes the Command object itself as options,
// extract only actual options into a fresh object.
function cleanArgs(cmd) {
  const args = {}
  cmd.options.forEach(o => {
    const key = camelize(o.long.replace(/^--/, ''))
    // if an option is not present and Command has a method with the same name
    // it should not be copied
    if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
      args[key] = cmd[key]
    }
  })
  return args
}
