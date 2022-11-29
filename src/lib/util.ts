/**
 * 新增的域名是否在已存在域名内，支持一级的通配符*，比如pub.alimama.com属于*.alimama.com
 */
export const isMatched = (
  existedHosts: string[],
  addedHosts: string[]
): boolean =>
  addedHosts.every((host) => {
    return existedHosts.find((crtHostItem) => {
      if (crtHostItem.includes('*')) {
        return new RegExp(crtHostItem.replace('*', '^[^.]+') + '$').test(host);
      } else {
        return crtHostItem === host;
      }
    });
  });

/**
 * 获取最终需要新增的域名
 */
export const getAdded = (
  existedHost: string[],
  addedHosts: string[]
): string[] =>
  addedHosts.filter((host) => {
    return (
      existedHost.find((crtHostItem) => {
        if (crtHostItem.includes('*')) {
          return new RegExp(crtHostItem.replace('*', '^[^.]+') + '$').test(
            host
          );
        } else {
          return crtHostItem === host;
        }
      }) == null
    );
  });
