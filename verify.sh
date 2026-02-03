#!/bin/bash
#
# End-to-End Verification Script
#
# This script verifies that the complete flow works:
# 1. Scraper generates articles
# 2. Articles have correct format
# 3. All necessary files are in place
#

set -e

echo "========================================="
echo "Lang News - End-to-End Verification"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

info() {
    echo "ℹ $1"
}

# Test 1: Check directory structure
echo "Test 1: Directory Structure"
echo "----------------------------"

check_dir() {
    if [ -d "$1" ]; then
        success "Directory exists: $1"
        return 0
    else
        error "Directory missing: $1"
        return 1
    fi
}

check_dir "src"
check_dir "src/_includes"
check_dir "src/articles"
check_dir "scrapers"
check_dir "docs"
echo ""

# Test 2: Check required files
echo "Test 2: Required Files"
echo "----------------------"

check_file() {
    if [ -f "$1" ]; then
        success "File exists: $1"
        return 0
    else
        error "File missing: $1"
        return 1
    fi
}

check_file "_config.ts"
check_file "deno.json"
check_file "src/index.md"
check_file "src/articles.vto"
check_file "src/_includes/base.vto"
check_file "src/_includes/article.vto"
check_file "scrapers/haskell-scraper.ts"
check_file "docs/article-format.md"
check_file "docs/scraper-protocol.md"
check_file "docs/adding-scrapers.md"
echo ""

# Test 3: Check scraper is executable
echo "Test 3: Scraper Executable"
echo "---------------------------"

if [ -x "scrapers/haskell-scraper.ts" ]; then
    success "Haskell scraper is executable"
else
    error "Haskell scraper is not executable"
    info "Run: chmod +x scrapers/haskell-scraper.ts"
fi
echo ""

# Test 4: Check for Deno (needed to run scraper)
echo "Test 4: Deno Availability"
echo "-------------------------"

if command -v deno &> /dev/null; then
    DENO_VERSION=$(deno --version | head -n 1)
    success "Deno is installed: $DENO_VERSION"
    
    # Try to run the scraper
    echo ""
    echo "Test 5: Scraper Execution"
    echo "-------------------------"
    
    # Create a temp directory for test
    TEST_DIR=$(mktemp -d)
    info "Using temporary directory: $TEST_DIR"
    
    if ./scrapers/haskell-scraper.ts "$TEST_DIR" 2>&1 | head -20; then
        success "Scraper executed"
        
        # Count generated files
        ARTICLE_COUNT=$(find "$TEST_DIR" -name "*.md" 2>/dev/null | wc -l)
        if [ "$ARTICLE_COUNT" -gt 0 ]; then
            success "Generated $ARTICLE_COUNT article(s)"
        else
            warning "No articles generated (may be network issue or no new content)"
        fi
    else
        warning "Scraper execution had issues (may be network-related)"
    fi
    
    # Clean up
    rm -rf "$TEST_DIR"
else
    warning "Deno is not installed"
    info "To install Deno, visit: https://deno.land"
    info "Skipping scraper execution test"
fi
echo ""

# Test 6: Article Format Validation
echo "Test 6: Article Format Validation"
echo "----------------------------------"

validate_article() {
    local file=$1
    local filename=$(basename "$file")
    
    # Check filename format
    if [[ $filename =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z]+\.md$ ]]; then
        success "Filename format correct: $filename"
    else
        error "Filename format incorrect: $filename"
        return 1
    fi
    
    # Check for front matter
    if head -n 1 "$file" | grep -q "^---$"; then
        success "Front matter present in $filename"
    else
        error "Front matter missing in $filename"
        return 1
    fi
    
    # Check for required fields
    local required_fields=("title:" "date:" "language:" "source:" "tags:")
    for field in "${required_fields[@]}"; do
        if grep -q "^$field" "$file"; then
            success "  $field found in $filename"
        else
            error "  $field missing in $filename"
        fi
    done
}

if [ -d "src/articles" ]; then
    for article in src/articles/*.md; do
        if [ -f "$article" ]; then
            validate_article "$article"
        fi
    done
else
    warning "No articles directory found - run the scraper first"
fi
echo ""

# Test 7: Check Lume configuration
echo "Test 7: Lume Configuration"
echo "--------------------------"

if grep -q "vento()" "_config.ts"; then
    success "Vento plugin configured"
else
    warning "Vento plugin not found in config"
fi

if grep -q "date()" "_config.ts"; then
    success "Date plugin configured"
else
    warning "Date plugin not found in config"
fi

if grep -q "metas()" "_config.ts"; then
    success "Metas plugin configured"
else
    warning "Metas plugin not found in config"
fi
echo ""

# Test 8: Build site (if Deno available)
echo "Test 8: Site Build"
echo "------------------"

if command -v deno &> /dev/null; then
    DENO_VERSION=$(deno --version | head -n 1)
    success "Deno is installed: $DENO_VERSION"
    
    # Try to build
    echo ""
    info "Attempting to build the site..."
    if deno task build; then
        success "Site built successfully!"
        
        # Check output
        if [ -d "dist" ]; then
            FILE_COUNT=$(find dist -type f | wc -l)
            success "Generated $FILE_COUNT files in dist/"
        fi
    else
        error "Build failed"
    fi
else
    warning "Deno is not installed"
    info "To install Deno, visit: https://deno.land"
    info "Site structure is ready, but cannot build without Deno"
fi
echo ""

# Summary
echo "========================================="
echo "Verification Summary"
echo "========================================="
echo ""
echo "The lang-news foundation is set up with:"
echo "  • Article format specification"
echo "  • Scraper protocol specification"  
echo "  • Haskell scraper (reference implementation)"
echo "  • Lume site configuration"
echo "  • Article and feed page layouts"
echo "  • Documentation for adding scrapers"
echo ""
echo "Next steps:"
echo "  1. Ensure Deno is installed (https://deno.land)"
echo "  2. Run: ./scrapers/haskell-scraper.ts"
echo "  3. Run: deno task build"
echo "  4. Run: deno task serve"
echo "  5. Visit: http://localhost:3000"
echo ""
echo "For more information, see README.md"
echo ""
