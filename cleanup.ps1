# Cleanup script for Gblend project

# Remove build artifacts
echo "Cleaning build artifacts..."
if (Test-Path "cache") { Remove-Item -Recurse -Force cache }
if (Test-Path "artifacts") { Remove-Item -Recurse -Force artifacts } 
if (Test-Path "frontend/dist") { Remove-Item -Recurse -Force frontend/dist }
if (Test-Path "frontend/build") { Remove-Item -Recurse -Force frontend/build }

# Remove node_modules for clean install
echo "Removing node_modules..."
if (Test-Path "node_modules") { Remove-Item -Recurse -Force node_modules }
if (Test-Path "frontend/node_modules") { Remove-Item -Recurse -Force frontend/node_modules }

# Remove logs
echo "Cleaning logs..."
Get-ChildItem -Recurse -Name "*.log" | Remove-Item -Force

echo "Cleanup completed!"
