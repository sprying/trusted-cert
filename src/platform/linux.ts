import { exec, execSync } from 'child_process'

export const addStore = (certificatePath): Promise<boolean> => new Promise((resolve, reject) => {
  try {
    execSync(`sudo cp ${certificatePath} /usr/local/share/ca-certificates/devcert.crt`)
    execSync('sudo update-ca-certificates')
    resolve(true)
  } catch (e) {
    resolve(false)
    // reject(e)
  }
})