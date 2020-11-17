import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
import ejs from 'ejs'
// import execa from 'execa'
import { Listr } from 'listr2'
// import spinner from './utils/spinner'
import { askTemplateName, askProjectName } from './prompts/create'

export default class createHandler {
  templateName = ''
  projectName = ''
  templateChoices: string[] = []
  projectPath = ''
  currentPath: string = process.cwd()
  templatePath: string = path.join(__dirname, '../templates')

  constructor(args: Record<string, any>) {
    this.templateName = args.templateName
    this.projectName = args.projectName
    this.templateChoices = fs.readdirSync(this.templatePath)
  }

  async getNames() {
    if (!this.templateName) {
      const res = await askTemplateName(this.templatePath)
      this.templateName = res.template
    } else if (!this.templateChoices.includes(this.templateName)) {
      console.log(chalk.red('Can not find the template you input, please select one!'))
      const res = await askTemplateName(this.templatePath)
      this.templateName = res.template
    }

    if (!this.projectName) {
      const res = await askProjectName()
      this.projectName = res.name
    }
  }

  async createProject() {
    this.projectPath = path.join(this.currentPath, this.projectName)

    if (fs.existsSync(this.projectPath)) {
      console.log(chalk.red(`Folder ${this.projectName} exists. Delete or use another name.`))
      return false
      // process.exit()
    }

    fs.mkdirSync(this.projectPath)
  }

  async copyTemplate() {
    const renderOption = { projectName: this.projectName }
    const directoryList = ['./']
    const templateRealPath = path.join(this.templatePath, this.templateName)
    const projectRealPath = path.join(this.currentPath, this.projectName)

    while (directoryList.length > 0) {
      const directory = directoryList.shift()
      const filesInDirectory = fs.readdirSync(path.join(templateRealPath, directory as string))

      filesInDirectory.forEach(file => {
        const directoryToFile = path.join(directory as string, file)
        const filePath = path.join(templateRealPath, directoryToFile)
        const writePath = path.join(projectRealPath, directoryToFile)
        const stats = fs.statSync(filePath)

        if (stats.isFile()) {
          let contents = fs.readFileSync(filePath, 'utf8')
          contents = ejs.render(contents, renderOption)
          fs.writeFileSync(writePath, contents, 'utf8')
        } else if (stats.isDirectory()) {
          fs.mkdirSync(writePath)
          directoryList.push(directoryToFile)
        }
      })
    }
  }

  async run() {
    const tasks = new Listr([
      {
        title: 'create project',
        task: async () => this.createProject(),
      },
      {
        title: 'copy template',
        task: async () => this.copyTemplate(),
      },
    ])

    await this.getNames()
    await tasks.run()
    console.log(`${chalk.green('DONE')} Project created`)
  }
}
