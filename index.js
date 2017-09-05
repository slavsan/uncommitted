const fs = require('fs')
const path = require('path')
const async = require('async')
const chalk = require('chalk')
const program = require('commander')
const simpleGit = require('simple-git')()

program
  .version('0.1.0')
  .option('-d, --directory <d>', 'Directory to check')
  .parse(process.argv);

if (!program.directory) {
  console.log(chalk.yellow('Directory not specified.'))
  return program.outputHelp()
}

if (!fs.existsSync(program.directory)) {
  return console.log(chalk.red('Directory does not exist: ', program.directory))
}

const getRepoSummary = (absolutePath, cb) => {
  if (fs.lstatSync(absolutePath).isDirectory()) {
    simpleGit.cwd(absolutePath).status((err, summary) => {
      return cb(err, { path: absolutePath, summary })
    })
  }
}

const reduceRepoDirs = (reduced, f) => {
  if (fs.existsSync(path.join(f, '.git'))) {
    reduced.push(f)
  }
  return reduced
}

fs.readdir(program.directory, (err, files) => {
  const absolutePathFiles = (
    files
      .map(f => path.join(program.directory, f))
      .reduce(reduceRepoDirs, [])
  )

  async.map(absolutePathFiles, getRepoSummary, (err, results) => {
    if (err) {
      return console.log(chalk.red(err))
    }
    results.forEach(res => {
      if (res.summary.files.length) {
        return console.log(res.path, chalk.yellow('uncommitted'))
      }

      console.log(res.path, chalk.green('ok'))
    })
  })
})
