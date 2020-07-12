const fs = require('fs')
const { exec, execSync } = require('child_process')
const { openssl } = require('./util')
const fse = require('fs-extra')
const { sync: rimraf } = require('rimraf')
const isOSX = process.platform === 'darwin'
const isWindow = process.platform === 'win32'
const isLinux = process.platform === 'linux'
const { getConfig } = require('./config')
const { sslCertificateDir, sslConfigFile, sslKeyPath, sslCrtPath, CN } = getConfig()
const createCnfFile = (domains) => {
  fs.writeFileSync(sslConfigFile, `
[req] 
prompt = no 
default_bits = 4096
default_md = sha256
distinguished_name = dn 
x509_extensions = v3_req

[dn] 
CN=${CN}

[v3_req]
basicConstraints=critical, CA:TRUE
keyUsage=nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage=serverAuth,clientAuth
subjectAltName=@alt_names

[alt_names]
${domains.map((item, index) => {
    return `DNS.${index + 1} = ${item}`
}).join('\n')}
    `.trim())
}

const createConfigFile = async (domains) => {
  await fse.ensureDir(sslCertificateDir)
  createCnfFile(domains)
}

const createSSLKeyAndCrt = () => new Promise((resolve, reject) => {
  exec(`openssl req \
    -new \
    -newkey rsa:2048 \
    -sha1 \
    -days 3650 \
    -nodes \
    -x509 \
    -keyout ${sslKeyPath} \
    -out ${sslCrtPath} \
    -config ${sslConfigFile}`, (error, stdout, stderr) => {
    if (error) {
      reject(error)
      return
    }
    resolve()
  })
})

/**
 * 添加到系统钥匙串，信任证书
 * @returns {Promise<void>}
 */
const addToKeyChain = () => require(`./platform/${process.platform}`).addStore(sslCrtPath)

/**
 * 获取钥匙串里工具创建的证书sha1列表
 * @param certName
 */
const getKeyChainCertSha1List = require(`./platform/${process.platform}`).getKeyChainCertSha1List.bind(null, CN)

/**
 * 获取证书里支持的域名
 * @param sslCrtPath
 * @returns {string[]}
 */
const getCrtHosts = () => {
  if (isWindow) {
    // return openssl(['x509', '-in', sslCrtPath, '-noout', '-text', '|', 'findstr', 'DNS']).trim().split(',').filter(item => item.includes('DNS:')).map(item => item.trim().replace(/DNS:/, ''))
    return execSync(`openssl x509 -in ${sslCrtPath} -noout -text | findstr DNS`, { encoding: 'utf-8' }).trim().split(',').filter(item => item.includes('DNS:')).map(item => item.trim().replace(/DNS:/, ''))
  } else {
    return execSync(`openssl x509 -in '${sslCrtPath}' -noout -text | grep DNS`, { encoding: 'utf-8' }).trim().split(',').filter(item => item.includes('DNS:')).map(item => item.trim().replace(/DNS:/, ''))
  }
}

/**
 * 获取证书的有效时间
 * @returns {*}
 */
const getCertValidPeriod = () => {
  return openssl(['x509', '-in', sslCrtPath, '-noout', '-dates'], { encoding: 'utf-8' }).trim()
  // return `${execSync(`openssl x509 -in ${sslCrtPath} -noout -dates`, { encoding: 'utf-8' })}`.trim()
}
/**
 * 证书是否被添加到系统钥匙串
 * @param sslCrtPath
 * @returns {boolean}
 */
const isCertTrusted = () => {
  const sha1List = getKeyChainCertSha1List()
  const sha1 = getCertSha1()
  let certTrusted = false
  if (sha1List.includes(sha1)) {
    certTrusted = true
  }
  return certTrusted
}

/**
 * 获取证书的sha1值
 * @param sslCertPath
 * @returns {string}
 */
const getCertSha1 = () => {
  return openssl(['x509', '-sha1', '-in', sslCrtPath, '-noout', '-fingerprint'], { encoding: 'utf-8' }).split('=')[1].replace(/:/g, '').trim()
}

/**
 * 删除钥匙串里指定的证书
 * @param sha1List
 * @returns {Promise<unknown>}
 */
const rmKeyChainCertsBySha1List = require(`./platform/${process.platform}`).rmKeyChainCertsBySha1List

/**
 * 是否创建过密钥和证书
 * @returns {boolean}
 */
const hasExistedKeyAndCert = () => fs.existsSync(sslKeyPath) && fs.existsSync(sslCrtPath)

/**
 * 删除指定目录
 * @returns {*}
 */
const rmDir = (dir) => new Promise((resolve, reject) => {
  try {
    // execSync(`rm -rf ${dir}`)
    rimraf(dir)
    resolve()
  } catch (e) {
    if (e.stderr && e.stderr.includes('Permission denied')) {
      try {
        execSync(`sudo rm -rf ${dir}`)
        resolve()
      } catch (e) {
        reject(e)
      }
    } else {
      reject(e)
    }
  }
})

module.exports = {
  hasExistedKeyAndCert,
  rmKeyChainCertsBySha1List,
  getCertSha1,
  isCertTrusted,
  getCertValidPeriod,
  getCrtHosts,
  getKeyChainCertSha1List,
  addToKeyChain,
  createSSLKeyAndCrt,
  createConfigFile,
  rmDir
}
