const configuration = {
  host_add_no_input: '输入要支持的host',
  host_add_no_install: '还没有安装自签名证书，运行下面命令安装使用',
  host_add_no_install_operation_tip: '$ trusted-cert install',
  host_add_has_supported_no_needed_added: '证书已经支持该域名，无须添加了',
  host_add_need_rebuild_and_trusted: '新增域名需要更新证书并重新信任',
  host_add_being_upgrading: '正在更新证书',
  host_add_failure: '新增域名失败',
  host_add_success: '更新成功',
  host_add_success_support_hosts: '更新后支持的域名',
  host_add_cert_valid_period: '更新后证书的起止有效时间：',

  info_ssl_key_path: '密钥：',
  info_ssl_cert_path: '证书：',
  info_ssl_cert_support_hosts: '支持的域名：',
  info_ssl_cert_valid_period: '有效时间：',
  info_ssl_cert_trusted_desc: '自签名证书已经添加到钥匙串并被始终信任',
  info_keychains_cert_name: '在钥匙串里的名称：',
  info_keychains_cert_sha1: '在钥匙串里的sha-1：',
  info_ssl_cert_not_trusted: '自签名证书还没被添加到钥匙串，可以运行下面命令，执行添加和始终信任',
  info_ssl_cert_trusted_cli_tip: '$ trusted-cert trust',
  info_extra_help: [
    '',
    '查看其它命令',
    '$ trusted-cert --help',
    '',
    '配置webpack的HTTPS证书示例',
    'https://github.com/sprying/trusted-cert#webpack',
    '配置nginx的HTTPS证书示例',
    'https://github.com/sprying/trusted-cert#nginx',
    '配置nodejs的HTTPS证书示例',
    'https://github.com/sprying/trusted-cert#nodejs',
    '如有疑问联系@慧知'
  ],

  add_trust_repeat_add_tip: '钥匙串里已经添加过，无须重复添加',
  add_trust_keychain_cert_info: '在钥匙串里证书的信息：',
  add_trust_keychain_cert_name: '名称: ',
  add_trust_keychain_cert_sha1: 'sha-1：',
  add_trust_keychain_cert_success: '添加并信任成功，钥匙串里名称是：',
  add_trust_failure: '添加失败',
  add_trust_only_support_osx: '目前仅支持OSX系统',

  api_add_hosts_update_and_trust: '新增域名需要更新证书并重新信任',
  api_add_hosts_update_cert: '新增域名需要更新证书',
  api_add_hosts_rm_keychain_failure: '卸载老的证书失败，请授权重试',
  api_add_hosts_update_default: '自签名证书要新增支持的域名，正在更新自签名证书',
  api_add_hosts_remove_cert_dir_failure: '删除存放原证书的目录失败，请授权重试',

  install_has_installed_delete_tip: '继续操作会覆盖该工具已创建的证书',
  install_del_installed_process_creating: '正在创建证书...',
  install_inquirer_domains_with_default: '输入启动本地HTTPS服务时使用的域名，多个以,分隔，直接回车将使用默认',
  install_inquirer_domains: '输入启动本地HTTPS服务时使用的域名，多个以,分隔，如abc.com,*.abc.com',
  install_create_key_cert_file_success: '成功创建密钥和自签名证书',
  install_add_keychain_process_tip: '向系统的钥匙串里添加证书并始终信任...',
  install_add_keychain_success: '添加并信任成功，钥匙串里名称为：',
  install_add_keychain_failure: '钥匙串添加证书失败',
  install_over: '安装结束',
  install_over_extra_info: [
    '',
    '可随时通过下面命令查看自签名证书信息',
    '$ trusted-cert',
    '',
    '安装证书的结果：'
  ],

  uninstall_unfound: '还没有安装过证书',
  uninstall_del_keychain: '正在删除钥匙串里名称「%s」的证书',
  uninstall_del_keychain_success: '删除成功',
  uninstall_del_keychain_failure: '删除失败，流程结束',
  uninstall_rm_dir_success: '已经删除存放密钥和证书的目录%s',
  uninstall_rm_dir_failure: '删除存放原证书的目录失败，流程结束',
  uninstall_complete: '删除完成'
}

const mergeLan = (definedLan) => {
  Object.assign(configuration, definedLan)
}
const getLan = () => configuration

module.exports = {
  mergeLan,
  getLan
}
