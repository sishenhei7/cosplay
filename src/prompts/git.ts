import path from 'path'
import inquirer from 'inquirer'

export const askGithubCredentials = () => {
  const questions = [
    {
      type: 'password',
      name: 'token',
      message: 'Enter your github access token:',
      validate: function (value: string) {
        if (value.length) {
          return true
        } else {
          return 'Please enter your github access token.'
        }
      },
    },
  ]

  return inquirer.prompt(questions)
}

export const askRepoDetails = (name: string, desc: string) => {
  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Enter a name for the repository:',
      default: name || path.basename(process.cwd()),
      validate: function (value: string) {
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

  return inquirer.prompt(questions)
}
