const fs = require('fs')
const inquirer = require('inquirer')
const { setConfig, getConfig } = require('./lib/configuration')
const isOSX = process.platform === 'darwin'
const {
  hasExistedKeyAndCert,
  getCrtHosts,
  getKeyChainCertSha1List,
  rmKeyChainCertsBySha1List,
  createConfigFile,
  createSSLKeyAndCrt,
  addToKeyChain,
  getCertValidPeriod,
  getCertSha1,
  isCertTrusted,
  rmDir
} = require('./lib/lib')
const { isMatched, getAdded } = require('./lib/util')
const { mergeLan, getLan } = require('./lib/lan')

const { sslCertificateDir, sslKeyPath, sslCrtPath, CN, DEFAULTDOMAINS } = getConfig()
const lan = getLan()

/**
 * 判断没安装过证书给提示
 * @returns {boolean}
 */
const judgeExistOnConsole = () => {
  if (!hasExistedKeyAndCert()) {
    console.warn(lan.host_add_no_install || '还没有安装自签名证书，运行下面命令安装使用')
    console.warn(lan.host_add_no_install_operation_tip || '$ trusted-cert install')
    return false
  }
  return true
}

/**
 * cli交互方式获取支持的域名
 * @returns {Array}
 */
const getInquirerAnswer = async () => {
  const questions = [{
    type: 'input',
    name: 'domains',
    message: DEFAULTDOMAINS.length ? lan.install_inquirer_domains_with_default : lan.install_inquirer_domains,
    default: DEFAULTDOMAINS.join(',')
  }]
  let { domains } = await inquirer.prompt(questions)
  if (domains) {
    domains = domains.split(',').map(item => item.trim())
  } else {
    return []
  }
  domains = domains.reduce((accumulator, currentValue) => {
    !accumulator.includes(currentValue) && accumulator.push(currentValue)
    return accumulator
  }, [])
  return domains
}

const install = async () => {
  const sha1List = getKeyChainCertSha1List()
  const existCrtDir = fs.existsSync(sslCertificateDir)
  if (sha1List.length || existCrtDir) {
    const message = lan.install_has_installed_delete_tip || '继续操作会覆盖该工具已创建的证书'
    const answer = await inquirer.prompt([{
      type: 'confirm',
      name: 'continue',
      message,
      default: false
    }])
    if (!(answer.continue && await uninstall())) return
    if (!answer.continue) return
    console.log(lan.install_del_installed_process_creating || '正在创建证书...')
  }
  const domains = await getInquirerAnswer()
  await createConfigFile(domains)
  await createSSLKeyAndCrt()
  console.log(lan.install_create_key_cert_file_success || '成功创建密钥和自签名证书')

  if (isOSX) {
    console.log(lan.install_add_keychain_process_tip || '向系统的钥匙串里添加证书并始终信任...')
    try {
      await addToKeyChain()
      console.log(lan.install_add_keychain_success || '添加并信任成功，钥匙串里名称为：', CN)
    } catch (e) {
      console.warn(lan.install_add_keychain_failure || '钥匙串添加证书失败')
    }
  }
  console.log(lan.install_over || '安装结束')
  lan.install_over_extra_info.forEach(text => {
    console.log(text)
  })
  info()
}

const uninstall = async () => {
  const sha1List = getKeyChainCertSha1List()
  const existCrtDir = fs.existsSync(sslCertificateDir)
  if (!sha1List.length && !existCrtDir) {
    console.warn(lan.uninstall_unfound || '没有找到该工具安装的证书')
    return true
  }

  if (sha1List.length) {
    console.log(lan.uninstall_del_keychain || '正在删除钥匙串里名称「%s」的证书', CN)
    try {
      await rmKeyChainCertsBySha1List(sha1List)
      console.log(lan.uninstall_del_keychain_success || '删除成功')
    } catch (error) {
      console.error(lan.uninstall_del_keychain_failure || '删除失败，流程结束')
      return false
    }
  }
  if (existCrtDir) {
    try {
      await rmDir(sslCertificateDir)
      console.log(lan.uninstall_rm_dir_success || '已经删除存放密钥和证书的目录%s', sslCertificateDir)
    } catch (e) {
      console.log(lan.uninstall_rm_dir_failure || '删除存放原证书的目录失败，流程结束')
      return false
    }
  }
  console.log(lan.uninstall_complete || '删除完成')
  return true
}

const doTrust = async () => {
  if (!judgeExistOnConsole()) return

  if (!isOSX) {
    console.warn(lan.add_trust_only_support_osx || '目前仅支持OSX系统')
    return
  }

  const sha1List = getKeyChainCertSha1List()
  const sha1 = getCertSha1()
  if (sha1List.includes(sha1)) {
    console.log(lan.add_trust_repeat_add_tip || '钥匙串里已经添加过，无须重复添加')
    console.log(lan.add_trust_keychain_cert_info || '在钥匙串里证书的信息：')
    console.log(lan.add_trust_keychain_cert_name || '名称: ', CN)
    console.log(lan.add_trust_keychain_cert_sha1 || 'sha-1: ', sha1)
  } else {
    try {
      await addToKeyChain()
      console.log(lan.add_trust_keychain_cert_success || '添加并信任成功，钥匙串里名称是：', CN)
    } catch (e) {
      console.error(lan.add_trust_failure || '添加失败')
    }
  }
}

const addHosts = async (hosts = []) => {
  if (!hosts.length) {
    console.warn(lan.host_add_no_input || '输入要支持的host')
    return
  }
  if (!judgeExistOnConsole()) return

  const crtHosts = getCrtHosts()
  const matched = isMatched(crtHosts, hosts)
  if (matched) {
    console.warn(lan.host_add_has_supported_no_needed_added || '证书已经支持该域名，无须添加了')
    return
  }
  if (!matched) {
    const addedHosts = getAdded(crtHosts, hosts)
    hosts = crtHosts.concat(addedHosts)
  }

  const sha1List = getKeyChainCertSha1List()
  if (sha1List.length) {
    console.log(lan.host_add_need_rebuild_and_trusted || '新增域名需要更新证书并重新信任')
  } else {
    console.log(lan.host_add_being_upgrading || '正在更新证书')
  }
  try {
    await rmKeyChainCertsBySha1List(sha1List)
  } catch (error) {
    console.error(lan.host_add_failure || '新增域名失败')
    return
  }
  try {
    await rmDir(sslCertificateDir)

    await createConfigFile(hosts)

    await createSSLKeyAndCrt()
    if (sha1List.length) {
      await addToKeyChain()
    }
    console.log(lan.host_add_success || '更新成功')
    console.log(lan.host_add_success_support_hosts || '更新后支持的域名')
    const crtHosts = getCrtHosts()
    console.log(crtHosts.join(','))
    console.log(lan.host_add_cert_valid_period || '更新后证书的起止有效时间：')
    console.log(getCertValidPeriod())

    if (!sha1List.length) {
      // todo
    }
  } catch (e) {
    console.error(lan.host_add_failure || '新增域名失败')
  }
}

const keyAndCert = async (hosts = DEFAULTDOMAINS) => {
  if (typeof hosts === 'string') hosts = [hosts]
  const existSslKeyAndCrt = hasExistedKeyAndCert()
  if (existSslKeyAndCrt) {
    const crtHosts = getCrtHosts()
    if (isMatched(crtHosts, hosts)) {
      return {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCrtPath),
        trusted: isCertTrusted() || (isOSX && await addToKeyChain())
      }
    } else {
      if (isOSX) {
        const sha1List = getKeyChainCertSha1List()
        if (sha1List.length) {
          console.log(lan.api_add_hosts_update_and_trust || '新增域名需要更新证书并重新信任')
        } else {
          console.log(lan.api_add_hosts_update_cert || '新增域名需要更新证书')
        }
        try {
          await rmKeyChainCertsBySha1List(sha1List)
        } catch (error) {
          throw new Error(lan.api_add_hosts_rm_keychain_failure || '卸载老的证书失败，请授权重试')
        }
      } else {
        console.log(lan.api_add_hosts_update_default || '自签名证书要新增支持的域名，正在更新自签名证书')
      }
      try {
        await rmDir(sslCertificateDir)
      } catch (e) {
        throw new Error(lan.api_add_hosts_remove_cert_dir_failure || '删除存放原证书的目录失败，请授权重试')
      }
      hosts = crtHosts.concat(getAdded(crtHosts, hosts))
    }
  }

  await createConfigFile(hosts)

  await createSSLKeyAndCrt()
  let certTrusted = false
  try {
    if (isOSX) {
      await addToKeyChain()
      certTrusted = true
    }
  } catch (e) {}
  return {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCrtPath),
    trusted: certTrusted
  }
}

const info = () => {
  if (!judgeExistOnConsole()) return

  const crtHosts = getCrtHosts()
  console.log(lan.info_ssl_key_path || '密钥文件路径：', sslKeyPath)
  console.log(lan.info_ssl_cert_path || '自签名证书文件路径：', sslCrtPath)
  console.log(lan.info_ssl_cert_support_hosts || '自签名证书已经支持的域名：')
  console.log(crtHosts.join(','))
  console.log(lan.info_ssl_cert_valid_period || '自签名证书的有效时间：')
  console.log(getCertValidPeriod())
  const sha1List = getKeyChainCertSha1List()
  const sha1 = getCertSha1()
  if (sha1List.includes(sha1)) {
    console.log(lan.info_ssl_cert_trusted_desc || '自签名证书已经添加到钥匙串并被始终信任')
    console.log(lan.info_keychains_cert_name || '自签名证书在钥匙串里的名称：', CN)
    console.log(lan.info_keychains_cert_sha1 || '自签名证书在钥匙串里的sha-1：', sha1)
  } else if (isOSX) {
    console.log(lan.info_ssl_cert_not_trusted || '自签名证书还没被添加到钥匙串，可以运行下面命令，执行添加和始终信任')
    console.log(lan.info_ssl_cert_trusted_cli_tip || '$ trusted-cert trust')
  }
  lan.info_extra_help.forEach(text => {
    console.log(text)
  })
}

module.exports = {
  install,
  info,
  uninstall,
  doTrust,
  addHosts,
  keyAndCert,
  setConfig,
  mergeLan
}
