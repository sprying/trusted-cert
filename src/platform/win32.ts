import { exec, execSync } from 'child_process'
import Debug from 'debug'

const debug = Debug('trusted-cert:platform:win32')
export const addStore = (certificatePath): Promise<boolean> => new Promise((resolve, reject) => {
  exec(`certutil -addstore -user root ${certificatePath}`, (error, stdout, stderr) => {
    if (error) {
      // reject(error)
      resolve(false)
    } else {
      resolve(true)
    }
  })
})

export const getKeyChainCertSha1List = (CN) => {
  let sha1List
  try {
    // 钥匙串里没有时执行下面会抛错
    const sha1Str = execSync(`certutil -verifystore -user root "${CN}" | findstr sha1`, { encoding: 'utf8' })
    // sha1List = sha1Str.replace(/[\u4E00-\u9FA5]+\(sha1\):\s/g, '').split('\n').filter(Boolean)
    sha1List = sha1Str.split('\n').map(item => {
      return item.replace(/.*\(sha1\):\s/, '').replace(/[\s\r]/g, '').toUpperCase()
    }).filter(Boolean)
  } catch (e) {
    debug('获取钥匙串里证书失败%o', e)
    sha1List = []
  }
  return sha1List
}

export const removeFromStore = (certificateName) => new Promise((resolve, reject) => {
  try {
    execSync(`certutil -delstore -user root "${certificateName}"`)
    resolve(true)
  } catch (error) {
    resolve(false)
    // reject(error)
  }
})