import { homedir } from "os";
import { join } from "path";
import { existsSync, readdirSync, rmSync, mkdirSync, writeFileSync, readFileSync, symlinkSync, readlinkSync } from "fs";

export const DVM_DIR = process.env.DVM_DIR || join(homedir(), ".dvm");
export const VERSIONS_DIR = join(DVM_DIR, "versions");
export const CACHE_DIR = join(DVM_DIR, "cache");
export const DEFAULT_FILE = join(DVM_DIR, "default");
export const CURRENT_LINK = join(DVM_DIR, "current");

const RELEASES_INDEX_URL = "https://dotnetcli.azureedge.net/dotnet/release-metadata/releases-index.json";
const DOTNET_INSTALL_URL = "https://dot.net/v1/dotnet-install.sh";

export interface Channel {
  channelVersion: string;
  latestSdk: string;
  supportPhase: string;
  releaseType: string;
}

export interface SdkVersion {
  version: string;
  isLatest?: boolean;
}

// Ensure directories exist
export function ensureDirs() {
  mkdirSync(VERSIONS_DIR, { recursive: true });
  mkdirSync(CACHE_DIR, { recursive: true });
}

// Get installed versions
export function getInstalledVersions(): string[] {
  ensureDirs();
  if (!existsSync(VERSIONS_DIR)) return [];

  return readdirSync(VERSIONS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(join(VERSIONS_DIR, d.name, "dotnet")))
    .map(d => d.name)
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
}

// Get default version
export function getDefaultVersion(): string | null {
  if (!existsSync(DEFAULT_FILE)) return null;
  return readFileSync(DEFAULT_FILE, "utf-8").trim() || null;
}

// Set default version
export function setDefaultVersion(version: string) {
  ensureDirs();
  writeFileSync(DEFAULT_FILE, version);
}

// Clear default version
export function clearDefaultVersion() {
  if (existsSync(DEFAULT_FILE)) {
    rmSync(DEFAULT_FILE);
  }
}

// Check if version is installed
export function isInstalled(version: string): boolean {
  return existsSync(join(VERSIONS_DIR, version, "dotnet"));
}

// Find installed version by partial match
export function findInstalledVersion(partial: string): string | null {
  const installed = getInstalledVersions();

  // Exact match first
  if (installed.includes(partial)) return partial;

  // Partial match (e.g., "8.0" matches "8.0.404")
  const match = installed.find(v => v.startsWith(partial));
  return match || null;
}

// Fetch available channels from Microsoft
export async function fetchChannels(): Promise<Channel[]> {
  const response = await fetch(RELEASES_INDEX_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch releases: ${response.statusText}`);
  }

  const data = await response.json() as { "releases-index": Array<{
    "channel-version": string;
    "latest-sdk": string;
    "support-phase": string;
    "release-type": string;
  }> };

  return data["releases-index"].map(r => ({
    channelVersion: r["channel-version"],
    latestSdk: r["latest-sdk"],
    supportPhase: r["support-phase"],
    releaseType: r["release-type"],
  }));
}

// Fetch SDK versions for a specific channel
export async function fetchChannelVersions(channel: string): Promise<SdkVersion[]> {
  const url = `https://dotnetcli.azureedge.net/dotnet/release-metadata/${channel}/releases.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch channel versions: ${response.statusText}`);
  }

  const data = await response.json() as { releases: Array<{ sdk: { version: string } }> };

  const versions = data.releases
    .map(r => r.sdk?.version)
    .filter((v): v is string => !!v && v.startsWith(channel))
    .slice(0, 10); // Latest 10 versions

  return versions.map((v, i) => ({
    version: v,
    isLatest: i === 0,
  }));
}

// Resolve version alias (latest, lts, partial)
export async function resolveVersion(version: string): Promise<string | null> {
  const channels = await fetchChannels();

  if (version === "latest") {
    return channels[0]?.latestSdk || null;
  }

  if (version === "lts") {
    const ltsChannel = channels.find(c => c.supportPhase === "lts");
    return ltsChannel?.latestSdk || null;
  }

  // Full version (x.y.z)
  if (version.match(/^\d+\.\d+\.\d+$/)) {
    return version;
  }

  // Partial version (x.y) - get latest SDK for that channel
  const channel = channels.find(c => c.channelVersion === version);
  return channel?.latestSdk || null;
}

// Download and cache the installer script
export async function ensureInstaller(): Promise<string> {
  const installerPath = join(CACHE_DIR, "dotnet-install.sh");

  // Check if cached and less than 1 day old
  if (existsSync(installerPath)) {
    const stat = Bun.file(installerPath);
    const mtime = (await stat.stat()).mtime;
    const age = Date.now() - mtime.getTime();
    if (age < 24 * 60 * 60 * 1000) {
      return installerPath;
    }
  }

  console.log("Downloading dotnet-install.sh...");
  const response = await fetch(DOTNET_INSTALL_URL);
  if (!response.ok) {
    throw new Error(`Failed to download installer: ${response.statusText}`);
  }

  const script = await response.text();
  await Bun.write(installerPath, script);

  // Make executable
  const proc = Bun.spawn(["chmod", "+x", installerPath]);
  await proc.exited;

  return installerPath;
}

// Install a .NET SDK version
export async function installVersion(version: string): Promise<void> {
  const installer = await ensureInstaller();
  const installDir = join(VERSIONS_DIR, version);

  mkdirSync(installDir, { recursive: true });

  const proc = Bun.spawn(["bash", installer, "--version", version, "--install-dir", installDir], {
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    rmSync(installDir, { recursive: true, force: true });
    throw new Error(`Installation failed with exit code ${exitCode}`);
  }

  // Verify
  if (!existsSync(join(installDir, "dotnet"))) {
    rmSync(installDir, { recursive: true, force: true });
    throw new Error("Installation verification failed");
  }
}

// Uninstall a version
export function uninstallVersion(version: string): void {
  const versionDir = join(VERSIONS_DIR, version);
  if (existsSync(versionDir)) {
    rmSync(versionDir, { recursive: true });
  }

  // Clear default if it was this version
  if (getDefaultVersion() === version) {
    clearDefaultVersion();
  }
}

// Set the current version by updating the symlink
export function setCurrentVersion(version: string): void {
  const versionDir = join(VERSIONS_DIR, version);

  // Remove existing symlink if it exists
  if (existsSync(CURRENT_LINK)) {
    rmSync(CURRENT_LINK);
  }

  // Create new symlink
  symlinkSync(versionDir, CURRENT_LINK);
}

// Clear the current version (use system)
export function clearCurrentVersion(): void {
  if (existsSync(CURRENT_LINK)) {
    rmSync(CURRENT_LINK);
  }
}

// Get the currently active version from symlink
export function getCurrentVersion(): string | null {
  if (!existsSync(CURRENT_LINK)) return null;

  try {
    const target = readlinkSync(CURRENT_LINK);
    return target.split("/").pop() || null;
  } catch {
    return null;
  }
}

// Get support phase label
export function getSupportLabel(phase: string): string {
  switch (phase) {
    case "lts": return "LTS";
    case "sts": return "STS";
    case "active": return "Active";
    case "current": return "Current";
    case "preview": return "Preview";
    case "eol": return "End of Life";
    default: return phase;
  }
}
