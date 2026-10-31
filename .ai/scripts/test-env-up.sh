#!/bin/sh
# om-prepare-test-env: generated entrypoint (contract v2)
# regenerate with: om-prepare-test-env --regenerate
# history:
#   2026-10-31 generated for isolated in-memory API and Astro map QA
set -eu
cd "$(dirname "$0")/../.."
exec node .ai/scripts/test-env.mjs up "$@"
