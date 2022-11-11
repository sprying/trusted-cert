import { readFileSync, writeFileSync } from 'fs-extra';
import { pki } from 'node-forge';
import { join } from 'path';
import { createCACert, createCert, generateKeyPair, getCertHosts, getCertSha1 } from './cert';
import Debug from 'debug';
import { addToKeyChain, getKeyChainCertSha1List } from '../platform';
import applicationConfigPath from './application-config-path';
import { I18nDict } from '../i18n/interface';
import { mergeI18n } from '../i18n';
import inquirer from 'inquirer';
import { isMatched } from '../util';

const debug = Debug('trusted-cert:class');

const certPath = (dir: string, name: string) => join(dir, `${name}.crt`)
const keyPath = (dir: string, name: string) => join(dir, `${name}.key`)

const readCert = (dir: string, name: string) => {
  return pki.certificateFromPem(readFileSync(certPath(dir, name), 'utf-8'));
};

const readKey = (dir: string, name: string) => {
  return pki.privateKeyFromPem(readFileSync(keyPath(dir, name), 'utf-8'));
};

const writeCert = (dir: string, name: string, content: pki.Certificate) => {
  writeFileSync(certPath(dir, name), pki.certificateToPem(content));
};

const writeKey = (dir: string, name: string, content: pki.PrivateKey) => {
  writeFileSync(keyPath(dir, name), pki.privateKeyToPem(content));
};

export class TrustedCert {
  private i18n: I18nDict;

  constructor(
    private dir = applicationConfigPath('trusted-cert'),
    i18n: Partial<I18nDict> = {}
  ) {
    this.i18n = mergeI18n(i18n);
  }

  async install({ 
    domains, 
    overwrite = false,
    name = 'ssl',
  }: {
    domains: string[],
    name?: string,
    overwrite?: boolean,
  }) {
    const ca = await this.ensureCA();
    let trusted = false;
    if (!this.isCertTrusted(ca.cert)) {
      console.log('正在将 CA 证书写入系统信任区');
      try {
        addToKeyChain(certPath(this.dir, 'ca'))
        trusted = true;
      } catch (e) {
        console.warn('CA 写入失败');
        trusted = false;
      }
    }

    let ssl = this.loadCert(name);
    const signDomains = new Set(domains);
    if (!overwrite && ssl) {
      const currentDomains = getCertHosts(ssl.cert);
      if (isMatched(currentDomains, domains)) {
        console.log('现有证书已经满足需求');
        return
      }
      for (const item of currentDomains) {
        signDomains.add(item);
      }
    }

    let privateKey = ssl?.key;
    let publicKey: pki.PublicKey;
    if (privateKey) {
      publicKey = pki.rsa.setPublicKey(privateKey.n, privateKey.e);
    } else {
      const keypair = await this.generateKeyPair();
      writeKey(this.dir, name, keypair.privateKey);

      privateKey = keypair.privateKey;
      publicKey = keypair.publicKey;
    }
    
    const cert = createCert({
      caPrivKey: ca.key,
      caCertAttrs: ca.cert.subject.attributes,
      publicKey,
      hosts: Array.from(signDomains),
    })

    writeCert(this.dir, name, cert);

    return {
      key: pki.privateKeyToPem(privateKey),
      cert: pki.certificateToPem(cert),
      keyFilePath: keyPath(this.dir, name),
      certFilePath: certPath(this.dir, name),
      trusted,
    }
  }

  // private async 

  /**
   * 判断没安装过证书给提示
   */
  private async judgeCAExistAndPrint() {
    const { cert } = await this.ensureCA();
    if (!cert) {
      console.warn(this.i18n.host_add_no_install);
      console.warn(this.i18n.host_add_no_install_operation_tip);
      return false;
    }
    return true;
  }

  /**
   * cli交互方式获取支持的域名
   */
  private async getInquirerAnswer(): Promise<string[]> {
    const defaultDomains = ['localhost', '127.0.0.1'];
    const { domains } = await inquirer.prompt<{ domains: string }>([
      {
        type: 'input',
        name: 'domains',
        message: this.i18n.install_inquirer_domains_with_default,
        default: defaultDomains.join(','),
      },
    ]);

    if (domains === '') {
      return defaultDomains;
    } else {
      const domainList = domains
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      return Array.from(new Set(domainList));
    }
  }

  private generateKeyPair() {
    return generateKeyPair({ bits: 2048, workers: 4 });
  }

  private loadCert(name = 'ssl') {
    try {
      const cert = readCert(this.dir, name);
      const key = readKey(this.dir, name);

      return { cert, key };
    } catch (e: any) {
      if (e.code !== 'ENOENT') {
        throw e;
      }

      return null;
    }
  }

  private async ensureCA(name = 'ca') {
    let cert: pki.Certificate;
    let key: pki.PrivateKey;

    try {
      cert = readCert(this.dir, name);
      key = readKey(this.dir, name);
    } catch (e: any) {
      if (e.code !== 'ENOENT') {
        throw e;
      }

      try {
        const keyPair = await this.generateKeyPair();

        cert = createCACert(keyPair);
        key = keyPair.privateKey;

        writeCert(this.dir, name, cert);
        writeKey(this.dir, name, key);
      } catch (e) {
        throw new Error('Failed creating CA cert');
      }
    }

    return { cert, key };
  }

  private isCertTrusted(cert: pki.Certificate) {
    const cn = cert.subject.getField({ name: 'commonName' });
    if (!cn) {
      throw new Error('Failed reading commonName of cert');
    }

    const list = getKeyChainCertSha1List(cn);
    const sha1 = getCertSha1(cert);
    debug(`已经添加信任的证书sha1${list.join(',')}`);
    debug(`证书文件的sha1${sha1}`);

    return list.includes(sha1);
  }
}
