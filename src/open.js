import { exec } from 'child_process';
import { platform } from 'os';

export function openDashboard(port) {
  const url = `http://localhost:${port}`;
  const cmd = platform() === 'darwin' ? 'open' : platform() === 'win32' ? 'start' : 'xdg-open';
  setTimeout(() => exec(`${cmd} ${url}`), 800);
}
