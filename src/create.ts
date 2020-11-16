import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
// import ejs from 'ejs'
// import execa from 'execa'
// import { Listr } from 'listr2'
// import spinner from './utils/spinner'
import { askTemplateName, askProjectName } from './prompts/create'

export default class createHandler {
  templateName = ''
  projectName = ''
  templateChoices: string[] = []
  projectPath = ''
  currentPath: string = process.cwd()
  templatePath: string = path.join(__dirname, 'templates')

  constructor(args: Record<string, any>) {
    this.templateName = args.templateName
    this.projectName = args.projectName
    this.templateChoices = fs.readdirSync(this.templatePath)
  }

  async getNames() {
    if (!this.templateName) {
      const res = await askTemplateName()
      this.templateName = res.template
    } else if (!this.templateChoices.includes(this.templateName)) {
      console.log(chalk.red('Can not find the template you input, please select one!'))
      const res = await askTemplateName()
      this.templateName = res.template
    }

    if (!this.projectName) {
      const res = await askProjectName()
      this.projectName = res.name
    }
  }

  createProject() {
    this.projectPath = path.join(this.currentPath, this.projectName)

    if (fs.existsSync(this.projectPath)) {
      console.log(chalk.red(`Folder ${this.projectName} exists. Delete or use another name.`))
      return false
    }

    fs.mkdirSync(this.projectPath)
  }

  copyTemplate() {
    // const directoryList = [path.join(this.templatePath, this.templateName)]
    // while (directoryList.length > 0) {
    //   const directory = directoryList.shift()
    //   const filePath = path.join(this.templatePath, directory)
    //   const writePath = path.join(this.currentPath, this.projectName, directory)
    // }
    // this.templateChoices.forEach(file => {
    //   const filePath = path.join(this.templatePath, file)
    //   const writePath = path.join(this.currentPath, this.projectName, file)
    //   // get stats about the current file
    //   const stats = fs.statSync(filePath);
    //   if (stats.isFile()) {
    //     let contents = fs.readFileSync(filePath, 'utf8')
    //     contents = ejs.render(contents, { projectName: this.projectName })
    //     fs.writeFileSync(writePath, contents, 'utf8');
    //   } else if (stats.isDirectory()) {
    //     fs.mkdirSync(writePath)
    //     this.copyTemplate(path.join(this.templatePath, file), path.join(this.projectName, file));
    //   }
    // });
  }
}
