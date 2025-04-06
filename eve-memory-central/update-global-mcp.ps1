# PowerShell script to update global Cursor MCP configuration
# This script automates the process of updating the global MCP configuration

# Define paths
$cursorMcpPath = "$env:USERPROFILE\.cursor\mcp.json"
$eveCentralDir = "C:\EVE\Eve Personal Assistant"
$eveMcpSourcePath = "$eveCentralDir\cursor-mcp.json"

# Ensure the central directory exists
if (-not (Test-Path $eveCentralDir)) {
    Write-Host "Creating Eve Personal Assistant directory at $eveCentralDir" -ForegroundColor Green
    New-Item -Path $eveCentralDir -ItemType Directory -Force | Out-Null
    
    # Copy all required files from the current directory to the Eve central directory
    Write-Host "Copying MCP server files to $eveCentralDir" -ForegroundColor Green
    Copy-Item -Path ".\*" -Destination $eveCentralDir -Force -Recurse
} else {
    Write-Host "Eve Personal Assistant directory already exists at $eveCentralDir" -ForegroundColor Yellow
    
    # Update existing files
    Write-Host "Updating MCP server files in $eveCentralDir" -ForegroundColor Green
    Copy-Item -Path ".\*" -Destination $eveCentralDir -Force -Recurse
}

# Backup existing Cursor MCP configuration
if (Test-Path $cursorMcpPath) {
    $backupPath = "$cursorMcpPath.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Write-Host "Backing up existing Cursor MCP configuration to $backupPath" -ForegroundColor Yellow
    Copy-Item -Path $cursorMcpPath -Destination $backupPath -Force
}

# Copy the new MCP configuration
Write-Host "Updating global Cursor MCP configuration" -ForegroundColor Green
Copy-Item -Path $eveMcpSourcePath -Destination $cursorMcpPath -Force

# Install Node.js dependencies if needed
Write-Host "Checking Node.js dependencies" -ForegroundColor Green
Set-Location $eveCentralDir

if (-not (Test-Path "$eveCentralDir\node_modules\uuid")) {
    Write-Host "Installing required Node.js dependencies" -ForegroundColor Yellow
    npm init -y
    npm install uuid
} else {
    Write-Host "Node.js dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "Eve Memory System has been successfully installed!" -ForegroundColor Green
Write-Host "Global MCP configuration has been updated" -ForegroundColor Green
Write-Host ""
Write-Host "Please restart Cursor for the changes to take effect." -ForegroundColor Cyan
Write-Host "" 