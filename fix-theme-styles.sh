#!/bin/bash

# Script to fix hardcoded theme styles across the PlaneMail app
# This script replaces common hardcoded color patterns with theme-aware classes

echo "🎨 Fixing hardcoded theme styles across PlaneMail app..."

# Define the base directory
APP_DIR="./apps/web/src/app/(app)"

# Fix common button patterns
echo "  📦 Fixing button styles..."

# Replace hardcoded black buttons with default variant
find $APP_DIR -name "*.tsx" -type f -exec sed -i '' 's/className="bg-black hover:bg-gray-900 text-white/className="/g' {} \;

# Replace hardcoded outline buttons with proper variant
find $APP_DIR -name "*.tsx" -type f -exec sed -i '' 's/className="border-gray-200 hover:bg-gray-50 text-black/className="/g' {} \;

# Fix text colors
echo "  🎯 Fixing text colors..."

# Replace hardcoded black text with theme-aware classes
find $APP_DIR -name "*.tsx" -type f -exec sed -i '' 's/text-black/text-foreground/g' {} \;

# Replace hardcoded gray text with muted foreground
find $APP_DIR -name "*.tsx" -type f -exec sed -i '' 's/text-gray-600/text-muted-foreground/g' {} \;
find $APP_DIR -name "*.tsx" -type f -exec sed -i '' 's/text-gray-500/text-muted-foreground/g' {} \;
find $APP_DIR -name "*.tsx" -type f -exec sed -i '' 's/text-gray-400/text-muted-foreground/g' {} \;

# Fix icon colors
echo "  🎨 Fixing icon colors..."
find $APP_DIR -name "*.tsx" -type f -exec sed -i '' 's/text-gray-600/text-muted-foreground/g' {} \;

# Fix border colors
echo "  🔲 Fixing borders..."
find $APP_DIR -name "*.tsx" -type f -exec sed -i '' 's/border-gray-200/border/g' {} \;
find $APP_DIR -name "*.tsx" -type f -exec sed -i '' 's/border-gray-100/border/g' {} \;

# Fix background colors
echo "  🎨 Fixing backgrounds..."
find $APP_DIR -name "*.tsx" -type f -exec sed -i '' 's/bg-gray-50/bg-muted\/50/g' {} \;
find $APP_DIR -name "*.tsx" -type f -exec sed -i '' 's/hover:bg-gray-50/hover:bg-muted\/50/g' {} \;
find $APP_DIR -name "*.tsx" -type f -exec sed -i '' 's/bg-white/bg-card/g' {} \;

echo "✅ Theme fixes applied! Please review the changes and test the application."
echo "🔍 Check specific files that might need manual fixes:"
echo "   - Complex custom components"
echo "   - Third-party component overrides"
echo "   - Novel editor components"
