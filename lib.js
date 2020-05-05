const { exec, execSync } = require('child_process')
const fse = require('fs-extra')
const fs = require('fs')
const inquirer = require('inquirer')

const isOSX = process.platform === 'darwin'
const sslCertificateDir = `${process.env.HOME}/.self-signed-cert`
const sslConfigFile = `${sslCertificateDir}/ssl.cnf`
const sslKeyPath = `${sslCertificateDir}/ssl.key`
const sslCrtPath = `${sslCertificateDir}/ssl.crt`
const CN = 'genereted by trusted-cert'

const createCnfFile = ({ hosts }) => {
  fs.writeFileSync(sslConfigFile, `
[req] 
prompt = no 
default_bits = 4096
default_md = sha256
distinguished_name = dn 
x509_extensions = v3_req

[dn] 
C=CN
ST=ZheJiang
L=HangZhou
O=Alibaba
OU=AlimamaMux
CN=${CN}
emailAddress=yingchun.fyc@alibaba-inc.com

[v3_req]
basicConstraints=critical, CA:TRUE
keyUsage=nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage=serverAuth,clientAuth
subjectAltName=@alt_names

[alt_names]
${hosts.map((item, index) => {
    return `DNS.${index + 1} = ${item}`
}).join('\n')}
    `.trim())
}

const createConfigFile = async (options) => {
  await fse.ensureDir(sslCertificateDir)
  createCnfFile(options)
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
      resolve({
        success: false
      })
      return
    }
    resolve({
      success: true,
      sslKeyPath,
      sslCrtPath
    })
  })
})

const trustSelfSignedCert = () => new Promise((resolve, reject) => {
  exec(`sudo security add-trusted-cert \
    -d -r trustRoot \
    -k /Library/Keychains/System.keychain \
    ${sslCrtPath}`, (error, stdout, stderr) => {
    if (error) {
      resolve(false)
      return
    }
    resolve(true)
  })
})

/**
 * 获取钥匙串里指定名称的证书sha1列表
 * @param certName
 */
const getKeyChainCertSha1List = (certName) => new Promise((resolve, reject) => {
  let sha1List
  if (isOSX) {
    try {
      const sha1Str = isOSX && execSync(`security find-certificate -a -c '${certName}' -Z | grep ^SHA-1`, { encoding: 'utf-8' })
      sha1List = sha1Str.replace(/SHA-1\shash:\s/g, '').split('\n').filter(sha1 => sha1)
    } catch (error) {
      reject(error)
    }
  } else {
    sha1List = []
  }
  resolve(sha1List)
})

/**
 * 是否存在着存放证书的目录
 * @returns {*}
 */
const hasExistedCertDir = () => fs.existsSync(sslCertificateDir)

/**
 * 是否创建过密钥和证书
 * @returns {*}
 */
const hasExistedKeyAndCert = () => fs.existsSync(sslKeyPath) && fs.existsSync(sslCrtPath)

/**
 * 获取
 * @returns {{nameInKeyChain: string, sslCertificateDir: string}}
 */
const getSelfSignedInfo = () => ({
  nameInKeyChain: CN,
  sslCertificateDir
})

/**
 * 获取证书里支持的域名
 * @param sslCrtPath
 * @returns {*[]|*}
 */
const getCrtHosts = (sslCrtPath) => {
  let hosts
  try {
    hosts = execSync(`openssl x509 -in ${sslCrtPath} -noout -text | grep DNS`, { encoding: 'utf-8' }).trim().split(',').filter(item => item.includes('DNS:')).map(item => item.trim().replace(/DNS:/, ''))
  } catch (error) {
    return []
  }
  return hosts
}

/**
 * 证书是否被系统信任
 * @param sslCrtPath
 * @returns {boolean}
 */
const isCertTrusted = (sslCrtPath) => {
  const sha1List = getKeyChainCertSha1List()
  const sha1 = execSync(`openssl x509 -sha1 -in ${sslCrtPath} -noout -fingerprint`, { encoding: 'utf-8' }).split('=')[1].replace(/:/g, '').trim()
  let certTrusted = false
  if (sha1List.includes(sha1)) {
    certTrusted = true
  }
  return certTrusted
}
const getCertSha1 = (sslCertPath) => {
  const sha1 = execSync(`openssl x509 -sha1 -in ${sslCrtPath} -noout -fingerprint`, { encoding: 'utf-8' }).split('=')[1].replace(/:/g, '').trim()
  return sha1
}

/**
 * 删除钥匙串里指定的证书
 * @param sha1List
 * @returns {Promise<unknown>}
 */
const removeKeyChainCerts = (sha1List) => new Promise((resolve, reject) => {
  try {
    sha1List.forEach(sha1 => {
      execSync(`sudo security delete-certificate -Z ${sha1}`)
    })
    resolve()
  } catch (error) {
    reject(error)
  }
})

/**
 * 删除指定目录
 * @returns {*}
 */
export const rmCertDir = (dir) => new Promise((resolve, reject) => {
  try {
    execSync(`rm -rf ${dir}`)
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

const currentState = () => {
  const existSslKeyAndCrt = fs.existsSync(sslKeyPath) && fs.existsSync(sslCrtPath)
  if (!existSslKeyAndCrt) {
    console.log('还没有安装自签名证书，运行下面命令安装使用')
    console.log('$ trusted-cert install')
    return
  }
  console.log('密钥文件路径：', sslKeyPath)
  console.log('自签名证书文件路径：', sslCrtPath)
  console.log('自签名证书已经支持的域名：')
  const crtHosts = getCrtHosts()
  console.log(crtHosts.join(','))
  console.log('自签名证书的有效时间：')
  console.log(`${execSync(`openssl x509 -in ${sslCrtPath} -noout -dates`, { encoding: 'utf-8' })}`.trim())
  if (isOSX) {
    const sha1List = getKeyChainCertSha1List()
    const sha1 = execSync(`openssl x509 -sha1 -in ${sslCrtPath} -noout -fingerprint`, { encoding: 'utf-8' }).split('=')[1].replace(/:/g, '').trim()
    if (sha1List.includes(sha1)) {
      console.log('自签名证书已经添加到钥匙串并被始终信任')
      console.log(`自签名证书在钥匙串里的名称：${CN}`)
      console.log(`自签名证书在钥匙串里的sha-1：${sha1}`)
    } else {
      console.log('自签名证书还没被添加到钥匙串，可以运行下面命令，执行添加和始终信任')
      console.log('$ trusted-cert trust')
    }
  }
  console.log('')
  console.log('更多使用帮助')
  console.log('$ trusted-cert --help')
  console.log('')
  console.log('配置webpack的HTTPS证书示例')
  console.log('https://github.com/sprying/trusted-cert#webpack')
  console.log('配置nginx的HTTPS证书示例')
  console.log('https://github.com/sprying/trusted-cert#nginx')
  console.log('配置nodejs的HTTPS证书示例')
  console.log('https://github.com/sprying/trusted-cert#nodejs')

  console.log('')
  console.log('如有疑问联系@慧知')
}

