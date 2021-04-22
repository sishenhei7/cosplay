import os from 'os'
import chalk from 'chalk'
import { Worker as _Worker } from 'worker_threads'

interface NodeWorker extends _Worker {
  currentResolve: ((value: any) => void) | null
  currentReject: ((err: Error) => void) | null
}

export interface Options {
  max?: number
}

export class Worker<Args extends any[]> {
  private path!: string
  private max!: number
  private pool!: NodeWorker[]
  private idlePool!: NodeWorker[]
  private queue!: [(worker: NodeWorker) => void, (err: Error) => void][]

  constructor(path: string, options: Options = {}) {
    this.path = path
    this.max = options.max || Math.max(1, os.cpus().length - 1)
    this.pool = []
    this.idlePool = []
    this.queue = []

    if (!this.path) {
      console.log(chalk.red('WorkerPool: workerPath should not be null!'))
      process.exit(-1)
    }
  }

  async run(...args: Args) {
    const worker = await this._getAvailableWorker()
    return new Promise((resolve, reject) => {
      worker.currentResolve = resolve
      worker.currentReject = reject
      worker.postMessage(args)
    })
  }

  stop() {
    this.pool.forEach(w => w.unref())
    this.queue.forEach(([_, reject]) => reject(new Error('Main worker pool stopped before a worker was available.')))
    this.pool = []
    this.idlePool = []
    this.queue = []
  }

  private async _getAvailableWorker() {
    // has idle one?
    if (this.idlePool.length) {
      return this.idlePool.shift()!
    }

    // can spawn more?
    if (this.pool.length < this.max) {
      const worker = new _Worker(this.path) as NodeWorker

      worker.on('message', res => {
        worker.currentResolve && worker.currentResolve(res)
        worker.currentResolve = null
        this._assignDoneWorker(worker)
      })

      worker.on('error', err => {
        worker.currentReject && worker.currentReject(err)
        worker.currentReject = null
      })

      worker.on('exit', code => {
        const i = this.pool.indexOf(worker)
        if (i > -1) this.pool.splice(i, 1)
        if (code !== 0 && worker.currentReject) {
          worker.currentReject(new Error(`Worker stopped with non-0 exit code ${code}`))
          worker.currentReject = null
        }
      })

      this.pool.push(worker)
      return worker
    }

    // no one is available, we have to wait
    let resolve: (worker: NodeWorker) => void
    let reject: (err: Error) => any
    const onWorkerAvailablePromise = new Promise<NodeWorker>((r, rj) => {
      resolve = r
      reject = rj
    })
    this.queue.push([resolve!, reject!])
    return onWorkerAvailablePromise
  }

  private _assignDoneWorker(worker: NodeWorker) {
    // someone's waiting already?
    if (this.queue.length) {
      const [resolve] = this.queue.shift()!
      resolve(worker)
      return
    }
    // take a rest.
    this.idlePool.push(worker)
  }
}
