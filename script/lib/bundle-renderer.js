const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')
const electronLink = require('electron-link')
const terser = require('terser')
const CONFIG = require('../config')

module.exports = function () {
  const snapshotScriptPath = path.join(CONFIG.buildOutputPath, 'startup.js')
  const coreModules = new Set(['electron', 'atom', 'shell', 'WNdb', 'lapack', 'remote'])
  const baseDirPath = path.join(CONFIG.intermediateAppPath, 'static')
  const mainPath = path.resolve(baseDirPath, '..', 'src', 'initialize-application-window.js')
  let processedFiles = 0

  return electronLink({
    baseDirPath,
    mainPath: mainPath,
    cachePath: path.join(CONFIG.atomHomeDirPath, 'snapshot-cache'),
    auxiliaryData: CONFIG.snapshotAuxiliaryData,
    shouldExcludeModule: ({requiringModulePath, requiredModulePath}) => {
      if (processedFiles > 0) {
        process.stdout.write('\r')
      }
      process.stdout.write(`Generating snapshot script at "${snapshotScriptPath}" (${++processedFiles})`)

      const requiringModuleRelativePath = path.relative(baseDirPath, requiringModulePath)
      const requiredModuleRelativePath = path.relative(baseDirPath, requiredModulePath)
      return (
        requiredModulePath.endsWith('.node') ||
        coreModules.has(requiredModulePath) ||
        requiringModuleRelativePath.endsWith(path.join('node_modules/xregexp/xregexp-all.js')) ||
        (requiredModuleRelativePath.startsWith(path.join('..', 'src')) && requiredModuleRelativePath.endsWith('-element.js')) ||
        requiredModuleRelativePath.startsWith(path.join('..', 'node_modules', 'dugite')) ||
        requiredModuleRelativePath.endsWith(path.join('node_modules', 'coffee-script', 'lib', 'coffee-script', 'register.js')) ||
        requiredModuleRelativePath.endsWith(path.join('node_modules', 'fs-extra', 'lib', 'index.js')) ||
        requiredModuleRelativePath.endsWith(path.join('node_modules', 'graceful-fs', 'graceful-fs.js')) ||
        requiredModuleRelativePath.endsWith(path.join('node_modules', 'htmlparser2', 'lib', 'index.js')) ||
        requiredModuleRelativePath.endsWith(path.join('node_modules', 'minimatch', 'minimatch.js')) ||
        requiredModuleRelativePath.endsWith(path.join('node_modules', 'request', 'index.js')) ||
        requiredModuleRelativePath.endsWith(path.join('node_modules', 'request', 'request.js')) ||
        requiredModuleRelativePath.endsWith(path.join('node_modules', 'react', 'index.js')) ||
        requiredModuleRelativePath.endsWith(path.join('node_modules', 'react-dom', 'index.js')) ||
        requiredModuleRelativePath === path.join('..', 'exports', 'atom.js') ||
        requiredModuleRelativePath === path.join('..', 'src', 'electron-shims.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'atom-keymap', 'lib', 'command-event.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'babel-core', 'index.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'cached-run-in-this-context', 'lib', 'main.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'debug', 'node.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'git-utils', 'src', 'git.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'glob', 'glob.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'iconv-lite', 'lib', 'index.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'less', 'index.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'less', 'lib', 'less', 'fs.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'less', 'lib', 'less-node', 'index.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'lodash.isequal', 'index.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'node-fetch', 'lib', 'fetch-error.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'superstring', 'index.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'oniguruma', 'src', 'oniguruma.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'resolve', 'index.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'resolve', 'lib', 'core.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'scandal', 'lib', 'scandal.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'settings-view', 'node_modules', 'glob', 'glob.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'spellchecker', 'lib', 'spellchecker.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'spelling-manager', 'node_modules', 'natural', 'lib', 'natural', 'index.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'tar', 'tar.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'ls-archive', 'node_modules', 'tar', 'tar.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'temp', 'lib', 'temp.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'tmp', 'lib', 'tmp.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'tree-sitter', 'index.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'yauzl', 'index.js') ||
        requiredModuleRelativePath === path.join('..', 'node_modules', 'winreg', 'lib', 'registry.js')
      )
    }
  }).then(({snapshotScript}) => {
    process.stdout.write('\n')

    fs.writeFileSync(snapshotScriptPath + '-src.js', snapshotScript)
    process.stdout.write('Minifying startup script')
    const minification = terser.minify(snapshotScript, {
      keep_fnames: true,
      keep_classnames: true,
      compress: {keep_fargs: true, keep_infinity: true}
    })
    if (minification.error) {
      console.error(minification.error)
      throw minification.error
    }
    process.stdout.write('\n')
    fs.writeFileSync(snapshotScriptPath, minification.code)
    fs.renameSync(mainPath, mainPath + '.bak')
    fs.writeFileSync(mainPath, '')
  })
}