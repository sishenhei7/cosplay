import chalk from 'chalk'
import execa from 'execa'
import { Listr } from 'listr2'
import configstore from 'configstore'
import { Octokit } from '@octokit/rest'
import spinner from './utils/spinner'
import { askGithubCredentials, askRepoDetails } from './prompts/git'

class gitHandler {
  name: string
  desc: string
  isInstallDep: boolean
  conf: configstore
  token: string
  octokit: Octokit | null = null
  remoteURL = ''

  constructor(args: Record<string, any>) {
    this.name = args.name
    this.desc = args.desc
    this.isInstallDep = !!args.install
    this.conf = new configstore(require('../package.json').name)
    this.token = this.conf.get('github.token')

    if (this.token) {
      this.octokit = new Octokit({ auth: this.token })
    }
  }

  async githubAuth() {
    if (!this.token) {
      const res = await askGithubCredentials()
      this.token = res.token
      this.conf.set('github.token', this.token)
      this.octokit = new Octokit({ auth: this.token })
    }
  }

  async createRemoteRepo() {
    const res = await askRepoDetails(this.name, this.desc)
    const data = {
      name: res.name,
      body: res.desc,
    }

    spinner.start('Creating remote repository...')

    try {
      const res = await this.octokit!.repos.createForAuthenticatedUser(data)
      this.remoteURL = res.data.ssh_url
    } finally {
      spinner.stop()
    }
  }

  async setupRepo() {
    const cwd = process.cwd()
    spinner.start('Initializing local repository and pushing to remote...')

    try {
      await execa('git', ['init'], { cwd })
      await execa('git', ['add', '*'], { cwd })
      await execa('git', ['commit', '-m', 'first commit'], { cwd })
      await execa('git', ['branch', '-M', 'main'], { cwd })
      await execa('git', ['remote', 'add', 'origin', this.remoteURL], { cwd })
      await execa('git', ['push', '-u', 'origin', 'main'], { cwd })
    } finally {
      spinner.stop()
    }
  }

  async installDep() {
    const cwd = process.cwd()
    spinner.start('Initializing local repository and pushing to remote...')

    try {
      await execa('npm', ['install'], { cwd })
    } finally {
      spinner.stop()
    }
  }

  async run() {
    const tasks = new Listr([
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
    console.log(`${chalk.green('DONE')} Project ready`)
  }
}

export default gitHandler
