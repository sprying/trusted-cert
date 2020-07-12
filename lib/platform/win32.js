const { exec, execSync } = require('child_process')
const addStore = (certificatePath) => new Promise((resolve, reject) => {
  exec(`certutil -addstore -user root ${certificatePath}`, (error, stdout, stderr) => {
    if (error) {
      reject(error)
    } else {
      resolve()
    }
  })
})

const getKeyChainCertSha1List = (CN) => {
  let sha1List
  try {
    // 钥匙串里没有时执行下面会抛错
    const sha1Str = execSync(`certutil verifystore -user root '${CN}' | findstr sha1`, { encoding: 'utf-8' })
    sha1List = sha1Str.replace(/[\u4E00-\u9FA5]+<sha1>:\s/g, '').split('\n').filter(sha1 => sha1)
  } catch (e) {
    sha1List = []
  }
  return sha1List
}

const removeFromStore = (sha1List) => new Promise((resolve, reject) => {
  try {
    sha1List.forEach(sha1 => {
      execSync(`certutil delstore -user root ${sha1}`)
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
