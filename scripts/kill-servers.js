#!/usr/bin/env node

/**
 * Script to kill all Vite/Node development servers for this project
 * This helps clean up any lingering localhost processes
 */

import { execSync } from 'child_process';
import { platform } from 'os';

const PORTS_TO_CHECK = [
  3000,  // Common React dev port
  4173,  // Vite preview port
  5173,  // Vite default dev port
  8080,  // Alternative dev port
];

function killProcessOnPort(port) {
  try {
    if (platform() === 'win32') {
      // Windows
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8', stdio: 'pipe' });
      const lines = output.split('\n').filter(line => line.trim());

      lines.forEach(line => {
        const match = line.match(/\s+(\d+)\s*$/);
        if (match) {
          const pid = match[1];
          try {
            execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
            console.log(`✓ Killed process on port ${port} (PID: ${pid})`);
          } catch (err) {
            // Process might already be dead
          }
        }
      });
    } else {
      // macOS/Linux
      const output = execSync(`lsof -ti:${port}`, { encoding: 'utf-8', stdio: 'pipe' });
      const pids = output.trim().split('\n').filter(pid => pid);

      pids.forEach(pid => {
        try {
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
          console.log(`✓ Killed process on port ${port} (PID: ${pid})`);
        } catch (err) {
          // Process might already be dead
        }
      });
    }
  } catch (err) {
    // No process found on this port (which is fine)
    if (err.status !== 1) {
      console.log(`  No process found on port ${port}`);
    }
  }
}

function killViteProcesses() {
  try {
    if (platform() === 'win32') {
      // Windows - kill all node processes running vite
      execSync('taskkill /F /IM node.exe /FI "WINDOWTITLE eq vite*"', { stdio: 'ignore' });
    } else {
      // macOS/Linux - find and kill vite processes
      const output = execSync('ps aux | grep -E "vite|node.*vite" | grep -v grep', {
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      const lines = output.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        const match = line.match(/\s+(\d+)\s+/);
        if (match) {
          const pid = match[1];
          try {
            execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
            console.log(`✓ Killed Vite process (PID: ${pid})`);
          } catch (err) {
            // Process might already be dead
          }
        }
      });
    }
  } catch (err) {
    // No vite processes found
    console.log('  No Vite processes found');
  }
}

console.log('🔍 Scanning for development servers...\n');

// Kill processes on common ports
console.log('Checking common development ports:');
PORTS_TO_CHECK.forEach(port => killProcessOnPort(port));

console.log('\nChecking for Vite processes:');
killViteProcesses();

console.log('\n✅ Server cleanup complete!');
console.log('All lingering localhost servers have been stopped.\n');
