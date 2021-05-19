import path from 'path'
import { execFileSync } from 'child_process'
import applicationConfigPath from './config/application-config-path'

const configDir = applicationConfigPath('trused-cert')
const configPath = path.join.bind(path, configDir)

// export const run = (cmd, args, options) => execFileSync(cmd, args, options)

export const openssl = (args: string[], options?: any): string => execFileSync('openssl', args, {
  ...options,
  stdio: 'pipe',
  env: Object.assign({
    RANDFILE: path.join(configPath('.rnd'))
  }, process.env)
})

/**
 * 新增的域名是否在已存在域名内，支持一级的通配符*，比如pub.alimama.com属于*.alimama.com
 */
export const isMatched = (existedDomains: string[], addedDomains: string[]): boolean => addedDomains.every(host => {
  return existedDomains.find(crtHostItem => {
    if (crtHostItem.includes('*')) {
      return (new RegExp(crtHostItem.replace('*', '^[^.]+') + '$')).test(host)
    } else {
      return crtHostItem === host
    }
  })
})

/**
 * 获取最终需要新增的域名
 */
export const getAdded = (existedDomain: string[], addedDomains: string[]): string[] => addedDomains.filter(host => {
  return existedDomain.find(crtHostItem => {
    if (crtHostItem.includes('*')) {
      return (new RegExp(crtHostItem.replace('*', '^[^.]+') + '$')).test(host)
    } else {
      return crtHostItem === host
    }
  }) == null
})
