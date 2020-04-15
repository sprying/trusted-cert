# 简介
HTTPS自签名证书工具，是为了解决启动本地HTTPS服务时，需要创建自签名证书但很繁琐有时候查教材很耗时。它提供命令行调用方式，可以做到一键生成自签名证书并添加到macOS钥匙串，后续通过命令行还可以随时查看和管理证书内容，同时它还提供API接口，可以很方便地集成到命令行工具里。

# 使用说明
## 开始使用
1. **生成密钥和证书** 创建过程会提示输入域名，这里使用默认域名，直接回车；输入密码，向macOS钥匙串里添加证书。
	
	```bash
	# 全局安装
	npm install trusted-cert -g
	# 或者使用yarn
	yarn global add trusted-cert
	
	# 一键生成自签名证书并添加到macOS钥匙串
	trusted-cert install
	```
2. 在nodejs中使用
 
	```javascript
	const https = require('https');
	const fs = require('fs');
	const path = require('path');
	
	const options = {
      key: fs.readFileSync(path.join(process.env.HOME, '.self-signed-cert/ssl.key')),
      cert: fs.readFileSync(path.join(process.env.HOME, '.self-signed-cert/ssl.crt')),
	};
	
	https.createServer(options, (req, res) => {
	  res.writeHead(200);
	  res.end('hello world\n');
	}).listen(8000);
	```
3. 浏览器打开访问<https://localhost:8000/>，发现网址标为了安全

## 使用api方式
1. 安装依赖  
	```bash
	npm install trusted-cert -D
	```
	
2. 调用api  

	```javascript
	const https = require('https');
	const fs = require('fs');
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
		const options = {
	      key: fs.readFileSync(result.sslKeyPath),
	      cert: fs.readFileSync(result.sslCrtPath),
		};
		
		https.createServer(options, (req, res) => {
		  res.writeHead(200);
		  res.end('hello world\n');
		}).listen(8000);
	})
	```
3. 浏览器打开访问<https://test.m.taobao.com:8000/>，发现网址标为了安全
## 命令行功能介绍
```bash
trusted-cert --help
```

```
Usage: trusted-cert [global options] command

Options:
  -v, --version   当前版本
  -h, --help      display help for command

Commands:
  install         生成ssl密钥和自签名证书，在系统钥匙串里添加和信任自签名证书
  info            查看自签名信息
  trust           信任自签名证书
  add <host>      添加要支持的域名，支持以,分隔
  unInstall       删除生成的ssl密钥和自签名证书
  help [command]  display help for command

先安装，再使用其它命令
  $ trusted-cert install
```

### `trusted-cert install`
一键生成自签名证书并添加到macOS钥匙串，在这个过程中，需要输入本地启动https服务要支持的域名，多个以`,`分隔，然后会提示要输入密码，用来将自签名证书以sudo权限添加到系统钥匙串里，如果添加失败，后面浏览器访问https服务，会提示不安全。

### `trusted-cert trust`
如果install过程中三次输入密码都错误了，还可以单独运行这个命令重新添加到系统钥匙串。或者发现chrome下访问https还是提醒非安全，可以去查看确认下证书是否已经添加到系统钥匙串，证书是否过期。

### `trusted-cert info`
生成证书后，可以随时通过这个命令查看密钥等文件的位置，方便你在配置服务器https时需要它，还可以看到支持的域名，是否已经添加到系统钥匙串，证书的有效时间。

### `trusted-cert add <host>`
通过这个命令新增本地https服务要用的域名，新增时先检测证书是否已经支持了该域名，比如证书支持*.m.taobao.com，本地要使用test.m.taobao.com域名，检测发现已经支持了，会提醒不用新增。如果遇到需要新增的，会先删除原有的密钥等文件和钥匙串里证书，然后再新增。

### `trusted-cert unInstall`
删除本地存放密钥、证书等文件的目录，删除钥匙串里添加的证书


## api介绍
在命令行工具里里局部安装【HTTPS自签名证书工具】，使用的时候通过api传入要使用的host列表，工具先检测是否安装过证书，没安装过开始安装，安装过的继续检测装过的证书是否已经支持这些host，还有其它检测，针对检测到点一一修复，最后返回密钥和证书的文件位置等信息。本地起https服务时，直接读取使用api返回的密钥和证书文件位置。

考虑到对于开发者而言，在电脑中只需要一份ssl的密钥和自签名证书就够用了，所以不管是命令行方式还是api，只需要生成一份文件存放在系统固定位置`~/.self-signed-cert`，工具在钥匙串里也只有一份自签名证书，由工具来管理自证书包括生成、销毁、重新生成的生命周期。


# 原理
「HTTPS自签名证书工具」一键生成自签名证书并添加到macOS钥匙串，核心只有两步，两行代码就可以搞定，一行代码是生成密钥和自签名证书，另一行代码是将自签名证书添加到系统的钥匙串。

## 密钥和自签名证书

在服务器上配置 HTTPS 的过程最基本的就是以下三个步骤，每一个步骤中都会生成一个新的文件：

1. 生成强加密的私钥 -> .key 文件；
2. 创建证书签名申请，并且发送给 CA -> .csr（certificate signing request）文件；
3. 在 Web 服务器上安装 CA 提供的证书 -> .crt（certificate）文件。

在生产环境的 HTTPS 配置中，第二步生成的 .csr 文件需要和第一步产生的 .key 文件一起交给颁布证书 CA，审核通过后得到正式的证书 .crt 文件，再到第三步将其部署到自己的服务器。

而在到本地 HTTPS 环境的搭建，就不存在发送给 CA 进行审核，取而代之直接在本地进行「自签名」的方式进行认证。


## 添加到macOS钥匙串
将自签名证书添加到系统的钥匙串，使用的是macOS提供的命令行工具`security`。



# 附配置服务的HTTPS证书示例
## nginx
```nginx
# ...
server {
  listen  443;
  server_name shop.alimama.com;
 
 ssl on;
  ssl_certificate     /Users/xxx/.self-signed-cert/ssl.crt;
  ssl_certificate_key /Users/xxx/.self-signed-cert/ssl.key;
 
  location  / {
    proxy_pass  http://127.0.0.1:8002;
  }
}
# ...
```

## webpack
```javascript
// ...
devServer: {
    https: {
      key: fs.readFileSync(path.join(process.env.HOME, '.self-signed-cert/ssl.key')),
      cert: fs.readFileSync(path.join(process.env.HOME, '.self-signed-cert/ssl.crt')),
    },
  },
},
// ...
```
