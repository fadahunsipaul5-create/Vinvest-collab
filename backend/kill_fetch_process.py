#!/usr/bin/env python3
"""
Quick script to kill any running fetch_financial_data processes
Run this before starting the turbo mode version
"""
import psutil
import sys

def kill_fetch_processes():
    """Find and kill any running fetch_financial_data processes"""
    killed_count = 0
    
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            cmdline = proc.info['cmdline']
            if cmdline and any('fetch_financial_data' in str(arg) for arg in cmdline):
                print(f"🔴 Killing process {proc.info['pid']}: {' '.join(cmdline)}")
                proc.terminate()
                proc.wait(timeout=3)  # Wait up to 3 seconds for graceful termination
                killed_count += 1
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.TimeoutExpired):
            continue
    
    if killed_count == 0:
        print("✅ No fetch_financial_data processes found running")
    else:
        print(f"✅ Killed {killed_count} fetch_financial_data process(es)")

if __name__ == "__main__":
    kill_fetch_processes()