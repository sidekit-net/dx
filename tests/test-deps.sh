#!/usr/bin/env bash
# dx deps unit tests
# Tests parsing and service functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

echo "========================================"
echo "       dx deps Unit Tests"
echo "========================================"
echo ""

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FIXTURES_DIR="$SCRIPT_DIR/fixtures"

# Change to project root to run tests
cd "$PROJECT_ROOT"

# ── Step 1: Test solution parser ──
echo -e "${YELLOW}Step 1: Test solution parser${NC}"

# Create a test script that uses the solution parser
cat > "$PROJECT_ROOT/test-solution-parser.ts" <<'EOF'
import { parseSolution } from './src/deps/services/solution-parser.ts';

const solutionPath = process.argv[2];
try {
  const projects = parseSolution(solutionPath);
  if (projects.length === 2) {
    console.log('PASS: Found 2 projects');
    process.exit(0);
  } else {
    console.log(`FAIL: Expected 2 projects, got ${projects.length}`);
    process.exit(1);
  }
} catch (err: any) {
  console.log(`FAIL: ${err.message}`);
  process.exit(1);
}
EOF

if bun run "$PROJECT_ROOT/test-solution-parser.ts" "$FIXTURES_DIR/TestSolution.sln" 2>&1 | grep -q "PASS"; then
    pass "Solution parser finds 2 projects"
else
    fail "Solution parser test failed"
fi
rm -f "$PROJECT_ROOT/test-solution-parser.ts"

# ── Step 2: Test project parser ──
echo -e "${YELLOW}Step 2: Test project parser${NC}"

cat > "$PROJECT_ROOT/test-project-parser.ts" <<'EOF'
import { parseProjectPackages } from './src/deps/services/project-parser.ts';

const projectPath = process.argv[2];
try {
  const packages = parseProjectPackages(projectPath);
  if (packages.length === 3) {
    console.log('PASS: Found 3 packages');
    process.exit(0);
  } else {
    console.log(`FAIL: Expected 3 packages, got ${packages.length}`);
    process.exit(1);
  }
} catch (err: any) {
  console.log(`FAIL: ${err.message}`);
  process.exit(1);
}
EOF

if bun run "$PROJECT_ROOT/test-project-parser.ts" "$FIXTURES_DIR/TestProject.csproj" 2>&1 | grep -q "PASS"; then
    pass "Project parser finds 3 packages"
else
    fail "Project parser test failed"
fi
rm -f "$PROJECT_ROOT/test-project-parser.ts"

# ── Step 3: Test project parser for AnotherProject ──
echo -e "${YELLOW}Step 3: Test project parser for sub project${NC}"

cat > "$PROJECT_ROOT/test-another-parser.ts" <<'EOF'
import { parseProjectPackages } from './src/deps/services/project-parser.ts';

const projectPath = process.argv[2];
try {
  const packages = parseProjectPackages(projectPath);
  if (packages.length === 1 && packages[0]?.id === 'AutoMapper') {
    console.log('PASS: Found AutoMapper package');
    process.exit(0);
  } else {
    console.log(`FAIL: Expected AutoMapper, got ${packages.length} packages`);
    process.exit(1);
  }
} catch (err: any) {
  console.log(`FAIL: ${err.message}`);
  process.exit(1);
}
EOF

if bun run "$PROJECT_ROOT/test-another-parser.ts" "$FIXTURES_DIR/sub/AnotherProject.csproj" 2>&1 | grep -q "PASS"; then
    pass "Project parser finds AutoMapper in sub project"
else
    fail "Sub project parser test failed"
fi
rm -f "$PROJECT_ROOT/test-another-parser.ts"

# ── Step 4: Test project reference parser ──
echo -e "${YELLOW}Step 4: Test project reference parser${NC}"

cat > "$PROJECT_ROOT/test-ref-parser.ts" <<'EOF'
import { parseProjectReferences } from './src/deps/services/project-parser.ts';

const projectPath = process.argv[2];
try {
  const refs = parseProjectReferences(projectPath);
  // TestProject has no references
  if (refs.length === 0) {
    console.log('PASS: TestProject has no references');
    process.exit(0);
  } else {
    console.log(`FAIL: Expected 0 references, got ${refs.length}`);
    process.exit(1);
  }
} catch (err: any) {
  console.log(`FAIL: ${err.message}`);
  process.exit(1);
}
EOF

if bun run "$PROJECT_ROOT/test-ref-parser.ts" "$FIXTURES_DIR/TestProject.csproj" 2>&1 | grep -q "PASS"; then
    pass "Project reference parser works correctly"
else
    fail "Project reference parser test failed"
fi
rm -f "$PROJECT_ROOT/test-ref-parser.ts"

# ── Step 5: Test NuGet API client (basic connectivity) ──
echo -e "${YELLOW}Step 5: Test NuGet API client${NC}"

cat > "$PROJECT_ROOT/test-nuget-client.ts" <<'EOF'
import { searchPackages } from './src/deps/api/nuget-client.ts';

async function test() {
  try {
    const results = await searchPackages('Newtonsoft.Json', { take: 1 });
    if (Array.isArray(results) && results.length > 0 && results[0]?.id === 'Newtonsoft.Json') {
      console.log('PASS: Found Newtonsoft.Json');
      process.exit(0);
    } else {
      console.log('FAIL: Did not find Newtonsoft.Json');
      process.exit(1);
    }
  } catch (err: any) {
    console.log(`FAIL: ${err.message}`);
    process.exit(1);
  }
}

test();
EOF

if timeout 10 bun run "$PROJECT_ROOT/test-nuget-client.ts" 2>&1 | grep -q "PASS"; then
    pass "NuGet API client can search packages"
else
    fail "NuGet API client test failed (network required)"
fi
rm -f "$PROJECT_ROOT/test-nuget-client.ts"

# ── Step 6: Test deps help message ──
echo -e "${YELLOW}Step 6: Test dx deps help${NC}"

if bun run src/index.tsx deps --help 2>&1 | grep -q "Usage: dx deps"; then
    pass "dx deps --help shows usage"
else
    fail "dx deps --help does not show usage"
fi

# ── Step 7: Test deps with missing file ──
echo -e "${YELLOW}Step 7: Test dx deps with missing file${NC}"

if bun run src/index.tsx deps /nonexistent.csproj 2>&1 | grep -q "File not found"; then
    pass "dx deps shows error for missing file"
else
    fail "dx deps does not show error for missing file"
fi

# ── Step 8: Test deps with invalid file type ──
echo -e "${YELLOW}Step 8: Test dx deps with invalid file type${NC}"

# Create a dummy file
touch /tmp/test.txt
if bun run src/index.tsx deps /tmp/test.txt 2>&1 | grep -q "must be a .csproj or .sln"; then
    pass "dx deps shows error for invalid file type"
    rm /tmp/test.txt
else
    fail "dx deps does not show error for invalid file type"
    rm /tmp/test.txt
fi

# Clean up
rm -f /tmp/test-*.ts

# ── Summary ──
echo ""
echo "========================================"
echo "            Test Summary"
echo "========================================"
TOTAL=$((TESTS_PASSED + TESTS_FAILED))
echo -e "Tests run:    $TOTAL"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ "$TESTS_FAILED" -gt 0 ]; then
    echo -e "${RED}FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}ALL TESTS PASSED${NC}"
    exit 0
fi
