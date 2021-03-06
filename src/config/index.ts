import path from 'path'
import applicationConfigPath from './application-config-path'

export interface IConfigProps {
  sslCertificateDir: string;
  sslConfigFile: string;
  sslKeyPath: string;
  sslCrtPath: string;
  name: string;
  defaultDomains: string[];
}

let sslCertificateDir = applicationConfigPath('trusted-cert')
let sslConfigFile = path.join(sslCertificateDir, './ssl.cnf')
let sslKeyPath = path.join(sslCertificateDir, './ssl.key')
let sslCrtPath = path.join(sslCertificateDir, './ssl.crt')
let CN = 'generated by trusted-cert'
let defaultDomains = [
  'localhost'
]
export const setConfig = (cfg: IConfigProps): void => {
  sslCertificateDir && (sslCertificateDir = cfg.sslCertificateDir)
  sslConfigFile && (sslConfigFile = cfg.sslConfigFile)
  sslKeyPath && (sslKeyPath = cfg.sslKeyPath)
  sslCrtPath && (sslCrtPath = cfg.sslCrtPath)
  CN && (CN = cfg.name)
  defaultDomains && (defaultDomains = cfg.defaultDomains)
}
export const getConfig = (): {
  sslCertificateDir: string;
  sslConfigFile: string;
  sslKeyPath: string;
  sslCrtPath: string;
  CN: string;
  defaultDomains: string[];
} => ({
  sslCertificateDir,
  sslConfigFile,
  sslKeyPath,
  sslCrtPath,
  CN,
  defaultDomains
})
