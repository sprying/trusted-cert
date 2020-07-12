const path = require('path')
const { execFileSync } = require('child_process')
const applicationConfigPath = require('application-config-path')
const configDir = applicationConfigPath('devcert')
const configPath = path.join.bind(path, configDir)

const run = (cmd, args, options) => {
  return execFileSync(cmd, args, options)
}

const openssl = (args, options) => {
  return run('openssl', args, {
    ...options,
    stdio: 'pipe',
    env: Object.assign({
      RANDFILE: path.join(configPath('.rnd'))
    }, process.env)
  })
}

/**
 * 新增的域名是否在已存在域名内，支持一级的通配符*，比如pub.alimama.com属于*.alimama.com
 * @param existedDomains
 * @param addedDomains
 * @returns {boolean}
 */
const isMatched = (existedDomains, addedDomains) => {
  const isMatched = addedDomains.every(host => {
    return existedDomains.find(crtHostItem => {
      if (crtHostItem.includes('*')) {
        return (new RegExp(crtHostItem.replace('*', '^[^.]+'))).test(host)
      } else {
        return crtHostItem === host
      }
    })
  })
  return isMatched
}

/**
 * 获取最终需要新增的域名
 * @param existedDomain
 * @param addedDomains
 * @returns {Array<String>}
 */
const getAdded = (existedDomain, addedDomains) => {
  const finalAddedHosts = addedDomains.filter(host => {
    return !existedDomain.find(crtHostItem => {
      if (crtHostItem.includes('*')) {
        return (new RegExp(crtHostItem.replace('*', '^[^.]+'))).test(host)
      } else {
        return crtHostItem === host
      }
    })
  })
  return finalAddedHosts
}

module.exports = {
  isMatched,
  getAdded,
  run,
  openssl
}
