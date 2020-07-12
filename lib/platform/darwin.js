const { exec, execSync } = require('child_process')
const debug = require('debug')('selfcert:platform:darwin')
const addStore = (certificatePath) => new Promise((resolve, reject) => {
  debug('添加证书%o到系统钥匙串', certificatePath)
  exec(`sudo security add-trusted-cert \
        -d -r trustRoot \
        -k /Library/Keychains/System.keychain \
        '${certificatePath}'`, (error, stdout, stderr) => {
    if (error) {
      debug('添加失败')
      reject(error)
    } else {
      debug('添加成功')
      resolve()
    }
  })
})

const getKeyChainCertSha1List = (CN) => {
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

const removeFromStore = (sha1List) => new Promise((resolve, reject) => {
  try {
    sha1List.forEach(sha1 => {
      execSync(`sudo security delete-certificate -Z ${sha1}`)
    })
    resolve()
  } catch (error) {
    reject(error)
  }
})

module.exports = {
  addStore,
  getKeyChainCertSha1List,
  removeFromStore
}
