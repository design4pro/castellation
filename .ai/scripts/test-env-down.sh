#!/bin/sh
# om-prepare-test-env: generated entrypoint (contract v2)
# history:
#   2026-10-31 generated; stops only process groups recorded for this checkout
set -eu
cd "$(dirname "$0")/../.."
exec node .ai/scripts/test-env.mjs down
