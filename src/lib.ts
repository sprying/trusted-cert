import fs from 'fs'
import { execSync } from 'child_process'
import fse from 'fs-extra'
import { sync as rimraf } from 'rimraf'
import Debug from 'debug'
import Moment from 'moment'
import { sync as commandExists } from 'command-exists'
import forge from 'node-forge'
import isIp from 'is-ip'
import { promisify } from 'util'
import randomInt from 'random-int'
import { getConfig } from './config/index'
import { openssl } from './util'
import { getKeyChainCertSha1List } from './platform'

const pki = forge.pki
const generateKeyPair = promisify(pki.rsa.generateKeyPair.bind(pki.rsa))

// const isOSX = process.platform === 'darwin'
const isWindow = process.platform === 'win32'
// const isLinux = process.platform === 'linux'

async function generateCert (hosts: string[]): Promise<void> {
  // certificate Attributes: https://git.io/fptna
  const attributes = [
    { name: 'commonName', value: CN }
  ]

  let ipNum = 1
  const domains = hosts.filter(host => {
    return !isIp(host) || (isIp(host) && host !== '127.0.0.1' && ++ipNum <= 5)
  })

  // required certificate extensions for a certificate authority
  const extensions = [
    { name: 'basicConstraints', cA: true, critical: true },
    // { name: 'keyUsage', keyCertSign: true, critical: true }
    // { name: 'basicConstraints', cA: false, critical: true },
    { name: 'keyUsage', digitalSignature: true, keyEncipherment: true, nonRepudiation: true },
    { name: 'extKeyUsage', serverAuth: true, clientAuth: true },
    {
      name: 'subjectAltName',
      altNames: domains.map(domain => {
        const types = { domain: 2, ip: 7 } // available Types: https://git.io/fptng
        if (isIp(domain)) return { type: types.ip, ip: domain }
        return { type: types.domain, value: domain }
      })
    }
  ]
  const serial = randomInt(50000, 99999).toString()
  const keyPair = await generateKeyPair({ bits: 2048, workers: 4 })
  const cert = pki.createCertificate()

  cert.publicKey = keyPair.publicKey
  cert.serialNumber = Buffer.from(serial).toString('hex') // serial number must be hex encoded
  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date()
  cert.validity.notAfter.setDate(cert.validity.notAfter.getDate() + 365)
  cert.setSubject(attributes)
  cert.setIssuer(attributes)
  cert.setExtensions(extensions)

  // sign the certificate with it's own private key if no separate signing key is provided
  const signWith = keyPair.privateKey
  cert.sign(signWith, forge.md.sha256.create())

  await fse.ensureDir(sslCertificateDir)
  fs.writeFileSync(sslKeyPath, pki.privateKeyToPem(keyPair.privateKey))
  fs.writeFileSync(sslCrtPath, pki.certificateToPem(cert))
}

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
${ips.map((item, index) => {
    return `IP.${index + 1} = ${item}`
}).join('\n')}
`.trim())
}

export const createConfigFile = async (hosts: string[]): Promise<void> => {
  const domains = hosts.filter(host => !isIp(host))
  const ips = hosts.filter(host => isIp(host) && host !== '127.0.0.1').slice(-4)
  await fse.ensureDir(sslCertificateDir)
  createCnfFile({ domains, ips: ['127.0.0.1'].concat(ips) })
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

export const createSSLKeyAndCrtV2: (domains: string[]) => Promise<void> = async (domains) => {
  await generateCert(domains)
  debug('成功创建密钥和证书文件')
}

/**
 * 获取证书里支持的域名
 */
export const getCrtHosts = (): string[] => {
  if (process.env.NO_OPENSSL === 'true' || !commandExists('openssl')) {
    const cert = forge.pki.certificateFromPem(fs.readFileSync(sslCrtPath, 'utf8'))
    const domains: string[] = []
    const ips: string[] = []
    const subjectAltName = cert.getExtension('subjectAltName') as {
      altNames: Array<{
        type: 2 | 7
        value: string
        ip: string
      }>
    } | undefined
    if (subjectAltName !== undefined) {
      subjectAltName.altNames.forEach(host => {
        if (host.type === 2) domains.push(host.value)
        else if (host.type === 7) ips.push(host.ip)
      })
    }
    return domains.concat(ips)
  } else {
    if (isWindow) {
      return execSync(`openssl x509 -in ${sslCrtPath} -noout -text | findstr DNS`, { encoding: 'utf-8' }).trim().split(',').filter(item => item.includes('DNS:') || item.includes('IP Address:')).map(item => item.trim().replace(/DNS:/, '').replace('IP Address:', ''))
    } else {
      return execSync(`openssl x509 -in '${sslCrtPath}' -noout -text | grep DNS`, { encoding: 'utf-8' }).trim().split(',').filter(item => item.includes('DNS:') || item.includes('IP Address:')).map(item => item.trim().replace(/DNS:/, '').replace('IP Address:', ''))
    }
  }
}

/**
 * 获取证书的有效时间
 */
export const getCertValidPeriod = (): string => {
  if (process.env.NO_OPENSSL === 'true' || !commandExists('openssl')) {
    const cert = forge.pki.certificateFromPem(fs.readFileSync(sslCrtPath, 'utf8'))
    return [cert.validity.notBefore, cert.validity.notAfter].map(item => {
      return Moment(item).format('YYYY-MM-DD HH:mm:ss')
    }).join(' ~ ')
  } else {
    return openssl(['x509', '-in', sslCrtPath, '-noout', '-dates'], { encoding: 'utf-8' }).trim().split('\n').map(item => {
      return Moment(new Date(item.replace(/\w+=/, ''))).format('YYYY-MM-DD HH:mm:ss')
    }).join(' ~ ')
  }
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
  if (process.env.NO_OPENSSL === 'true' || !commandExists('openssl')) {
    const cert = forge.pki.certificateFromPem(fs.readFileSync(sslCrtPath, 'utf8'))
    const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes()
    const m = forge.md.sha1.create()
    // @ts-expect-error
    m.start()
    m.update(der)
    // @ts-expect-error
    const fingerprint = m.digest().toHex().match(/.{2}/g).join(':').toUpperCase()
    return fingerprint.replace(/:/g, '').trim()
  } else {
    return openssl(['x509', '-sha1', '-in', sslCrtPath, '-noout', '-fingerprint'], { encoding: 'utf-8' }).split('=')[1].replace(/:/g, '').trim()
  }
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
