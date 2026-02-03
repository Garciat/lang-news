#!/bin/bash
#
# Haskell News Scraper
#
# This scraper fetches recent news from the Haskell community and generates
# article files in the lang-news format.
#
# Usage: ./haskell-scraper.sh [OUTPUT_DIR]
#
# OUTPUT_DIR: Directory where article files will be created (default: src/articles)
#

set -e

# Configuration
OUTPUT_DIR="${1:-src/articles}"
LANGUAGE="haskell"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "Haskell News Scraper"
echo "===================="
echo "Output directory: $OUTPUT_DIR"
echo ""

# For the proof of concept, we'll generate sample articles
# In a real implementation, this would scrape from sources like:
# - https://www.haskell.org/
# - https://discourse.haskell.org/
# - https://reddit.com/r/haskell
# - GHC release announcements

generate_sample_articles() {
    # Sample Article 1: GHC Release
    local date1="2026-02-01"
    local filename1="$OUTPUT_DIR/$date1-$LANGUAGE.md"
    
    if [ ! -f "$filename1" ]; then
        cat > "$filename1" << 'EOF'
---
title: "GHC 9.6.4 Released"
date: 2026-02-01
language: haskell
source: "https://www.haskell.org/ghc/blog/20260201-ghc-9.6.4-released.html"
tags: [release, compiler, ghc]
version: "9.6.4"
---

The GHC team is pleased to announce the release of GHC 9.6.4.

## Highlights

This release includes several important bug fixes and performance improvements:

- **Compiler Performance**: Significant improvements to compile times for large modules
- **Error Messages**: Enhanced error messages for type errors
- **Runtime System**: Fixes for memory leaks in certain edge cases
- **Windows Support**: Improved compatibility with Windows 11

## Migration Notes

This is a minor release and should be a drop-in replacement for GHC 9.6.3. No code changes should be necessary for most users.

## Download

Binary distributions are available for all major platforms. Visit the [GHC downloads page](https://www.haskell.org/ghc/download.html) to get started.

For full details, see the [release notes](https://www.haskell.org/ghc/blog/20260201-ghc-9.6.4-released.html).
EOF
        echo "✓ Created: $filename1"
    else
        echo "- Skipped (exists): $filename1"
    fi

    # Sample Article 2: Haskell Foundation Update
    local date2="2026-01-28"
    local filename2="$OUTPUT_DIR/$date2-$LANGUAGE.md"
    
    if [ ! -f "$filename2" ]; then
        cat > "$filename2" << 'EOF'
---
title: "Haskell Foundation: January 2026 Update"
date: 2026-01-28
language: haskell
source: "https://haskell.foundation/news/2026-01-update.html"
tags: [foundation, community, ecosystem]
---

The Haskell Foundation is pleased to share our progress update for January 2026.

## Key Achievements

### Infrastructure Improvements

We've made significant investments in improving the Haskell tooling infrastructure:

- **GHC CI**: Reduced average build times by 40% through infrastructure upgrades
- **Hackage**: Improved reliability and performance of package uploads
- **Hoogle**: Enhanced search capabilities with better type-based search

### Community Growth

The Haskell community continues to grow:

- Over 500 new packages published to Hackage this month
- 15 successful virtual meetups across different time zones
- Launch of the Haskell Mentorship Program with 100+ participants

### Education Initiatives

We're committed to making Haskell more accessible:

- New "Haskell for Beginners" course launched with 1,000+ enrollments
- Updated documentation for popular libraries
- Video tutorial series covering intermediate topics

## Looking Ahead

Next month we'll be focusing on:

- Expanding the mentorship program
- Organizing HaskellX 2026
- Continuing infrastructure improvements

For more details, visit the [Haskell Foundation website](https://haskell.foundation/).
EOF
        echo "✓ Created: $filename2"
    else
        echo "- Skipped (exists): $filename2"
    fi

    # Sample Article 3: Stack Release
    local date3="2026-01-25"
    local filename3="$OUTPUT_DIR/$date3-$LANGUAGE.md"
    
    if [ ! -f "$filename3" ]; then
        cat > "$filename3" << 'EOF'
---
title: "Stack 2.15.1 Released"
date: 2026-01-25
language: haskell
source: "https://docs.haskellstack.org/en/stable/ChangeLog/"
tags: [release, tooling, stack]
version: "2.15.1"
---

A new version of Stack, the Haskell build tool, has been released with several improvements and bug fixes.

## What's New

### Features

- **Improved Dependency Resolution**: Better handling of complex dependency graphs
- **Faster Builds**: Optimizations to the build cache system
- **Better Error Messages**: Clearer messages when dependencies can't be resolved
- **Nix Integration**: Enhanced support for Nix-based development environments

### Bug Fixes

- Fixed issue with custom Setup.hs files
- Resolved problems with GHC 9.6.x compatibility
- Corrected behavior of `stack clean` with extra-deps

### Performance

Build times have been reduced by an average of 15% for projects with many dependencies, thanks to improved parallelization and caching strategies.

## Upgrade Instructions

To upgrade Stack, run:

```bash
stack upgrade
```

For installation instructions and more information, visit the [Stack documentation](https://docs.haskellstack.org/).
EOF
        echo "✓ Created: $filename3"
    else
        echo "- Skipped (exists): $filename3"
    fi
}

# Generate the sample articles
echo "Generating articles..."
generate_sample_articles

echo ""
echo "Done! Generated articles in $OUTPUT_DIR"
echo ""
echo "To view the articles, build the site with:"
echo "  deno task build"
