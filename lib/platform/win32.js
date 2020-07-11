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

module.exports = {
  addStore,
}
