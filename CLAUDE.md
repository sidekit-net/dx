# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**dx** (dotnet extras) is a CLI toolkit for .NET developers built with Bun, TypeScript, and Ink (React for terminals). It has two modules:

- **`dx sdk`** — .NET SDK version manager (like nvm for Node). Manages `~/.dvm/` directory with symlink-based version switching.
- **`dx deps`** — Interactive TUI for managing NuGet packages and project references in `.csproj`/`.sln` files.

## Commands

```bash
bun install                          # Install dependencies
bun run dev sdk list                 # Run in dev mode (any subcommand after "dev")
bun run build                       # Compile to standalone binary at dist/dx
bun run typecheck                   # TypeScript type checking (tsc --noEmit)
bun run test                        # Run all tests (deps unit + SDK docker integration)
bun run test:deps                   # Deps unit tests only (~8 tests, fast)
bun run test:sdk                    # SDK integration tests in Docker (~16 tests, slow)
```

The full test suite (`bun run test`) builds a binary, then runs SDK tests inside Docker. The deps tests create temporary `.ts` scripts that import source modules directly, run them with `bun`, and check output with grep.

## Architecture

Entry point: `src/index.tsx` — routes `sdk` and `deps` subcommands via dynamic imports.

### SDK Module (`src/sdk/`)

- `index.tsx` — Command router for install/uninstall/use/list/list-remote/current/default
- `commands/` — Ink components for interactive install, uninstall, use
- `utils/dotnet.ts` — Core logic: downloads from Microsoft CDN, manages `~/.dvm/` symlinks, parses version aliases (latest, lts, 8.0)

### Deps Module (`src/deps/`)

Uses a Redux-like pattern with React Context + useReducer:

- `store/` — `app-context.tsx` (provider), `reducer.ts` (central reducer), `types.ts` (state + action types)
- `screens/` — 8 screen components routed by `currentScreen` state (ProjectSelection, Main, PackageDetail, Batch* screens)
- `App.tsx` — Screen router, reads `currentScreen` from state
- `services/` — `project-parser.ts` (regex-based .csproj parsing), `solution-parser.ts`, `dotnet-cli.ts` (shells out to `dotnet` CLI)
- `api/nuget-client.ts` — NuGet.org v3 API client
- `hooks/` — `usePackageSearch` (debounced), `useInstalledPackages`, `useProjectReferences`, `useNavigation`
- `components/` — Reusable Ink components (tabs, lists, spinners, text input)

### Key Patterns

- .csproj/.sln files are parsed with regex, not an XML library
- SDK installer downloads and caches Microsoft's official `dotnet-install.sh` script
- All TUI state flows through the central reducer; screens read/dispatch via `useApp()` context hook
- TypeScript strict mode with `noUncheckedIndexedAccess` enabled

## Tech Stack

- **Runtime:** Bun (runs TypeScript directly, compiles to standalone binary with `--compile`)
- **UI:** Ink 6 + React 19 (terminal rendering)
- **Types:** TypeScript 5.9+ with strict mode
- **No linter/formatter configured**
