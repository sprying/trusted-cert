import fs from 'fs'
import { execSync } from 'child_process'
import fse from 'fs-extra'
import { sync as rimraf } from 'rimraf'
import Debug from 'debug'
import Moment from 'moment'
import { getConfig } from './config/index'
import { openssl } from './util'
import { getKeyChainCertSha1List } from './platform'

// const isOSX = process.platform === 'darwin'
const isWindow = process.platform === 'win32'
// const isLinux = process.platform === 'linux'

const debug = Debug('trusted-cert:lib')
const { sslCertificateDir, sslConfigFile, sslKeyPath, sslCrtPath, CN } = getConfig()
const createCnfFile = ({ domains, ips }: { domains: string[], ips: string[] }): void => {
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
IP.1 = 127.0.0.1
${ips.map((item, index) => {
    return `IP.${index + 2} = ${item}`
}).join('\n')}
`.trim())
}

export const createConfigFile = async (hosts: string[]): Promise<void> => {
  const domains = hosts.filter(host => !/^\d([\d]*\.)+\d$/.test(host))
  const ips = hosts.filter(host => /^\d([\d]*\.)+\d$/.test(host) && host !== '127.0.0.1').slice(-4)
  await fse.ensureDir(sslCertificateDir)
  createCnfFile({ domains, ips })
  debug('成功创建证书配置文件')
}

export const createSSLKeyAndCrt = async (): Promise<void> => await new Promise((resolve, reject) => {
  try {
    openssl(['req', '-new', '-newkey', 'rsa:2048', '-sha1', '-days', '3650',
      '-nodes', '-x509', '-keyout', sslKeyPath, '-out', sslCrtPath, '-config', sslConfigFile])
    debug('成功创建密钥和证书文件')
    resolve()
  } catch (e) {
    reject(e)
  }
})

/**
 * 获取证书里支持的域名
 */
export const getCrtHosts = (): string[] => {
  if (isWindow) {
    return execSync(`openssl x509 -in ${sslCrtPath} -noout -text | findstr DNS`, { encoding: 'utf-8' }).trim().split(',').filter(item => item.includes('DNS:') || item.includes('IP Address:')).map(item => item.trim().replace(/DNS:/, '').replace('IP Address:', ''))
  } else {
    return execSync(`openssl x509 -in '${sslCrtPath}' -noout -text | grep DNS`, { encoding: 'utf-8' }).trim().split(',').filter(item => item.includes('DNS:') || item.includes('IP Address:')).map(item => item.trim().replace(/DNS:/, '').replace('IP Address:', ''))
  }
}

/**
 * 获取证书的有效时间
 */
export const getCertValidPeriod = (): string => {
  return openssl(['x509', '-in', sslCrtPath, '-noout', '-dates'], { encoding: 'utf-8' }).trim().split('\n').map(item => {
    return Moment(new Date(item.replace(/\w+=/, ''))).format('YYYY-MM-DD HH:mm:ss')
  }).join(' ~ ')
}
/**
 * 证书是否被添加到系统钥匙串
 */
export const isCertTrusted = (): boolean => {
  const sha1List = getKeyChainCertSha1List(CN)
  const sha1 = getCertSha1()
  debug(`已经添加信任的证书sha1${sha1List.join(',')}`)
  debug(`证书文件的sha1${sha1}`)
  let certTrusted = false
  if (sha1List.includes(sha1)) {
    certTrusted = true
  }
  return certTrusted
}

/**
 * 获取缓存的证书文件里的sha1值
 */
export const getCertSha1 = (): string => {
  return openssl(['x509', '-sha1', '-in', sslCrtPath, '-noout', '-fingerprint'], { encoding: 'utf-8' }).split('=')[1].replace(/:/g, '').trim()
}

/**
 * 是否创建过密钥和证书的缓存文件
 */
export const hasExistedKeyAndCert = (): boolean => fs.existsSync(sslKeyPath) && fs.existsSync(sslCrtPath)

/**
 * 删除指定目录
 */
export const rmDir = async (dir: string): Promise<void> => await new Promise((resolve, reject) => {
  try {
    // execSync(`rm -rf ${dir}`)
    rimraf(dir)
    resolve()
  } catch (e) {
    if (e?.stderr?.includes('Permission denied') === true) {
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
