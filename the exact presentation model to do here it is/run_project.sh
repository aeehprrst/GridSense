#!/usr/bin/env bash
# GridSense Root Launcher
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR/final kushagra"
./run_project.sh
