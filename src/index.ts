import fs from 'fs'
import inquirer from 'inquirer'
import { sync as commandExists } from 'command-exists'
import Debug from 'debug'
import { setConfig, getConfig } from './config'
import {
  hasExistedKeyAndCert,
  getCrtHosts,
  createConfigFile,
  createSSLKeyAndCrt,
  getCertValidPeriod,
  getCertSha1,
  isCertTrusted,
  rmDir
} from './lib'
import {
  addToKeyChain,
  getKeyChainCertSha1List,
  delTrusted
} from './platform'
import { isMatched, getAdded } from './util'
import { mergeLan, getLan } from './i18n/zh-cn'

const debug = Debug('trusted-cert')
const { sslCertificateDir, sslKeyPath, sslCrtPath, CN, defaultDomains } = getConfig()
const lan = getLan()

/**
 * 判断没安装过证书给提示
 */
const judgeExistAndPrint = (): boolean => {
  if (!hasExistedKeyAndCert()) {
    console.warn(lan.host_add_no_install ?? '还没有安装自签名证书，运行下面命令安装使用')
    console.warn(lan.host_add_no_install_operation_tip ?? '$ trusted-cert install')
    return false
  }
  return true
}

/**
 * cli交互方式获取支持的域名
 */
const getInquirerAnswer = async (): Promise<string[]> => {
  const questions = [{
    type: 'input',
    name: 'domains',
    message: (defaultDomains.length > 0) ? lan.install_inquirer_domains_with_default : lan.install_inquirer_domains,
    default: defaultDomains.join(',')
  }]
  const { domains } = await inquirer.prompt<{ domains: string }>(questions)
  let domainList: string[]
  if (domains !== '') {
    domainList = domains.split(',').map(item => item.trim()).filter(Boolean)
  } else {
    return []
  }
  domainList = domainList.reduce<string[]>((accumulator, currentValue) => {
    !accumulator.includes(currentValue) && accumulator.push(currentValue)
    return accumulator
  }, [])
  return domainList
}

export const install = async (): Promise<boolean> => {
  if (!commandExists('openssl')) {
    throw new Error('OpenSSL not found: OpenSSL is required to generate SSL certificates - make sure it is installed and available in your PATH')
  }
  const sha1List = getKeyChainCertSha1List(CN)
  const existCrtDir = fs.existsSync(sslCertificateDir)
  if (sha1List.length !== 0 || existCrtDir) {
    const message = lan.install_has_installed_delete_tip ?? '继续操作会覆盖该工具已创建的证书'
    const answer = await inquirer.prompt<{ continue: boolean }>([{
      type: 'confirm',
      name: 'continue',
      message,
      default: false
    }])
    if (!(answer.continue && await uninstall())) return false
    if (!answer.continue) return false
    console.log(lan.install_del_installed_process_creating ?? '正在创建证书...')
  }
  const domains = await getInquirerAnswer()
  try {
    await createConfigFile(domains)
    await createSSLKeyAndCrt()
    console.log(lan.install_create_key_cert_file_success ?? '成功创建密钥和自签名证书文件')
  } catch (e) {
    console.log(lan.install_create_key_cert_file_failure ?? '创建密钥和自签名证书文件失败')
  }

  console.log(lan.install_add_keychain_process_tip ?? '向系统的钥匙串里添加证书并始终信任...')
  try {
    addToKeyChain(sslCrtPath)
    console.log(lan.install_add_keychain_success ?? '添加并信任成功，钥匙串里名称为：', CN)
  } catch (e) {
    console.warn(lan.install_add_keychain_failure ?? '钥匙串添加证书失败')
  }

  console.log(lan.install_over ?? '安装结束')
  lan.install_over_extra_info.forEach(text => {
    console.log(text)
  })
  return info()
}

export const uninstall = async (): Promise<boolean> => {
  const sha1List = getKeyChainCertSha1List(CN)
  const existCrtDir = fs.existsSync(sslCertificateDir)
  if ((sha1List.length === 0) && !existCrtDir) {
    console.warn(lan.uninstall_unfound ?? '没有找到该工具安装的证书')
    return true
  }

  if (sha1List.length > 0) {
    console.log(lan.uninstall_del_keychain ?? '正在删除钥匙串里名称「%s」的证书', CN)
    try {
      await delTrusted(CN)
      console.log(lan.uninstall_del_keychain_success ?? '删除成功')
    } catch (error) {
      console.error(lan.uninstall_del_keychain_failure ?? '删除失败，流程结束')
      return false
    }
  }
  if (existCrtDir) {
    try {
      await rmDir(sslCertificateDir)
      console.log(lan.uninstall_rm_dir_success ?? '已经删除存放密钥和证书的目录%s', sslCertificateDir)
    } catch (e) {
      console.log(lan.uninstall_rm_dir_failure ?? '删除存放原证书的目录失败，流程结束')
      return false
    }
  }
  console.log(lan.uninstall_complete ?? '删除完成')
  return true
}

export const doTrust = async (): Promise<boolean> => {
  if (!judgeExistAndPrint()) return false

  const sha1List = getKeyChainCertSha1List(CN)
  debug('已添加到钥匙串sha1列表 %o', sha1List)
  const sha1 = getCertSha1()
  debug('要新增的sha1是 %o', sha1)
  if (sha1List.includes(sha1)) {
    console.log(lan.add_trust_repeat_add_tip ?? '钥匙串里已经添加过，无须重复添加')
    console.log(lan.add_trust_keychain_cert_info ?? '在钥匙串里证书的信息：')
    console.log(lan.add_trust_keychain_cert_name ?? '名称: ', CN)
    console.log(lan.add_trust_keychain_cert_sha1 ?? 'sha-1: ', sha1)
    return true
  } else {
    try {
      addToKeyChain(sslCrtPath)
      console.log(lan.add_trust_keychain_cert_success ?? '添加并信任成功，钥匙串里名称是：', CN)
    } catch (e) {
      console.error(lan.add_trust_failure ?? '添加失败')
      return false
    }
  }
  return true
}

type IaddHosts = (hosts: string[]) => Promise<boolean>
export const addHosts: IaddHosts = async (hosts = []) => {
  if (hosts.length === 0) {
    console.warn(lan.host_add_no_input ?? '输入要支持的host')
    return false
  }
  if (!judgeExistAndPrint()) return false

  const crtHosts = getCrtHosts()
  const matched = isMatched(crtHosts, hosts)
  if (matched) {
    console.warn(lan.host_add_has_supported_no_needed_added ?? '证书已经支持该域名，无须添加了')
    return true
  }
  const addedHosts = getAdded(crtHosts, hosts)
  const executeHosts = crtHosts.concat(addedHosts)

  const sha1List = getKeyChainCertSha1List(CN)
  if (sha1List.length > 0) {
    console.log(lan.host_add_need_rebuild_and_trusted ?? '新增域名需要更新证书并重新信任')
  } else {
    console.log(lan.host_add_being_upgrading ?? '正在更新证书')
  }
  try {
    await delTrusted(CN)
  } catch (error) {
    console.error(lan.host_add_failure ?? '新增域名失败')
    return false
  }
  try {
    await rmDir(sslCertificateDir)

    await createConfigFile(executeHosts)

    await createSSLKeyAndCrt()
    // 之前添加到系统信任中
    if (sha1List.length > 0) {
      addToKeyChain(sslCrtPath)
    }
    console.log(lan.host_add_success ?? '更新成功')
    console.log(lan.host_add_success_support_hosts ?? '更新后支持的域名列表')
    const crtHosts = getCrtHosts()
    console.log(crtHosts.join(','))
    console.log(lan.host_add_cert_valid_period ?? '更新后证书的起止有效时间：')
    console.log(getCertValidPeriod())

    if (sha1List.length === 0) {
      console.warn(lan.host_add_trusted_suggestion ?? '请运行 trusted-cert trust 信任证书')
    }
    return true
  } catch (e) {
    console.error(lan.host_add_failure ?? '新增域名失败')
    return false
  }
}

function certificateFor (options?: { silent: boolean }): Promise<{ key: Buffer, cert: Buffer, keyFilePath: string, certFilePath: string, trusted: boolean }>

async function certificateFor (hosts?: string | string[] | { silent: boolean }, options?: { silent: boolean }): Promise<{ key: Buffer, cert: Buffer, keyFilePath: string, certFilePath: string, trusted: boolean }> {
  let silent: boolean = false
  if (!Array.isArray(hosts) && typeof hosts !== 'string') {
    silent = hosts?.silent ?? false
    hosts = defaultDomains
  } else {
    silent = options?.silent ?? false
  }
  if (typeof hosts === 'string') hosts = [hosts]
  const existSslKeyAndCrt = hasExistedKeyAndCert()
  if (existSslKeyAndCrt && isMatched(getCrtHosts(), hosts)) {
    debug('之前已经添加过域名，跳过返回之前的域名')
    let trusted: boolean
    try {
      if (!isCertTrusted()) {
        console.log('创建自签名证书')
        addToKeyChain(sslCrtPath)
      }
      trusted = true
    } catch (error) {
      trusted = false
    }
    return {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCrtPath),
      keyFilePath: sslKeyPath,
      certFilePath: sslCrtPath,
      trusted
    }
  }

  console.log('创建自签名证书')

  if (existSslKeyAndCrt) {
    const crtHosts = getCrtHosts()
    const sha1List = getKeyChainCertSha1List(CN)
    if (sha1List.length > 0) {
      !silent && console.log(lan.api_add_hosts_update_and_trust ?? '新增域名需要更新证书并重新信任')
    } else {
      !silent && console.log(lan.api_add_hosts_update_cert ?? '新增域名需要更新证书')
    }
    try {
      await delTrusted(CN)
    } catch (error) {
      throw new Error(lan.api_add_hosts_rm_keychain_failure ?? '卸载老的证书失败，请授权重试')
    }
    try {
      await rmDir(sslCertificateDir)
    } catch (e) {
      throw new Error(lan.api_add_hosts_remove_cert_dir_failure ?? '删除存放原证书的目录失败，请授权重试')
    }
    hosts = crtHosts.concat(getAdded(crtHosts, hosts))
  }

  await createConfigFile(hosts)
  await createSSLKeyAndCrt()

  let trusted: boolean
  try {
    isCertTrusted() || addToKeyChain(sslCrtPath)
    trusted = true
  } catch (error) {
    trusted = false
  }
  return {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCrtPath),
    keyFilePath: sslKeyPath,
    certFilePath: sslCrtPath,
    trusted
  }
}
export { certificateFor }

export const info = (): boolean => {
  if (!judgeExistAndPrint()) return false

  const crtHosts = getCrtHosts()
  console.log(lan.info_ssl_key_path ?? '密钥文件路径：', sslKeyPath)
  console.log(lan.info_ssl_cert_path ?? '自签名证书文件路径：', sslCrtPath)
  console.log(lan.info_ssl_cert_support_hosts ?? '自签名证书已经支持的域名：', crtHosts.join(','))
  console.log(lan.info_ssl_cert_valid_period ?? '自签名证书的有效时间：', getCertValidPeriod())
  const sha1List = getKeyChainCertSha1List(CN)
  const sha1 = getCertSha1()
  if (sha1List.includes(sha1)) {
    console.log(lan.info_ssl_cert_trusted_desc ?? '自签名证书已经添加到钥匙串并被始终信任')
    console.log(lan.info_keychains_cert_name ?? '自签名证书在钥匙串里的名称：', CN, ', ', lan.info_keychains_cert_sha1 ?? '自签名证书在钥匙串里的sha-1：', sha1)
  } else {
    console.log(lan.info_ssl_cert_not_trusted ?? '自签名证书还没被添加到钥匙串，可以运行下面命令，执行添加和始终信任')
    console.log(lan.info_ssl_cert_trusted_cli_tip ?? '$ trusted-cert trust')
  }
  lan.info_extra_help.forEach(text => {
    console.log(text)
  })
  return true
}

export {
  setConfig,
  mergeLan
}
