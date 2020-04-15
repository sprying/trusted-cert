## 使用
### 命令行
```
npm install trusted-cert -g
# 或者使用yarn
yarn global add trusted-cert

# 一键生成自签名证书并添加到macOS钥匙串
trusted-cert install
```

### api调用
```
npm install trusted-cert --save
```
```
const { obtainSelfSigned } = require('trusted-cert')
const hosts = ['test.m.taobao.com'] // 本地https服务要使用的host
obtainSelfSigned(hosts).then(result => {
    // result
    // {
    //     success: true,
    //     sslKeyPath: '/Users/xxx/.self-signed-cert/ssl.key',
    //     sslCrtPath: '/Users/xxx/.self-signed-cert/ssl.crt',
    //     certTrusted: true
    // }
})
```