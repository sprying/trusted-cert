import { I18nDict } from './interface';

export const zhCN: I18nDict = {
  ca_create_failed: '生成 CA 根证书失败: %s',
  ca_not_created: '❌ CA 根证书未生成',
  ca_info_name: 'CA 证书名称: %s',
  ca_info_fingerprint: 'CA 证书指纹 (sha-1): %s',
  ca_info_valid_period: 'CA 证书有效期: %s',
  ca_info_trusted: '✅ CA 根证书已经添加到钥匙串并被始终信任',
  ca_info_not_trusted:
    '❌ CA 根证书未被信任，请执行以下命令添加信任\n$ trusted-cert trust',

  info_no_install:
    '还没有安装自签名证书，运行下面命令安装使用\n$ trusted-cert install',
  info_ssl_key_path: '密钥文件路径: %s',
  info_ssl_cert_path: '证书文件路径: %s',
  info_ssl_cert_support_hosts: '支持的域名:\n%s',
  info_ssl_cert_valid_period: '证书有效期: %s',

  add_trust_process: '正在将 CA 证书写入系统信任区，请输入密码并同意',
  add_trust_succeed: '添加成功',
  add_trust_failed: '添加失败: %s',

  sign_ca_mismatch: '当前证书不由本地的 CA 签署，需要重新签署证书',
  sign_cert_satisfied: '现有证书已经满足需求',
  sign_complete: '证书签发完成',
  sign_cert_expired: '现有证书已过期，需要重新签署证书',
  sign_host_empty: '主机名列表为空，无法签发证书',

  uninstall_del_keychain: '正在删除钥匙串里名称「%s」的证书',
  uninstall_del_keychain_success: '删除成功',
  uninstall_del_keychain_failure: '删除失败: %s',
  uninstall_complete: '删除完成',
};
