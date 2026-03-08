#!/bin/sh
set -e

# Migrate the database
npm run db:migrate

# Start the production server
node build/index.js

