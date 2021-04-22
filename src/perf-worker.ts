import { URL } from 'url'
import chalk from 'chalk'
import puppeteer from 'puppeteer-core'
import lighthouse from 'lighthouse'
import { parentPort } from 'worker_threads'
import { findChrome } from './utils/find-chrome'
import { webVitals } from './utils/consts'

export interface Audits {
  [metric: string]: {
    numericValue?: number
  }
}

export type webVitalKey = keyof typeof webVitals

export type Report = {
  [vital in webVitalKey]?: number
}

const puppeteerConfig = {
  headless: true,
  chromeFlags: ['--no-sandbox'],
  executablePath: findChrome(),
}

const lighthouseConfig = {
  config: {
    onlyCategories: ['performance'],
    logLevel: 'error',
    output: 'json',
    throttlingMethod: 'simulate',
    throttling: { rttMs: 28, throughputKbps: 16000, cpuSlowdownMultiplier: 4 },
  },
}

const lighthouseOptions = {
  extends: 'lighthouse:default',
  settings: {
    maxWaitForFcp: 15 * 1000,
    maxWaitForLoad: 35 * 1000,
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10 * 1024,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0, // 0 means unset
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    emulatedUserAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4420.0 Safari/537.36 Chrome-Lighthouse',
    // Skip the h2 audit so it doesn't lie to us. See https://github.com/GoogleChrome/lighthouse/issues/6539
    skipAudits: ['uses-http2'],
  },
}

const getReport = async (url: string) => {
  const browser = await puppeteer.launch(puppeteerConfig)
  const endpoint = browser.wsEndpoint() // Allows us to talk via DevTools protocol
  const endpointURL = new URL(endpoint) // Lighthouse only cares about the port, so we have to parse the URL so we can grab the port to talk to Chrome on
  const lighthouseReport = await lighthouse(
    url,
    {
      ...puppeteerConfig,
      ...lighthouseConfig,
      port: endpointURL.port,
    },
    lighthouseOptions,
  )
  const audits = lighthouseReport?.lhr?.audits
  await browser.close()
  return audits
}

const formatReport = (audits: Audits) => {
  const report = {} as Report
  Object.keys(webVitals).forEach((key: string) => {
    const webVitalData = audits![webVitals[key as webVitalKey]]
    report[key as webVitalKey] = webVitalData?.numericValue
  })
  return report
}

const runWorker = async (url: string) => {
  let result = null
  console.log(chalk.yellow(`worker started: generating performance for ${url}...`))

  try {
    const audits = await getReport(url)
    result = formatReport(audits)

    console.log(chalk.green('worker ended: succeed to generate performance!'))
    console.log('result', result)
  } catch (err) {
    console.log(chalk.red('worker ended: failed to launch lighthouse!'))
    console.log(err)
    process.exit(0)
  }

  return result
}

parentPort?.on('message', async (url: string) => {
  const res = await runWorker(url)
  parentPort?.postMessage(res)
})
