import axios from 'axios'
import chalk from 'chalk'
import sourceMap from 'source-map'
import spinner from './utils/spinner'

export type Options = {
  msg: string
  path?: string
  line?: number
  column?: number
}

/**
 * example:
 * 1.cosplay sourcemap 'test is not defined\n at VueComponent.created (http://localhost:9528/static/js/app.js:26420:5)\n'
 * 2.cosplay sourcemap '' -p http://localhost:9528/static/js/app.js.map -l 26420 -c 5
 */
export class SourceMapHandler {
  private msg: string
  private path: string | null
  private line: number
  private column: number
  private httpReg = /\((http|https):\/\/([\w.]+\/?)\S*\)/g
  private cachedCourceMap = new Map()

  constructor(options: Options) {
    this.msg = options.msg
    this.path = options.path!
    this.line = options.line!
    this.column = options.column!
  }

  async getSourceMap(link: string) {
    if (this.cachedCourceMap.has(link)) {
      return Promise.resolve(this.cachedCourceMap.get(link))
    }

    return axios.get(link)
  }

  async decodeLink(link: string, line: number, column: number) {
    const res = await this.getSourceMap(link)
    const consumer = await new sourceMap.SourceMapConsumer(res.data)
    const result = consumer.originalPositionFor({ line, column })
    return `(${result.source}:${result.line}:${result.column})`
  }

  async replaceOneLink(linkString: string) {
    let link = linkString

    if (link.startsWith('(')) {
      link = link.substring(1)
    }

    if (link.endsWith(')')) {
      link = link.substring(0, link.length - 1)
    }

    const linkArr = link.split(':')
    link = linkArr.slice(0, 3).join(':')
    link = `${link}.map`

    const line = Number(linkArr[3])
    const column = Number(linkArr[4])
    const result = this.decodeLink(link, line, column)

    return result
  }

  async replaceAsync(str: string, regex: RegExp, asyncFn: (...args: any) => any) {
    const promises = [] as Promise<any>[]
    str.replace(regex, (match: string, ...args: any[]) => {
      const promise = asyncFn(match, ...args)
      promises.push(promise)
      return match
    })
    const data = await Promise.all(promises)
    return str.replace(regex, () => data.shift())
  }

  async run() {
    let result = ''
    const { msg, httpReg, path, line, column } = this

    spinner.start('Start decoding sourcemap...')

    if (path && line && column) {
      result = await this.decodeLink(path, line, column)
    } else if (msg) {
      result = await this.replaceAsync(msg, httpReg, this.replaceOneLink.bind(this))
    } else {
      spinner.stop()
      console.log(chalk.red('Invalid msg!'))
      process.exit(1)
    }

    spinner.stop()
    console.log(chalk.green('Sucess!'))
    process.stdout.write(result.replace(/\\n/g, '\n'))
  }
}
