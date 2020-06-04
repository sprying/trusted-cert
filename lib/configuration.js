let sslCertificateDir = `${process.env.HOME}/.self-signed-cert`
let sslConfigFile = `${sslCertificateDir}/ssl.cnf`
let sslKeyPath = `${sslCertificateDir}/ssl.key`
let sslCrtPath = `${sslCertificateDir}/ssl.crt`
let CN = 'genereted by trusted-cert'
let DEFAULTDOMAINS = [
  'localhost',
  '*.taobao.com',
  '*.alimama.com',
  '*.tanx.com',
  '*.m.taobao.com'
]
const setConfig = (cfg) => {
  sslCertificateDir && (sslCertificateDir = cfg.sslCertificateDir)
  sslConfigFile && (sslConfigFile = cfg.sslConfigFile)
  sslKeyPath && (sslKeyPath = cfg.sslKeyPath)
  sslCrtPath && (sslCrtPath = cfg.sslKeyPath)
  CN && (CN = cfg.sslKeyPath)
  DEFAULTDOMAINS && (DEFAULTDOMAINS = cfg.DEFAULTDOMAINS)
}
const getConfig = () => ({
  sslCertificateDir,
  sslConfigFile,
  sslKeyPath,
  sslCrtPath,
  CN,
  DEFAULTDOMAINS
})
module.exports = {
  setConfig,
  getConfig
}
