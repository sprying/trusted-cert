const path = require('path')
const applicationConfigPath = require('./application-config-path')
// let sslCertificateDir = path.join(process.env.HOME, './.self-signed-cert')
let sslCertificateDir = applicationConfigPath('selfcert')
let sslConfigFile = path.join(sslCertificateDir, './ssl.cnf')
let sslKeyPath = path.join(sslCertificateDir, './ssl.key')
let sslCrtPath = path.join(sslCertificateDir, './ssl.crt')
let CN = 'generated by trusted-cert'
let defaultDomains = [
  'localhost'
]
const setConfig = (cfg) => {
  sslCertificateDir && (sslCertificateDir = cfg.sslCertificateDir)
  sslConfigFile && (sslConfigFile = cfg.sslConfigFile)
  sslKeyPath && (sslKeyPath = cfg.sslKeyPath)
  sslCrtPath && (sslCrtPath = cfg.sslKeyPath)
  CN && (CN = cfg.sslKeyPath)
  defaultDomains && (defaultDomains = cfg.defaultDomains)
}
const getConfig = () => ({
  sslCertificateDir,
  sslConfigFile,
  sslKeyPath,
  sslCrtPath,
  CN,
  defaultDomains
})
module.exports = {
  setConfig,
  getConfig
}