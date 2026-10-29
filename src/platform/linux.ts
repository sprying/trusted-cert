import { execFileSync } from 'child_process';

export const addStore = (certificatePath: string): void => {
  execFileSync('sudo', [
    'cp',
    certificatePath,
    '/usr/local/share/ca-certificates/devcert.crt',
  ]);
  execFileSync('sudo', ['update-ca-certificates']);
};
