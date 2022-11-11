import {
  addStore as addStoreViaDarwin,
  getKeyChainCertSha1List as getKeyChainCertSha1ListViaDarwin,
  removeFromStore as removeFromStoreViaDarwin,
} from './darwin';

import {
  addStore as addStoreViaWin32,
  getKeyChainCertSha1List as getKeyChainCertSha1ListViaWin32,
  removeFromStore as removeFromStoreViaDarwinViaWin32,
} from './win32';

import { addStore as addStoreViaLinux } from './linux';

const isOSX = process.platform === 'darwin';
const isWindow = process.platform === 'win32';
// const isLinux = process.platform === 'linux'

/**
 * 添加到系统钥匙串，信任证书
 */
export const addToKeyChain = isOSX
  ? addStoreViaDarwin
  : isWindow
  ? addStoreViaWin32
  : addStoreViaLinux;

/**
 * 获取钥匙串里有本工具创建的证书sha1列表
 */
export const getKeyChainCertSha1List = isOSX
  ? getKeyChainCertSha1ListViaDarwin
  : isWindow
  ? getKeyChainCertSha1ListViaWin32
  : () => [];

/**
 * 删除钥匙串里指定的证书
 */
export const delTrusted = isOSX
  ? removeFromStoreViaDarwin
  : isWindow
  ? removeFromStoreViaDarwinViaWin32
  : () => {};
