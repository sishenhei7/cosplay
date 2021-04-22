import os from 'os'
import chalk from 'chalk'
import { join } from 'path'
import { Worker } from './utils/worker'
import { webVitals } from './utils/consts'

export type Options = {
  url: string
  times?: number
  concurrency?: number
}

export class PerformanceHandler {
  private url: string
  private times: number
  private concurrency: number

  constructor(options: Options) {
    this.url = options.url
    this.times = options.times || 1
    this.concurrency = options.concurrency || 1

    // 如果没有设置 concurrency，则使用最大并发
    if (options.times && options.times > 1 && !options.concurrency) {
      this.concurrency = Math.min(options.times, os.cpus().length - 1)
    }
  }

  async run() {
    const start = Date.now()
    const worker = new Worker(join(__dirname, './perf-worker.js'), {
      max: this.concurrency,
    })

    const promiseArr = Array(this.times)
      .fill(0)
      .map(() => worker.run(this.url))

    const resultsArr = await Promise.all(promiseArr)
    const webVitalKeys = Object.keys(webVitals)
    const result = resultsArr.reduce(
      (accu: any, curr: any) => {
        if (!curr || curr instanceof Error) {
          return accu
        }

        webVitalKeys.forEach((key: string) => {
          if (curr[key]) {
            const accuVal = accu[key] || 0
            const { times } = accu
            accu[key] = (accuVal * times + Number(curr[key])) / (times + 1)
          }
        })

        accu.times += 1
        return accu
      },
      { times: 0 },
    ) as any

    const timeConsuming = (Date.now() - start) / 1000
    console.log(
      chalk.magenta(`
========总共计算${this.times}次============
========成功${result.times}次=============
========并发为${this.concurrency}=========
========总耗时${timeConsuming}秒==========
========最后的平均结果是===================
      `),
    )

    delete result.times
    console.log(result)

    worker.stop()
    process.exit(1)
  }
}
