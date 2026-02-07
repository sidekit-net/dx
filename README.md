# dx - dotnet extras

A unified CLI tool for .NET development, combining SDK version management and NuGet package management.

## Features

### SDK Version Management (`dx sdk`)

Manage multiple .NET SDK versions with ease:

- **Install SDKs**: Interactive or direct installation of any .NET SDK version
- **Switch versions**: Quickly switch between installed SDKs
- **Version aliases**: Use `latest`, `lts`, or partial versions (e.g., `8.0`)
- **Default versions**: Set a default SDK for new shells

### NuGet Package Manager (`dx deps`)

Terminal UI for managing NuGet packages and project references:

- **Search packages**: Browse and search the NuGet registry
- **Manage dependencies**: Add, update, or remove packages
- **Project references**: Add/remove project-to-project references
- **Solution support**: Batch operations across multiple projects
- **Interactive TUI**: Beautiful terminal interface with keyboard navigation

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/alveflo/dx/main/install.sh | bash
```

After installation, restart your terminal or run:
```bash
source ~/.bashrc  # or ~/.zshrc for zsh users
```

## Usage

### SDK Commands

```bash
# Interactive installation - choose channel and version
dx sdk install

# Install specific version
dx sdk install 8.0              # Latest 8.0.x
dx sdk install 8.0.404          # Exact version
dx sdk install latest           # Latest stable
dx sdk install lts              # Current LTS

# List installed SDKs
dx sdk list

# Show available SDKs from Microsoft
dx sdk list-remote

# Switch to a different SDK
dx sdk use                      # Interactive selection
dx sdk use 8.0                  # Use specific version
dx sdk use system               # Use system dotnet

# Show current active SDK
dx sdk current

# Set default SDK for new shells
dx sdk default 8.0
dx sdk default                  # Show current default

# Uninstall an SDK
dx sdk uninstall                # Interactive selection
dx sdk uninstall 8.0            # Uninstall specific version
```

### NuGet Package Manager

```bash
# Open TUI for a project
dx deps ./MyProject.csproj

# Open TUI for a solution (batch operations)
dx deps ./MySolution.sln
```

#### TUI Navigation

**Main Screen:**
- `Tab` - Switch between Search, Installed, References tabs
- `↑↓` - Navigate lists
- `Enter` - Select package or action
- `Ctrl+C` - Exit

**Search Tab:**
- `Ctrl+P` - Toggle prerelease packages
- Type to search packages

**Installed Tab:**
- `u` - Update selected package
- `d` - Delete selected package
- `r` - Refresh package list

**References Tab:**
- `a` - Add project reference
- `d` - Remove project reference

**Solution Mode:**
- Choose between NuGet batch install or project reference management
- Select target projects for batch operations

## Configuration

### SDK Management

The SDK manager uses the following directory structure:
```
~/.dvm/
├── versions/           # Installed SDK versions
│   ├── 8.0.404/
│   └── 9.0.100/
├── current -> versions/8.0.404/  # Symlink to active version
├── cache/              # Downloaded installer scripts
└── default             # Default version file
```

Environment variables:
- `DVM_DIR` - Override default directory (default: `~/.dvm`)
- `DOTNET_ROOT` - Automatically set to current SDK (default: `$DVM_DIR/current`)

### PATH Configuration

The installer automatically adds to your shell profile:
```bash
export DVM_DIR="$HOME/.dvm"
export DOTNET_ROOT="$DVM_DIR/current"
export PATH="$HOME/.local/bin:$DVM_DIR/current:$PATH"
```

## Building from Source

Requirements:
- [Bun](https://bun.sh) runtime

```bash
# Install dependencies
bun install

# Run in development mode
bun run src/index.tsx sdk list
bun run src/index.tsx deps ./project.csproj

# Build standalone binary
bun run build

# The binary will be at dist/dx
```

## Uninstalling

```bash
curl -fsSL https://raw.githubusercontent.com/alveflo/dx/main/uninstall.sh | bash
```

Or run the uninstall script if you have the repository:
```bash
./uninstall.sh
```

This will:
- Remove the `dx` binary
- Optionally remove all installed .NET SDKs
- Clean up shell configuration

## Architecture

`dx` is a merged CLI combining two tools:

- **dvm** - .NET Version Manager (originally standalone)
- **nuget-tui** - NuGet Package Manager (originally standalone)

The codebase structure:
```
src/
├── index.tsx           # Top-level command router
├── sdk/                # SDK management (from dvm)
│   ├── commands/       # Install, use, uninstall commands
│   ├── components/     # Spinner, SelectInput UI components
│   └── utils/          # Core SDK management logic
└── deps/               # NuGet package manager (from nuget-tui)
    ├── screens/        # TUI screens
    ├── components/     # UI components
    ├── hooks/          # React hooks
    ├── services/       # dotnet CLI wrappers
    ├── api/            # NuGet API client
    └── store/          # State management
```

Built with:
- **Bun** - Fast JavaScript runtime and bundler
- **TypeScript** - Type-safe development
- **Ink** - React for terminal UIs
- **React** - Component-based UI framework

## License

MIT

## Contributing

Contributions welcome! Please feel free to submit issues or pull requests.

## Credits

This project merges functionality from:
- [dvm](https://github.com/alveflo/dvm) - .NET Version Manager
- [nuget-tui](https://github.com/alveflo/nuget-tui) - NuGet TUI
