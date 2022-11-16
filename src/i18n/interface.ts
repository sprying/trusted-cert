export interface I18nDict {
  ca_create_failed: string;
  ca_not_created: string;
  ca_info_name: string;
  ca_info_fingerprint: string;
  ca_info_valid_period: string;
  ca_info_trusted: string;
  ca_info_not_trusted: string;

  info_no_install: string;
  info_ssl_key_path: string;
  info_ssl_cert_path: string;
  info_ssl_cert_support_hosts: string;
  info_ssl_cert_valid_period: string;

  add_trust_process: string;
  add_trust_succeed: string;
  add_trust_failed: string;

  sign_ca_mismatch: string;
  sign_cert_satisfied: string;
  sign_complete: string;
  sign_cert_expired: string;
  sign_host_empty: string;

  uninstall_del_keychain: string;
  uninstall_del_keychain_success: string;
  uninstall_del_keychain_failure: string;
  uninstall_complete: string;
}

export type I18nDictModifier = Partial<I18nDict>;
