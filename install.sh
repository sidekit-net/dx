#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------------------
# dx (dotnet extras) installer
# Usage: curl -fsSL https://raw.githubusercontent.com/sidekit-net/dx/main/install.sh | bash
# -------------------------------------------------------------------

REPO="sidekit-net/dx"
INSTALL_DIR="${DX_INSTALL_DIR:-$HOME/.local/bin}"
BINARY_NAME="dx"
DVM_DIR="${DVM_DIR:-$HOME/.dvm}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

info() { printf "${CYAN}info${NC}  %s\n" "$1"; }
ok() { printf "${GREEN}ok${NC}    %s\n" "$1"; }
error() {
  printf "${RED}error${NC} %s\n" "$1" >&2
  exit 1
}

# Detect OS
detect_os() {
  case "$(uname -s)" in
  Linux*) echo "linux" ;;
  Darwin*) echo "darwin" ;;
  MINGW* | MSYS* | CYGWIN*) echo "windows" ;;
  *) error "Unsupported operating system: $(uname -s)" ;;
  esac
}

# Detect architecture
detect_arch() {
  case "$(uname -m)" in
  x86_64 | amd64) echo "x64" ;;
  arm64 | aarch64) echo "arm64" ;;
  *) error "Unsupported architecture: $(uname -m)" ;;
  esac
}

# Get latest release tag from GitHub API
get_latest_version() {
  local url="https://api.github.com/repos/${REPO}/releases/latest"
  if command -v curl &>/dev/null; then
    curl -fsSL "$url" | grep '"tag_name"' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/'
  elif command -v wget &>/dev/null; then
    wget -qO- "$url" | grep '"tag_name"' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/'
  else
    error "Neither curl nor wget found. Please install one of them."
  fi
}

# Download file
download() {
  local url="$1"
  local output="$2"
  if command -v curl &>/dev/null; then
    curl -fsSL "$url" -o "$output"
  elif command -v wget &>/dev/null; then
    wget -qO "$output" "$url"
  fi
}

# Detect shell and rc file
detect_shell_rc() {
  local shell_name
  shell_name="$(basename "$SHELL")"

  case "$shell_name" in
    zsh)  echo "$HOME/.zshrc" ;;
    bash)
      if [ -f "$HOME/.bashrc" ]; then
        echo "$HOME/.bashrc"
      elif [ -f "$HOME/.bash_profile" ]; then
        echo "$HOME/.bash_profile"
      else
        echo "$HOME/.bashrc"
      fi
      ;;
    *)    echo "$HOME/.bashrc" ;;
  esac
}

main() {
  local os arch version artifact url

  os="$(detect_os)"
  arch="$(detect_arch)"

  info "Detected platform: ${os}-${arch}"

  # Check for supported combinations
  if [[ "$os" == "darwin" && "$arch" == "arm64" ]]; then
    : # Apple Silicon — supported
  elif [[ "$os" == "darwin" && "$arch" == "x64" ]]; then
    : # Intel Mac — supported
  elif [[ "$os" == "linux" && "$arch" == "x64" ]]; then
    : # Linux x64 — supported
  elif [[ "$os" == "linux" && "$arch" == "arm64" ]]; then
    : # Linux arm64 — supported
  elif [[ "$os" == "windows" ]]; then
    : # Windows — supported
  else
    error "Unsupported platform: ${os}-${arch}"
  fi

  info "Fetching latest release..."
  version="$(get_latest_version)"
  if [[ -z "$version" ]]; then
    error "Could not determine latest version. Check https://github.com/${REPO}/releases"
  fi
  info "Latest version: ${version}"

  # Build artifact name
  artifact="${BINARY_NAME}-${os}-${arch}"
  if [[ "$os" == "windows" ]]; then
    artifact="${artifact}.exe"
  fi

  url="https://github.com/${REPO}/releases/download/${version}/${artifact}"
  info "Downloading ${url}..."

  # Create install directory
  mkdir -p "$INSTALL_DIR"

  tmp="$(mktemp)"
  trap 'rm -f "$tmp"' EXIT

  download "$url" "$tmp"

  # Install binary
  local dest="${INSTALL_DIR}/${BINARY_NAME}"
  if [[ "$os" == "windows" ]]; then
    dest="${dest}.exe"
  fi

  mv "$tmp" "$dest"
  chmod +x "$dest"

  ok "Installed ${BINARY_NAME} ${version} to ${dest}"

  # Create DVM directory structure for SDK management
  mkdir -p "$DVM_DIR/versions"
  mkdir -p "$DVM_DIR/cache"

  # Configure shell for SDK management
  RC_FILE="$(detect_shell_rc)"

  SHELL_CONFIG='# dx - dotnet extras
export DVM_DIR="$HOME/.dvm"
export DOTNET_ROOT="$DVM_DIR/current"
export PATH="'"${INSTALL_DIR}"':$DVM_DIR/current:$PATH"'

  # Check if already added
  if ! grep -q 'dx - dotnet extras' "$RC_FILE" 2>/dev/null; then
    echo "" >> "$RC_FILE"
    echo "$SHELL_CONFIG" >> "$RC_FILE"
    info "Added dx configuration to $RC_FILE"
  else
    info "dx already configured in $RC_FILE"
  fi

  echo ""
  ok "dx installed successfully!"
  echo ""

  # Check if install dir is in PATH
  if ! echo "$PATH" | tr ':' '\n' | grep -qx "$INSTALL_DIR"; then
    info "Restart your terminal or run:"
    echo "  source $RC_FILE"
    echo ""
  fi

  info "Get started:"
  echo "  dx sdk install         # Install a .NET SDK"
  echo "  dx deps ./project.sln  # Manage NuGet packages"
}

main
