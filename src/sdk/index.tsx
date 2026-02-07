import { useState, useEffect } from "react";
import { render, Box, Text } from "ink";
import { Spinner } from "./components/Spinner.js";
import { runInstall } from "./commands/install.js";
import { runUse } from "./commands/use.js";
import { runUninstall } from "./commands/uninstall.js";
import {
  getInstalledVersions,
  getDefaultVersion,
  setDefaultVersion,
  findInstalledVersion,
  fetchChannels,
  getSupportLabel,
  getCurrentVersion,
  type Channel,
} from "./utils/dotnet.js";

const HELP = `
dx sdk - .NET Version Manager

Usage:
  dx sdk install [version]    Download and install SDK version (interactive if no version)
  dx sdk uninstall [version]  Remove installed SDK version (interactive if no version)
  dx sdk use [version]        Set active SDK for current shell (interactive if no version)
  dx sdk list                 Show installed SDK versions
  dx sdk list-remote          Show available SDK versions
  dx sdk current              Display active SDK version
  dx sdk default [version]    Set/show default version for new shells
  dx sdk help                 Show this help message

Version formats:
  8.0       Latest 8.0.x patch version
  8.0.100   Exact SDK version
  latest    Latest stable SDK
  lts       Current LTS version

Examples:
  dx sdk install              Interactive version selection
  dx sdk install 8.0          Install latest 8.0.x
  dx sdk use                  Interactive version selection
  dx sdk use 8.0              Use installed 8.0.x
`;

export async function runSdk(args: string[]) {
  const [cmd, ...cmdArgs] = args;

  switch (cmd) {
    case "install":
      await runInstall(cmdArgs[0]);
      break;

    case "uninstall":
      await runUninstall(cmdArgs[0]);
      break;

    case "use":
      await runUse(cmdArgs[0]);
      break;

    case "list":
      listInstalled();
      break;

    case "list-remote":
      await listRemote();
      break;

    case "current":
      showCurrent();
      break;

    case "default":
      handleDefault(cmdArgs[0]);
      break;

    case "help":
    case undefined:
      console.log(HELP);
      break;

    default:
      console.error(`Unknown sdk command: ${cmd}`);
      console.log(HELP);
      process.exit(1);
  }
}

function listInstalled() {
  const installed = getInstalledVersions();
  const defaultVersion = getDefaultVersion();
  const currentVersion = getCurrentVersion();

  if (installed.length === 0) {
    console.log("No .NET SDK versions installed");
    console.log("Use 'dx sdk install' to install one");
    return;
  }

  console.log("Installed .NET SDK versions:\n");

  for (const version of installed) {
    let marker = "";
    if (version === currentVersion) marker += " *";
    if (version === defaultVersion) marker += " (default)";
    console.log(`  ${version}${marker}`);
  }

  console.log("");
  if (currentVersion) {
    console.log("* = currently active");
  }
}

function ListRemoteCommand() {
  const [channels, setChannels] = useState<Channel[] | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchChannels()
      .then(ch => setChannels(ch))
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return <Text color="red">Error: {error}</Text>;
  }

  if (!channels) {
    return <Spinner label="Fetching available .NET SDK versions..." />;
  }

  return (
    <Box flexDirection="column">
      <Text>Available .NET SDK versions:</Text>
      <Text> </Text>
      {channels.map(ch => (
        <Text key={ch.channelVersion}>
          {"  "}{ch.channelVersion.padEnd(8)}  {ch.latestSdk.padEnd(12)}  ({getSupportLabel(ch.supportPhase)})
        </Text>
      ))}
      <Text> </Text>
      <Text>Use 'dx sdk install {"<version>"} ' to install</Text>
      <Text>Examples: dx sdk install 8.0, dx sdk install latest, dx sdk install lts</Text>
    </Box>
  );
}

async function listRemote() {
  const { waitUntilExit } = render(<ListRemoteCommand />);
  await waitUntilExit();
}

function showCurrent() {
  const current = getCurrentVersion();

  if (current) {
    console.log(current);
  } else {
    // Check for system dotnet
    try {
      const proc = Bun.spawnSync(["dotnet", "--version"]);
      if (proc.exitCode === 0) {
        const version = proc.stdout.toString().trim();
        console.log(`system (${version})`);
      } else {
        console.log("none");
      }
    } catch {
      console.log("none");
    }
  }
}

function handleDefault(version?: string) {
  if (!version) {
    const defaultVersion = getDefaultVersion();
    if (defaultVersion) {
      console.log(`Default version: ${defaultVersion}`);
    } else {
      console.log("No default version set");
      console.log("Use 'dx sdk default <version>' to set one");
    }
    return;
  }

  const found = findInstalledVersion(version);
  if (!found) {
    console.error(`Error: Version '${version}' is not installed`);
    console.error(`Use 'dx sdk install ${version}' first`);
    process.exit(1);
  }

  setDefaultVersion(found);
  console.log(`Default version set to ${found}`);
}
