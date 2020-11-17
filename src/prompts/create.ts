import fs from 'fs-extra'
import path from 'path'
import inquirer from 'inquirer'

export const askTemplateName = (templatePath: string) => {
  const templateChoices = fs.readdirSync(templatePath)
  const questions = [
    {
      type: 'list',
      name: 'template',
      message: 'What project template would you like to generate?',
      choices: templateChoices,
    },
  ]

  return inquirer.prompt(questions)
}

export const askProjectName = () => {
  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      validate: (value: string) => {
        if (/^([A-Za-z\-_\d])+$/.test(value)) {
          return true
        }
        return 'Project name may only include letters, numbers, underscores and hashes.'
      },
    },
  ]

  return inquirer.prompt(questions)
}
