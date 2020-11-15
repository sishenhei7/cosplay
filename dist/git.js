'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
const chalk_1 = __importDefault(require('chalk'))
const execa_1 = __importDefault(require('execa'))
const listr2_1 = require('listr2')
const configstore_1 = __importDefault(require('configstore'))
const rest_1 = require('@octokit/rest')
const spinner_1 = __importDefault(require('./utils/spinner'))
const git_1 = require('./prompts/git')
class gitHandler {
  constructor(args) {
    this.octokit = null
    this.remoteURL = ''
    this.name = args.name
    this.desc = args.desc
    this.isInstallDep = !!args.install
    this.conf = new configstore_1.default(require('../package.json').name)
    this.token = this.conf.get('github.token')
    if (this.token) {
      this.octokit = new rest_1.Octokit({ auth: this.token })
    }
  }
  async githubAuth() {
    if (!this.token) {
      const res = await git_1.askGithubCredentials()
      this.token = res.token
      this.conf.set('github.token', this.token)
      this.octokit = new rest_1.Octokit({ auth: this.token })
    }
  }
  async createRemoteRepo() {
    const res = await git_1.askRepoDetails(this.name, this.desc)
    const data = {
      name: res.name,
      body: res.desc,
    }
    spinner_1.default.start('Creating remote repository...')
    try {
      const res = await this.octokit.repos.createForAuthenticatedUser(data)
      this.remoteURL = res.data.ssh_url
    } finally {
      spinner_1.default.stop()
    }
  }
  async setupRepo() {
    const cwd = process.cwd()
    spinner_1.default.start('Initializing local repository and pushing to remote...')
    try {
      await execa_1.default('git', ['init'], { cwd })
      await execa_1.default('git', ['add', '*'], { cwd })
      await execa_1.default('git', ['commit', '-m', 'first commit'], { cwd })
      await execa_1.default('git', ['branch', '-M', 'main'], { cwd })
      await execa_1.default('git', ['remote', 'add', 'origin', this.remoteURL], { cwd })
      await execa_1.default('git', ['push', '-u', 'origin', 'main'], { cwd })
    } finally {
      spinner_1.default.stop()
    }
  }
  async installDep() {
    const cwd = process.cwd()
    spinner_1.default.start('Initializing local repository and pushing to remote...')
    try {
      await execa_1.default('npm', ['install'], { cwd })
    } finally {
      spinner_1.default.stop()
    }
  }
  async run() {
    const tasks = new listr2_1.Listr([
      // {
      //   title: 'auth to github',
      //   task: async () => this.githubAuth(),
      // },
      // {
      //   title: 'create remote repo',
      //   task: async () => this.createRemoteRepo(),
      // },
      // {
      //   title: 'set up repo',
      //   task: async () => this.setupRepo(),
      // },
      {
        title: 'Install dependencies',
        task: async () => this.installDep(),
        skip: () => (!this.isInstallDep ? 'Pass --install to automatically install dependencies' : false),
      },
    ])
    await this.githubAuth()
    await this.createRemoteRepo()
    await this.setupRepo()
    await tasks.run()
    console.log(`${chalk_1.default.green('DONE')} Project ready`)
  }
}
exports.default = gitHandler
