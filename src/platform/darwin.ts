import { execFileSync } from 'child_process';
import Debug from 'debug';

const debug = Debug('trusted-cert:platform:darwin');

// 参数以数组形式传给 execFileSync，不经过 shell，避免路径、证书名里的特殊字符被当成命令执行（sudo 下即提权）

export const addStore = (certificatePath: string): void => {
  debug('添加证书%o到系统钥匙串', certificatePath);
  execFileSync('sudo', [
    'security',
    'add-trusted-cert',
    '-d',
    '-r',
    'trustRoot',
    '-k',
    '/Library/Keychains/System.keychain',
    certificatePath,
  ]);
};

export const getKeyChainCertSha1List = (CN: string): string[] => {
  debug('查询钥匙串里名称是%o的证书', CN);
  let sha1List: string[];
  try {
    // 钥匙串里没有时执行下面会抛错
    const output = execFileSync(
      'security',
      ['find-certificate', '-a', '-c', CN, '-Z'],
      { encoding: 'utf-8' }
    );
    sha1List = output
      .split('\n')
      .filter((line) => line.startsWith('SHA-1'))
      .map((line) => line.replace(/SHA-1\shash:\s/, '').trim())
      .filter((sha1) => sha1);
  } catch (e) {
    sha1List = [];
  }
  debug('查询到的sha1 %o', sha1List);
  return sha1List;
};

export const removeFromStore = async (
  certificateName: string
): Promise<boolean> =>
  await new Promise((resolve) => {
    try {
      debug('sudo security delete-certificate -c %o', certificateName);
      execFileSync('sudo', [
        'security',
        'delete-certificate',
        '-c',
        certificateName,
      ]);
      resolve(true);
    } catch (error) {
      resolve(false);
    }
  });
