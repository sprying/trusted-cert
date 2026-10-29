import { execFileSync } from 'child_process';
import Debug from 'debug';

const debug = Debug('trusted-cert:platform:win32');

// 参数以数组形式传给 execFileSync，不经过 shell：既避免命令注入，也让带空格的用户目录（C:\Users\John Doe\...）能正常工作

export const addStore = (certificatePath: string): void => {
  // 同步执行，失败时抛错，调用方才能如实报告是否信任成功
  execFileSync('certutil', ['-addstore', '-user', 'root', certificatePath]);
};

export const getKeyChainCertSha1List = (CN: string): string[] => {
  let sha1List: string[];
  try {
    // 钥匙串里没有时执行下面会抛错
    const output = execFileSync(
      'certutil',
      ['-verifystore', '-user', 'root', CN],
      { encoding: 'utf8' }
    );
    // sha1List = sha1Str.replace(/[\u4E00-\u9FA5]+\(sha1\):\s/g, '').split('\n').filter(Boolean)
    sha1List = output
      .split('\n')
      .filter((line) => line.includes('sha1'))
      .map((item) => {
        return item
          .replace(/.*\(sha1\):\s/, '')
          .replace(/[\s\r]/g, '')
          .toUpperCase();
      })
      .filter(Boolean);
  } catch (e) {
    debug('获取钥匙串里证书失败%o', e);
    sha1List = [];
  }
  return sha1List;
};

export const removeFromStore = async (
  certificateName: string
): Promise<boolean> =>
  await new Promise((resolve, reject) => {
    try {
      execFileSync('certutil', ['-delstore', '-user', 'root', certificateName]);
      resolve(true);
    } catch (error) {
      resolve(false);
      // reject(error)
    }
  });
