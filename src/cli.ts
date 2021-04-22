#!/usr/bin/env node
import { Command, Option } from 'commander'
import chalk from 'chalk'
import leven from 'leven'
import figlet from 'figlet'
import { GitHandler } from './git'
import { CreateHandler } from './create'
import { PerformanceHandler } from './perf'

console.log(chalk.yellow(figlet.textSync('Cosplay', { horizontalLayout: 'full' })))

const program = new Command()

program.version(`cosplay ${require('../package.json').version}`).usage('<command> [options]')

program
  .command('create <app-name>')
  .description('create a new project powered by cosplay')
  .option('-t, --template <templateName>', 'Template name for the project')
  .action(async (name, cmd) => {
    const options = cleanArgs(cmd)
    const creator = new CreateHandler({
      projectName: name,
      templateName: options.templateName,
    })
    await creator.run()
  })

program
  .command('git')
  .description('create a new repo in github and push to it')
  .option('-n, --projectName <projectName>', 'Project name of the repository')
  .option('-d, --projectDesc <projectDesc>', 'Description of the repository')
  .option('-i, --install', 'Install dependencies')
  .action(async cmd => {
    const options = cleanArgs(cmd)
    const git = new GitHandler({
      name: options.projectName,
      desc: options.projectDesc,
      install: options.install,
    })
    await git.run()
  })

program
  .command('perf <url>')
  .description('get web performance(lcp, fcp, cls, dom-size) for a url')
  .option('-t, --times <times>', 'Times to run')
  .option('-c, --concurrency <concurrency>', 'concurrency for one run')
  .action(async (url, cmd) => {
    const options = cleanArgs(cmd)
    const performance = new PerformanceHandler({
      url: url,
      times: Number(options.times),
      concurrency: Number(options.concurrency),
    })
    await performance.run()
  })

// output help information on unknown commands
program.arguments('<command>').action(cmd => {
  program.outputHelp()
  console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`))
  console.log()
  suggestCommands(cmd)
})

// add some useful info on help
program.on('--help', () => {
  console.log()
  console.log(`  Run ${chalk.cyan(`cosplay <command> --help`)} for detailed usage of given command.`)
  console.log()
})

program.commands.forEach(c => c.on('--help', () => console.log()))
program.parse(process.argv)

function suggestCommands(unknownCommand: string) {
  const availableCommands = program.commands.map(cmd => cmd._name)

  let suggestion = ''

  availableCommands.forEach(cmd => {
    const isBestMatch = leven(cmd, unknownCommand) < leven(suggestion || '', unknownCommand)
    if (leven(cmd, unknownCommand) < 3 && isBestMatch) {
      suggestion = cmd
    }
  })

  if (suggestion) {
    console.log(`  ` + chalk.red(`Did you mean ${chalk.yellow(suggestion)}?`))
  }
}

function camelize(str: string) {
  return str.replace(/-(\w)/g, (_: string, c: string) => (c ? c.toUpperCase() : ''))
}

// commander passes the Command object itself as options,
// extract only actual options into a fresh object.
function cleanArgs(cmd: Command) {
  const args = {} as Record<string, any>
  cmd.options.forEach((o: Option) => {
    const key = camelize(o.long.replace(/^--/, ''))
    // if an option is not present and Command has a method with the same name
    // it should not be copied
    if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
      args[key] = cmd[key]
    }
  })
  return args
}
