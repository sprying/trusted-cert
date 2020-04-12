#!/usr/bin/env node
const { program } = require('commander')
const pkg = require('./package.json')
const { install, unInstall, currentState, trustSelfSigned, addHosts, obtainSelfSigned } = require('./index')

program
  .name('self-signed')
  .usage('[global options] command')
  .version(pkg.version, '-v, --version', '当前版本')

program.on('--help', () => {
  console.log('')
  console.log('首次使用先安装')
  console.log('  $ self-signed install')
})

program
  .command('info', { isDefault: true })
  .description('查看自签名信息')
  .action(() => {
    currentState()
  })

program
  .command('install')
  .description('生成ssl密钥和自签名证书，并信任自签名证书')
  .action(() => {
    install()
  })

program
  .command('trust')
  .description('信任自签名证书')
  .action(() => {
    trustSelfSigned()
  })

program
  .command('add <host>')
  .description('添加要支持的域名')
  .action((hosts) => {
    addHosts(hosts.split(',').map(host => host))
  })

program
  .command('unInstall')
  .description('卸载证书与删除信任')
  .action(() => {
    unInstall()
  })

program
  .command('api', { noHelp: true })
  .description('调用api的示例')
  .action(() => {
    obtainSelfSigned(['*.fa']).then(res => {
      console.log(res)
    })
  })

program.parse(process.argv)
