#!/bin/bash
#
# Mock Build Script
#
# This creates a mock version of what the built site would look like
# without requiring Deno to be installed.
#

set -e

OUTPUT_DIR="mock-dist"
ARTICLES_DIR="src/articles"

echo "Creating mock build of the site..."
echo ""

# Clean and create output directory
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/articles"

# Create CSS (extracted from templates)
cat > "$OUTPUT_DIR/style.css" << 'EOF'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f5f5f5;
}

header {
  background: #2c3e50;
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

header .container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

header h1 {
  font-size: 1.5rem;
  font-weight: 600;
}

header a {
  color: white;
  text-decoration: none;
  margin-left: 1.5rem;
  transition: opacity 0.2s;
}

header a:hover {
  opacity: 0.8;
}

main {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.hero {
  background: white;
  padding: 3rem 2rem;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 3rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.hero h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.25rem;
  color: #666;
}

.article-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.article-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.article-card h2, .article-card h3 {
  margin: 0 0 0.5rem 0;
}

.article-card h2 a, .article-card h3 a {
  color: #2c3e50;
  text-decoration: none;
}

.article-card h2 a:hover, .article-card h3 a:hover {
  color: #3498db;
}

.article-card-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  color: #666;
}

.language-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #3498db;
  color: white;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: capitalize;
}

.tag {
  padding: 0.25rem 0.75rem;
  background: #ecf0f1;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #555;
}

.article-card-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
}

footer {
  text-align: center;
  padding: 2rem;
  color: #666;
  margin-top: 4rem;
}

.article-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-top: 2rem;
}

.article-content h1,
.article-content h2,
.article-content h3 {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.article-content h1 {
  font-size: 2rem;
  margin-top: 0;
}

.article-content h2 {
  font-size: 1.5rem;
  border-bottom: 2px solid #ecf0f1;
  padding-bottom: 0.5rem;
}

.article-content p {
  margin-bottom: 1rem;
}

.article-content ul {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

.article-content li {
  margin-bottom: 0.5rem;
}

.article-content code {
  background: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.article-content a {
  color: #3498db;
  text-decoration: none;
}

.article-content a:hover {
  text-decoration: underline;
}
EOF

# Create home page
cat > "$OUTPUT_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home - Lang News</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <div class="container">
      <h1>Lang News</h1>
      <nav>
        <a href="index.html">Home</a>
        <a href="articles.html">All Articles</a>
      </nav>
    </div>
  </header>
  <main>
    <div class="hero">
      <h1>Welcome to Lang News</h1>
      <p>Your source for the latest programming language news, updates, and releases</p>
    </div>

    <h2 style="margin-bottom: 1.5rem;">Latest Articles</h2>
    
    <article class="article-card">
      <h3><a href="articles/2026-02-01-haskell.html">GHC 9.6.4 Released</a></h3>
      <div class="article-card-meta">
        <span class="language-badge">haskell</span>
        <span>📅 February 1, 2026</span>
        <span>🔖 9.6.4</span>
      </div>
      <div class="article-card-tags">
        <span class="tag">release</span>
        <span class="tag">compiler</span>
        <span class="tag">ghc</span>
      </div>
    </article>

    <article class="article-card">
      <h3><a href="articles/2026-01-28-haskell.html">Haskell Foundation: January 2026 Update</a></h3>
      <div class="article-card-meta">
        <span class="language-badge">haskell</span>
        <span>📅 January 28, 2026</span>
      </div>
      <div class="article-card-tags">
        <span class="tag">foundation</span>
        <span class="tag">community</span>
        <span class="tag">ecosystem</span>
      </div>
    </article>

    <article class="article-card">
      <h3><a href="articles/2026-01-25-haskell.html">Stack 2.15.1 Released</a></h3>
      <div class="article-card-meta">
        <span class="language-badge">haskell</span>
        <span>📅 January 25, 2026</span>
        <span>🔖 2.15.1</span>
      </div>
      <div class="article-card-tags">
        <span class="tag">release</span>
        <span class="tag">tooling</span>
        <span class="tag">stack</span>
      </div>
    </article>
  </main>
  <footer>
    <p>&copy; 2026 Lang News - Programming Language News Aggregator</p>
  </footer>
</body>
</html>
EOF

# Create articles list page
cat > "$OUTPUT_DIR/articles.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>All Articles - Lang News</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <div class="container">
      <h1>Lang News</h1>
      <nav>
        <a href="index.html">Home</a>
        <a href="articles.html">All Articles</a>
      </nav>
    </div>
  </header>
  <main>
    <h1>All Articles</h1>

    <article class="article-card">
      <h2><a href="articles/2026-02-01-haskell.html">GHC 9.6.4 Released</a></h2>
      <div class="article-card-meta">
        <span class="language-badge">haskell</span>
        <span>📅 February 1, 2026</span>
        <span>🔖 9.6.4</span>
      </div>
      <div class="article-card-tags">
        <span class="tag">release</span>
        <span class="tag">compiler</span>
        <span class="tag">ghc</span>
      </div>
    </article>

    <article class="article-card">
      <h2><a href="articles/2026-01-28-haskell.html">Haskell Foundation: January 2026 Update</a></h2>
      <div class="article-card-meta">
        <span class="language-badge">haskell</span>
        <span>📅 January 28, 2026</span>
      </div>
      <div class="article-card-tags">
        <span class="tag">foundation</span>
        <span class="tag">community</span>
        <span class="tag">ecosystem</span>
      </div>
    </article>

    <article class="article-card">
      <h2><a href="articles/2026-01-25-haskell.html">Stack 2.15.1 Released</a></h2>
      <div class="article-card-meta">
        <span class="language-badge">haskell</span>
        <span>📅 January 25, 2026</span>
        <span>🔖 2.15.1</span>
      </div>
      <div class="article-card-tags">
        <span class="tag">release</span>
        <span class="tag">tooling</span>
        <span class="tag">stack</span>
      </div>
    </article>
  </main>
  <footer>
    <p>&copy; 2026 Lang News - Programming Language News Aggregator</p>
  </footer>
</body>
</html>
EOF

# Create a sample article page
cat > "$OUTPUT_DIR/articles/2026-02-01-haskell.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GHC 9.6.4 Released - Lang News</title>
  <link rel="stylesheet" href="../style.css">
</head>
<body>
  <header>
    <div class="container">
      <h1>Lang News</h1>
      <nav>
        <a href="../index.html">Home</a>
        <a href="../articles.html">All Articles</a>
      </nav>
    </div>
  </header>
  <main>
    <div style="background: white; padding: 2rem; border-radius: 8px; margin-bottom: 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h1>GHC 9.6.4 Released</h1>
      <div class="article-card-meta">
        <span class="language-badge">haskell</span>
        <span>📅 February 1, 2026</span>
        <span>🔖 Version 9.6.4</span>
      </div>
      <div style="margin-top: 1rem;">
        <span class="tag">release</span>
        <span class="tag">compiler</span>
        <span class="tag">ghc</span>
      </div>
    </div>

    <div class="article-content">
      <p>The GHC team is pleased to announce the release of GHC 9.6.4.</p>

      <h2>Highlights</h2>
      <p>This release includes several important bug fixes and performance improvements:</p>
      <ul>
        <li><strong>Compiler Performance</strong>: Significant improvements to compile times for large modules</li>
        <li><strong>Error Messages</strong>: Enhanced error messages for type errors</li>
        <li><strong>Runtime System</strong>: Fixes for memory leaks in certain edge cases</li>
        <li><strong>Windows Support</strong>: Improved compatibility with Windows 11</li>
      </ul>

      <h2>Migration Notes</h2>
      <p>This is a minor release and should be a drop-in replacement for GHC 9.6.3. No code changes should be necessary for most users.</p>

      <h2>Download</h2>
      <p>Binary distributions are available for all major platforms. Visit the GHC downloads page to get started.</p>

      <p>For full details, see the release notes.</p>

      <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #ecf0f1;">
        <a href="https://www.haskell.org/ghc/blog/20260201-ghc-9.6.4-released.html" target="_blank" style="display: inline-flex; align-items: center; gap: 0.5rem; color: #3498db; text-decoration: none; font-weight: 500;">
          🔗 Read the original article
        </a>
      </div>
    </div>
  </main>
  <footer>
    <p>&copy; 2026 Lang News - Programming Language News Aggregator</p>
  </footer>
</body>
</html>
EOF

echo "✓ Created mock-dist/index.html"
echo "✓ Created mock-dist/articles.html"
echo "✓ Created mock-dist/articles/2026-02-01-haskell.html"
echo "✓ Created mock-dist/style.css"
echo ""
echo "Mock build complete! Open mock-dist/index.html in a browser to preview."
