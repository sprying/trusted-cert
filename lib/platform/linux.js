const { exec, execSync } = require('child_process')
const addStore = (certificatePath) => new Promise((resolve, reject) => {
  try {
    execSync(`sudo cp ${certificatePath} /usr/local/share/ca-certificates/devcert.crt`)
    execSync('sudo update-ca-certificates')
    resolve()
  } catch (e) {
    reject(e)
  }
})

module.exports = {
  addStore,
}
