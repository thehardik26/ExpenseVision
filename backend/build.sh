#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "=== Building React Frontend ==="
cd ../frontend
npm install
npm run build
cd ../backend

echo "=== Installing Python Backend Dependencies ==="
pip install -r requirements.txt

echo "=== Collecting Static Files & Migrating DB ==="
python manage.py collectstatic --no-input
python manage.py migrate
echo "=== Build Complete! ==="
