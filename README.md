# 简介
HTTPS自签名证书工具，自动生成自签名证书并添加到系统钥匙串，支持mac和windows系统，提供了命令行和供其它命令行调用API的两种使用方式，下面示例是使用mac。

# 使用说明
## 方式一“命令行”
### 快速使用

1. **生成密钥和证书** 创建过程会提示输入域名，这里使用默认域名，直接回车；输入密码，向macOS钥匙串里添加证书。
	
	a. 安装命令行工具
	```bash
	# 全局安装
	npm install trusted-cert -g
	# 或者使用yarn
	yarn global add trusted-cert
	```
	
	b. 一键生成自签名证书并添加到macOS钥匙串

	```bash
	trusted-cert install test.example.com
	```

2. 在nodejs中使用生成的密钥和证书（更多方式参考最后的【附配置服务的HTTPS证书示例】）
 
	```javascript
	const https = require('https');
	const fs = require('fs');
	const path = require('path');
	
	const options = {
      key: fs.readFileSync(path.join(process.env.HOME, '.trusted-cert/ssl.key')),
      cert: fs.readFileSync(path.join(process.env.HOME, '.trusted-cert/ssl.crt')),
	};
	
	https.createServer(options, (req, res) => {
	  res.writeHead(200);
	  res.end('hello world\n');
	}).listen(8000);
	```

3. 浏览器打开访问<https://localhost:8000/>，发现网址标为了安全

### 命令行功能介绍

```bash
$ trusted-cert --help
Usage: trusted-cert [global option] | [command]

Options:
  -v, --version      当前版本
  -h, --help         display help for command

Commands:
  install <host...>  生成密钥和自签名证书，并添加至系统钥匙串。多个 host 以空格分隔
  info               查看自签名信息
  trust              信任自签名证书
  uninstall          删除生成的ssl密钥和自签名证书
  help [command]     display help for command
```

### `trusted-cert install <host...>`
一键生成自签名证书并添加到macOS钥匙串，在这个过程中，需要输入本地启动https服务要支持的域名，多个以`,`分隔，然后会提示要输入密码，用来将自签名证书以sudo权限添加到系统钥匙串里，如果添加失败，后面浏览器访问https服务，会提示不安全。

### `trusted-cert trust`
如果install过程中三次输入密码都错误了，还可以单独运行这个命令重新添加到系统钥匙串。或者发现chrome下访问https还是提醒非安全，可以去查看确认下证书是否已经添加到系统钥匙串，证书是否过期。

### `trusted-cert info`
生成证书后，可以随时通过这个命令查看密钥等文件的位置，方便你在配置服务器https时需要它，还可以看到支持的域名，是否已经添加到系统钥匙串，证书的有效时间。

### `trusted-cert uninstall`
删除本地已生成的密钥和证书


## 方式二“供他方命令行调用的api”
### 快速使用
1. 安装依赖  
	```bash
	npm install trusted-cert --save
	# 或者使用yarn
	yarn add trusted-cert
	```
	
2. 调用api  

	```javascript
	const https = require('https')
	const fs = require('fs')
	const { certificateFor } = require('trusted-cert')
	const hosts = ['test.example.com', '192.168.0.1'] // 本地https服务要使用的domain/ip
	certificateFor(hosts).then((keyAndCert) => {
		https.createServer(keyAndCert, (req, res) => {
		  res.writeHead(200);
		  res.end('hello world\n')
		}).listen(8000)
	})
	```

3. 浏览器打开访问<https://test.m.taobao.com:8000/>，发现网址标为了安全

### api介绍
调用api传入要使用的host列表，工具先检测是否安装过证书，没安装过开始安装，安装过的继续检测装过的证书是否已经支持这些host，还有其它检测，针对检测到点一一修复，最后返回密钥和证书的文件路径等信息。

考虑到对于开发者而言，在电脑中只需要一份ssl的密钥和自签名证书就够用了，所以不管是命令行方式还是api，只生成一份文件存放在系统固定位置`~/.trusted-cert`，工具在钥匙串里也只有一份自签名证书，由工具来管理自证书包括生成、销毁、重新生成的生命周期。

# 附配置服务的HTTPS证书示例
## webpack
```javascript
{
  // ...
  devServer: {
    https: {
      key: fs.readFileSync(path.join(process.env.HOME, '.trusted-cert/ssl.key')),
      cert: fs.readFileSync(path.join(process.env.HOME, '.trusted-cert/ssl.crt'))
    }
  }
  // ...
}
```

## nginx
```nginx
# ...
server {
  listen  443;
  server_name test.example.com;
 
 ssl on;
  ssl_certificate     /Users/xxx/.trusted-cert/ssl.crt;
  ssl_certificate_key /Users/xxx/.trusted-cert/ssl.key;
 
  location  / {
    proxy_pass  http://127.0.0.1:8002;
  }
}
# ...
```

## nodejs
```javascript
const https = require('https');
const fs = require('fs');
const path = require('path');

const options = {
  key: fs.readFileSync(path.join(process.env.HOME, '.trusted-cert/ssl.key')),
  cert: fs.readFileSync(path.join(process.env.HOME, '.trusted-cert/ssl.crt')),
};

https.createServer(options, (req, res) => {
  res.writeHead(200);
  res.end('hello world\n');
}).listen(8000);
```
