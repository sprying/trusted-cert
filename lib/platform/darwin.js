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

const removeFromStore = () => new Promise((resolve, reject) => {

})

module.exports = {
  addStore,
  removeFromStore
}
