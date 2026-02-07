# dx Test Suite

Comprehensive test suite for the `dx` CLI tool, covering both SDK management and dependency management features.

## Test Structure

```
tests/
├── test-sdk.sh          # SDK Docker-based integration tests
├── test-deps.sh         # Deps unit tests
├── run-all-tests.sh     # Master test runner
├── Dockerfile           # Docker environment for SDK tests
└── fixtures/            # Test project files
    ├── TestProject.csproj
    ├── TestSolution.sln
    └── sub/
        └── AnotherProject.csproj
```

## Running Tests

### All Tests

```bash
bun test
# or
bash tests/run-all-tests.sh
```

### Deps Unit Tests Only

```bash
bun test:deps
# or
bash tests/test-deps.sh
```

### SDK Integration Tests Only (Docker required)

```bash
bun test:sdk
# or
bash tests/test-sdk.sh
```

## Test Coverage

### SDK Integration Tests (`test-sdk.sh`)

Runs in Docker to test SDK management in a clean environment:

1. ✅ `dx sdk help` - Verify help message
2. ✅ `dx help` - Verify top-level help
3. ✅ Install .NET 8.0
4. ✅ Verify 8.0 in list
5. ✅ Use 8.0 and verify symlink
6. ✅ Verify `dx sdk current`
7. ✅ Set default version
8. ✅ Verify default version
9. ✅ Install .NET 9.0
10. ✅ Use 9.0 and verify
11. ✅ Verify both versions in list
12. ✅ Uninstall 8.0
13. ✅ Verify 8.0 removed
14. ✅ Uninstall 9.0
15. ✅ Verify 9.0 removed
16. ✅ Verify empty list message

### Deps Unit Tests (`test-deps.sh`)

Tests parsing and service functionality:

1. ✅ Solution parser - Parse .sln files
2. ✅ Project parser - Parse PackageReference in .csproj
3. ✅ Sub-project parser - Parse nested projects
4. ✅ Reference parser - Parse ProjectReference
5. ✅ NuGet API client - Search packages
6. ✅ `dx deps --help` - Verify help
7. ✅ Missing file error - Proper error handling
8. ✅ Invalid file type error - Validation

## CI/CD

GitHub Actions workflows automatically run tests:

- **`.github/workflows/test.yml`** - Runs on every push to `main` and all PRs
  - Unit tests (deps)
  - Integration tests (SDK in Docker)
  - TypeScript type checking

- **`.github/workflows/release.yml`** - Builds release binaries for all platforms on tags

## Requirements

- **Bun** - JavaScript runtime (for deps tests)
- **Docker** - Container platform (for SDK tests)
- **Internet connection** - For NuGet API tests and SDK downloads

## Test Fixtures

Test projects in `fixtures/` directory:

- **TestProject.csproj** - Sample .NET 8.0 console app with 3 NuGet packages
- **TestSolution.sln** - Solution file with 2 projects
- **sub/AnotherProject.csproj** - Library project with 1 NuGet package

These fixtures test:
- Solution parsing
- Package reference parsing
- Multi-project scenarios
- Project reference handling

## Writing New Tests

### Adding SDK Tests

Edit `tests/test-sdk.sh` and add new steps following the pattern:

```bash
echo -e "${YELLOW}Step N: Test description${NC}"
if dx sdk some-command; then
    pass "Test passed message"
else
    fail "Test failed message"
fi
```

### Adding Deps Tests

Edit `tests/test-deps.sh`:

```bash
echo -e "${YELLOW}Step N: Test description${NC}"

# Create test script
cat > "$PROJECT_ROOT/test-something.ts" <<'EOF'
import { someFunction } from './src/deps/services/something.ts';
// Test code here
EOF

if bun run "$PROJECT_ROOT/test-something.ts" 2>&1 | grep -q "PASS"; then
    pass "Test description"
else
    fail "Test description"
fi
rm -f "$PROJECT_ROOT/test-something.ts"
```

## Troubleshooting

### Docker Tests Fail

Ensure Docker is installed and running:
```bash
docker --version
docker ps
```

### Network Tests Fail

The NuGet API test requires internet connectivity. If behind a proxy, configure Docker networking appropriately.

### Permission Errors

Make test scripts executable:
```bash
chmod +x tests/*.sh
```

## Performance

- Deps unit tests: ~2-3 seconds
- SDK integration tests: ~2-3 minutes (downloads .NET SDKs)
- Total suite: ~3-4 minutes
