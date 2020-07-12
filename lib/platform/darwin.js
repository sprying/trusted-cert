const { exec, execSync } = require('child_process')
const addStore = (certificatePath) => new Promise((resolve, reject) => {
  exec(`sudo security add-trusted-cert \
        -d -r trustRoot \
        -k /Library/Keychains/System.keychain \
        ${certificatePath}`, (error, stdout, stderr) => {
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
    const sha1Str = execSync(`security find-certificate -a -c '${CN}' -Z | grep ^SHA-1`, { encoding: 'utf-8' })
    sha1List = sha1Str.replace(/SHA-1\shash:\s/g, '').split('\n').filter(sha1 => sha1)
  } catch (e) {
    sha1List = []
  }
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
