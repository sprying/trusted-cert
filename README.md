# create-self-signed

## 使用
### 命令行
```
npm install create-self-signed -g
self-signed --help
```

### api调用
```
npm install create-self-signed --save
```
```
const { obtainSelfSigned } = require('create-self-signed')
const hosts = ['local.m.taobao.com'] // 本地https服务要使用的host
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