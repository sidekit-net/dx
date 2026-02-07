#!/usr/bin/env bash
# dx sdk binary integration test suite
# Runs inside Docker container to test the compiled dx binary

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
echo "     dx sdk Integration Tests"
echo "========================================"
echo ""

# ── Step 1: Verify dx sdk responds to help ──
echo -e "${YELLOW}Step 1: Verify dx sdk help${NC}"
if dx sdk help 2>&1 | grep -q "Usage:"; then
    pass "dx sdk help shows usage information"
else
    fail "dx sdk help does not show usage information"
fi

# ── Step 2: Verify dx top-level help ──
echo -e "${YELLOW}Step 2: Verify dx top-level help${NC}"
if dx help 2>&1 | grep -q "dotnet extras"; then
    pass "dx help shows dotnet extras"
else
    fail "dx help does not show dotnet extras"
fi

# ── Step 3: Install .NET 8.0 ──
echo -e "${YELLOW}Step 3: Install .NET 8.0${NC}"
if dx sdk install 8.0; then
    pass "dx sdk install 8.0 succeeded"
else
    fail "dx sdk install 8.0 failed"
fi

# ── Step 4: Verify 8.0 appears in list ──
echo -e "${YELLOW}Step 4: Verify 8.0 in list${NC}"
if dx sdk list | grep -q "8\.0"; then
    pass "dx sdk list shows 8.0"
else
    fail "dx sdk list does not show 8.0"
fi

# ── Step 5: Use 8.0 and verify symlink ──
echo -e "${YELLOW}Step 5: Use .NET 8.0 and verify${NC}"
if dx sdk use 8.0; then
    pass "dx sdk use 8.0 succeeded"
else
    fail "dx sdk use 8.0 failed"
fi

symlink_target=$(readlink "$DVM_DIR/current" 2>/dev/null || true)
if [[ "$symlink_target" == */8.0.* ]]; then
    pass "current symlink points to 8.0.x ($symlink_target)"
else
    fail "current symlink expected */8.0.*, got: $symlink_target"
fi

# ── Step 6: Verify dx sdk current shows 8.0 ──
echo -e "${YELLOW}Step 6: Verify dx sdk current${NC}"
current_version=$(dx sdk current 2>&1)
if [[ "$current_version" == 8.0.* ]]; then
    pass "dx sdk current shows 8.0.x ($current_version)"
else
    fail "dx sdk current expected 8.0.x, got: $current_version"
fi

# ── Step 7: Set default version ──
echo -e "${YELLOW}Step 7: Set default version to 8.0${NC}"
if dx sdk default 8.0; then
    pass "dx sdk default 8.0 succeeded"
else
    fail "dx sdk default 8.0 failed"
fi

# ── Step 8: Verify default is set ──
echo -e "${YELLOW}Step 8: Verify default version${NC}"
if dx sdk default 2>&1 | grep -q "8\.0"; then
    pass "dx sdk default shows 8.0"
else
    fail "dx sdk default does not show 8.0"
fi

# ── Step 9: Install .NET 9.0 ──
echo -e "${YELLOW}Step 9: Install .NET 9.0${NC}"
if dx sdk install 9.0; then
    pass "dx sdk install 9.0 succeeded"
else
    fail "dx sdk install 9.0 failed"
fi

# ── Step 10: Use 9.0 and verify ──
echo -e "${YELLOW}Step 10: Use .NET 9.0 and verify${NC}"
if dx sdk use 9.0; then
    pass "dx sdk use 9.0 succeeded"
else
    fail "dx sdk use 9.0 failed"
fi

symlink_target=$(readlink "$DVM_DIR/current" 2>/dev/null || true)
if [[ "$symlink_target" == */9.0.* ]]; then
    pass "current symlink points to 9.0.x ($symlink_target)"
else
    fail "current symlink expected */9.0.*, got: $symlink_target"
fi

# ── Step 11: Verify both versions in list ──
echo -e "${YELLOW}Step 11: Verify both versions in list${NC}"
list_output=$(dx sdk list 2>&1)
if echo "$list_output" | grep -q "8\.0" && echo "$list_output" | grep -q "9\.0"; then
    pass "dx sdk list shows both 8.0 and 9.0"
else
    fail "dx sdk list does not show both versions"
fi

# ── Step 12: Uninstall 8.0 ──
echo -e "${YELLOW}Step 12: Uninstall .NET 8.0${NC}"
if dx sdk uninstall 8.0; then
    pass "dx sdk uninstall 8.0 succeeded"
else
    fail "dx sdk uninstall 8.0 failed"
fi

# ── Step 13: Verify 8.0 is gone from list ──
echo -e "${YELLOW}Step 13: Verify 8.0 is removed${NC}"
list_output=$(dx sdk list 2>&1 || true)
if echo "$list_output" | grep -q "8\.0"; then
    fail "dx sdk list still shows 8.0 after uninstall"
else
    pass "8.0 no longer appears in dx sdk list"
fi

# ── Step 14: Uninstall 9.0 ──
echo -e "${YELLOW}Step 14: Uninstall .NET 9.0${NC}"
if dx sdk uninstall 9.0; then
    pass "dx sdk uninstall 9.0 succeeded"
else
    fail "dx sdk uninstall 9.0 failed"
fi

# ── Step 15: Verify 9.0 is gone from list ──
echo -e "${YELLOW}Step 15: Verify 9.0 is removed${NC}"
list_output=$(dx sdk list 2>&1 || true)
if echo "$list_output" | grep -q "9\.0"; then
    fail "dx sdk list still shows 9.0 after uninstall"
else
    pass "9.0 no longer appears in dx sdk list"
fi

# ── Step 16: Verify empty list message ──
echo -e "${YELLOW}Step 16: Verify empty list message${NC}"
if dx sdk list 2>&1 | grep -q "No .NET SDK versions installed"; then
    pass "dx sdk list shows no versions installed message"
else
    fail "dx sdk list does not show expected empty message"
fi

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
