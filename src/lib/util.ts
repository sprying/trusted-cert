/**
 * 域名是否匹配，支持一级的通配符*，比如pub.alimama.com属于*.alimama.com
 */
const isHostMatched = (crtHostItem: string, host: string): boolean => {
  if (crtHostItem.includes('*')) {
    // 先转义 . 等正则元字符，否则 *.alimama.com 会误匹配 pubxalimama.com
    const pattern = crtHostItem
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace('*', '[^.]+');
    return new RegExp(`^${pattern}$`).test(host);
  } else {
    return crtHostItem === host;
  }
};

/**
 * 新增的域名是否在已存在域名内
 */
export const isMatched = (
  existedHosts: string[],
  addedHosts: string[]
): boolean =>
  addedHosts.every((host) =>
    existedHosts.some((crtHostItem) => isHostMatched(crtHostItem, host))
  );

/**
 * 获取最终需要新增的域名
 */
export const getAdded = (
  existedHost: string[],
  addedHosts: string[]
): string[] =>
  addedHosts.filter(
    (host) => !existedHost.some((crtHostItem) => isHostMatched(crtHostItem, host))
  );
