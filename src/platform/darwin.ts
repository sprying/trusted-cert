import { exec, execSync } from 'child_process'
import Debug from 'debug'

const debug = Debug('trusted-cert:platform:darwin')

export const addStore = (certificatePath): Promise<boolean> => new Promise((resolve, reject) => {
  debug('添加证书%o到系统钥匙串', certificatePath)
  exec(`sudo security add-trusted-cert \
        -d -r trustRoot \
        -k /Library/Keychains/System.keychain \
        '${certificatePath}'`, (error, stdout, stderr) => {
    if (error) {
      debug('添加失败')
      // reject(error)
      resolve(false)
    } else {
      debug('添加成功')
      resolve(true)
    }
  })
})

export const getKeyChainCertSha1List = (CN) => {
  debug('查询钥匙串里名称是%o的证书', CN)
  let sha1List
  try {
    // 钥匙串里没有时执行下面会抛错
    const sha1Str = execSync(`security find-certificate -a -c '${CN}' -Z | grep ^SHA-1`, { encoding: 'utf-8' })
    sha1List = sha1Str.replace(/SHA-1\shash:\s/g, '').split('\n').filter(sha1 => sha1)
  } catch (e) {
    sha1List = []
  }
  debug('查询到的sha1 %o', sha1List)
  return sha1List
}

export const removeFromStore = (certificateName) => new Promise((resolve, reject) => {
  try {
    debug(`sudo security delete-certificate -c "${certificateName}"`)
    execSync(`sudo security delete-certificate -c "${certificateName}"`)
    resolve(true)
  } catch (error) {
    resolve(false)
    // reject(error)
  }
})
