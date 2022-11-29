import { deprecate } from 'util';
import { TrustedCert } from './lib/trusted-cert';

export { TrustedCert };

export async function certificateFor(hosts: string[]) {
  return new TrustedCert().install({ hosts });
}

export async function install(hosts: string[]) {
  const inst = new TrustedCert();

  await inst.install({ hosts });
  inst.info();
}

export async function uninstall() {
  return new TrustedCert().uninstall();
}

export async function info() {
  const inst = new TrustedCert();

  inst.info();
  inst.caInfo();
}

export async function doTrust() {
  const inst = new TrustedCert();

  await inst.doTrust();
  inst.caInfo();
}

export const addHosts = deprecate(async (hosts: string[] = []) => {
  try {
    await certificateFor(hosts);
    return true;
  } catch (e) {
    return false;
  }
}, 'addHosts() is deprecated. Use certificateFor() instead.');

export const setConfig = deprecate(() => {},
'setConfig() is deprecated and has no effect. Please create your own TrustedCert instance.');
export const mergeLan = deprecate(() => {},
'mergeLan() is deprecated and has no effect. Please create your own TrustedCert instance.');
