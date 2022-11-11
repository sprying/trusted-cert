import { execSync } from 'child_process';

export const addStore = (certificatePath: string): void => {
  execSync(
    `sudo cp ${certificatePath} /usr/local/share/ca-certificates/devcert.crt`
  );
  execSync('sudo update-ca-certificates');
};
