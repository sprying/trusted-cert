/**
 * 新增的域名是否在已存在域名内，支持一级的通配符*，比如pub.alimama.com属于*.alimama.com
 * @param existedDomains
 * @param addedDomains
 * @returns {boolean}
 */
const isMatched = (existedDomains, addedDomains) => {
  const isMatched = addedDomains.every(host => {
    return existedDomains.find(crtHostItem => {
      if (crtHostItem.includes('*')) {
        return (new RegExp(crtHostItem.replace('*', '^[^.]+'))).test(host)
      } else {
        return crtHostItem === host
      }
    })
  })
  return isMatched
}

/**
 * 获取最终需要新增的域名
 * @param existedDomain
 * @param addedDomains
 * @returns {Array<String>}
 */
const getAdded = (existedDomain, addedDomains) => {
  const finalAddedHosts = addedDomains.filter(host => {
    return !existedDomain.find(crtHostItem => {
      if (crtHostItem.includes('*')) {
        return (new RegExp(crtHostItem.replace('*', '^[^.]+'))).test(host)
      } else {
        return crtHostItem === host
      }
    })
  })
  return finalAddedHosts
}

module.exports = {
  isMatched,
  getAdded
}
