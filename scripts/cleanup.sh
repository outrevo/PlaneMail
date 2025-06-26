#!/bin/bash

# PlaneMail Workspace Cleanup Script
# This script removes build artifacts, temporary files, and backup files

echo "🧹 Cleaning PlaneMail workspace..."
echo "=================================="

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cleanup_count=0

# Function to remove files/directories and count them
cleanup() {
    local pattern=$1
    local description=$2
    
    echo -n "Cleaning $description... "
    
    if [[ -n "$(find . -name "$pattern" 2>/dev/null)" ]]; then
        find . -name "$pattern" -exec rm -rf {} + 2>/dev/null
        found=$(find . -name "$pattern" 2>/dev/null | wc -l)
        if [[ $found -eq 0 ]]; then
            echo -e "${GREEN}✅ Done${NC}"
            ((cleanup_count++))
        else
            echo -e "${YELLOW}⚠️  Some files may remain${NC}"
        fi
    else
        echo -e "${BLUE}ℹ️  Nothing to clean${NC}"
    fi
}

# Clean backup files
echo -e "${BLUE}🗂️  Backup Files${NC}"
cleanup "*.backup" "backup files (.backup)"
cleanup "*.backup_*" "timestamped backups (.backup_*)"
cleanup "*_backup_*" "backup directories (_backup_*)"
cleanup "*.old" "old files (.old)"
cleanup "*.new" "new files (.new)"
cleanup "*.bak" "backup files (.bak)"
cleanup "*.orig" "original files (.orig)"

echo ""

# Clean build artifacts
echo -e "${BLUE}🔨 Build Artifacts${NC}"
cleanup "*.tsbuildinfo" "TypeScript build info files"
cleanup ".turbo" "Turborepo cache"

echo ""

# Clean temporary files
echo -e "${BLUE}🗃️  Temporary Files${NC}"
cleanup "*.tmp" "temporary files (.tmp)"
cleanup "*.temp" "temporary files (.temp)"
cleanup ".cache" "cache directories"

echo ""

# Clean OS files
echo -e "${BLUE}💻 OS Files${NC}"
cleanup ".DS_Store" "macOS metadata files"
cleanup "Thumbs.db" "Windows thumbnail cache"
cleanup ".Spotlight-V100" "macOS Spotlight cache"
cleanup ".Trashes" "macOS trash metadata"

echo ""

# Clean IDE files
echo -e "${BLUE}🔧 IDE Files${NC}"
cleanup "*.swp" "Vim swap files"
cleanup "*.swo" "Vim backup files"

echo ""

# Show summary
echo -e "${BLUE}📊 Summary${NC}"
echo "Cleanup operations completed: $cleanup_count"

# Optional: Show current workspace size
if command -v du >/dev/null 2>&1; then
    echo "Current workspace size:"
    du -sh . 2>/dev/null | sed 's/\t/ /'
fi

echo ""
echo -e "${GREEN}✨ Workspace cleaned successfully!${NC}"
echo ""
echo -e "${YELLOW}💡 Note:${NC} Build artifacts in packages/*/dist/ and apps/*/.next/ are preserved"
echo "   Run 'npm run clean' to remove these as well if needed"
