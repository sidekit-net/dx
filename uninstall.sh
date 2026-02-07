#!/usr/bin/env bash
# dx uninstaller script
# Removes dx and optionally installed .NET SDKs

set -e

DVM_DIR="${DVM_DIR:-$HOME/.dvm}"
INSTALL_DIR="${DX_INSTALL_DIR:-$HOME/.local/bin}"

echo "dx uninstaller"
echo "=============="
echo ""

# Check if dx is installed
if [ ! -f "$INSTALL_DIR/dx" ]; then
    echo "dx is not installed (no $INSTALL_DIR/dx binary found)"
    exit 0
fi

# Show what will be removed
echo "This will remove:"
echo "  - $INSTALL_DIR/dx (dx binary)"

# Check for DVM directory and installed SDKs
if [ -d "$DVM_DIR" ]; then
    echo "  - $DVM_DIR/cache/ (cached installers)"
    echo "  - $DVM_DIR/current (active version symlink)"

    if [ -d "$DVM_DIR/versions" ] && [ -n "$(ls -A "$DVM_DIR/versions" 2>/dev/null)" ]; then
        echo "  - $DVM_DIR/versions/ (installed .NET SDKs):"
        for ver in "$DVM_DIR/versions"/*/; do
            [ -d "$ver" ] && echo "      - $(basename "$ver")"
        done
    fi
fi

echo ""
printf "Continue? [y/N] "
read -r answer
if [[ ! "$answer" =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""

# Remove dx lines from shell rc files
remove_from_rc() {
    local rc_file="$1"

    if [ -f "$rc_file" ] && grep -q 'dx - dotnet extras' "$rc_file" 2>/dev/null; then
        # Create backup
        cp "$rc_file" "$rc_file.dx-backup"

        # Remove the dx block
        sed -i '/# dx - dotnet extras/,/^export PATH=/d' "$rc_file"

        # Clean up any leftover empty lines
        sed -i '/^$/N;/^\n$/d' "$rc_file"

        echo "Removed dx from $rc_file (backup: $rc_file.dx-backup)"
    fi
}

# Check common rc files
remove_from_rc "$HOME/.bashrc"
remove_from_rc "$HOME/.bash_profile"
remove_from_rc "$HOME/.zshrc"

# Remove dx binary
echo "Removing $INSTALL_DIR/dx..."
rm -f "$INSTALL_DIR/dx"

# Remove DVM directory
if [ -d "$DVM_DIR" ]; then
    echo "Removing $DVM_DIR..."
    rm -rf "$DVM_DIR"
fi

echo ""
echo "dx uninstalled successfully!"
echo ""
echo "Restart your shell or run:"
echo "  exec \$SHELL"
