let sslCertificateDir = `${process.env.HOME}/.self-signed-cert`
let sslConfigFile = `${sslCertificateDir}/ssl.cnf`
let sslKeyPath = `${sslCertificateDir}/ssl.key`
let sslCrtPath = `${sslCertificateDir}/ssl.crt`
let CN = 'genereted by trusted-cert'
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
