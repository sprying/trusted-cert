#!/usr/bin/env node

const { program } = require('commander')
const pkg = require('./package.json')
const { install, uninstall, info, doTrust, certificateFor } = require('./dist/index')

program
  .name('trusted-cert')
  .usage('[global option] | [command]')
  .version(pkg.version, '-v, --version', '当前版本')

program.on('--help', () => {
  // console.log('')
  // console.log('先安装，再使用其它命令')
  // console.log('  $ trusted-cert install')
})

program
  .command('install <host...>')
  .description('生成密钥和自签名证书，并添加至系统钥匙串。多个 host 以空格分隔')
  .action((hosts) => {
    console.log(hosts)
    install(hosts)
  })

program
  .command('info', { isDefault: true })
  .description('查看自签名信息')
  .action(() => {
    info()
  })

program
  .command('trust')
  .description('信任自签名证书')
  .action(() => {
    doTrust()
  })

program
  .command('uninstall')
  .description('删除生成的ssl密钥和自签名证书')
  .action(() => {
    uninstall()
  })

program
  .command('api', { noHelp: true })
  .description('调用api的示例')
  .action(async () => {
    await certificateFor(['*.fa11'])
    await certificateFor(['*.fa21'])
    await certificateFor(['*.fa31'])
    await certificateFor(['127.0.0.2'])
  })

program.parse(process.argv)
