import os from 'os';
import path from 'path';

type ICertPath = (name: string) => string;
const darwin: ICertPath = (name) => {
  // return path.join(process.env['HOME'], 'Library', 'Application Support', name)
  return path.join(process.env.HOME as string, '.trusted-cert');
};

const linux: ICertPath = (name) => {
  if (process.env.XDG_CONFIG_HOME != null) {
    return path.join(process.env.XDG_CONFIG_HOME, name);
  }

  return path.join(process.env.HOME as string, '.config', name);
};

const win32: ICertPath = (name) => {
  if (process.env.LOCALAPPDATA != null) {
    return path.join(process.env.LOCALAPPDATA, name);
  }

  return path.join(
    process.env.USERPROFILE as string,
    'Local Settings',
    'Application Data',
    name
  );
};

function applicationConfigPath(name: string): string {
  if (typeof name !== 'string') {
    throw new TypeError('`name` must be string');
  }

  switch (os.platform()) {
    case 'darwin':
      return darwin(name);
    case 'linux':
      return linux(name);
    case 'win32':
      return win32(name);
  }

  throw new Error('Platform not supported');
}

export default applicationConfigPath;
