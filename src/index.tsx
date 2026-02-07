#!/usr/bin/env bun

const HELP = `
dx - dotnet extras

Usage:
  dx sdk <command> [args]    .NET SDK version management
  dx deps <path>             NuGet package & reference manager (TUI)
  dx help                    Show this help message

SDK Commands:
  dx sdk install [version]   Download and install SDK version (interactive if no version)
  dx sdk uninstall [version] Remove installed SDK version (interactive if no version)
  dx sdk use [version]       Set active SDK for current shell (interactive if no version)
  dx sdk list                Show installed SDK versions
  dx sdk list-remote         Show available SDK versions from Microsoft
  dx sdk current             Display active SDK version
  dx sdk default [version]   Set/show default version for new shells

Deps Commands:
  dx deps <path>             Open TUI for a .csproj or .sln file

Examples:
  dx sdk install 8.0         Install latest .NET 8.0.x
  dx sdk use                 Interactive version selection
  dx deps ./MySolution.sln   Manage NuGet packages in solution
`;

async function main() {
  const [subcommand, ...rest] = process.argv.slice(2);

  switch (subcommand) {
    case "sdk": {
      const { runSdk } = await import("./sdk/index.js");
      await runSdk(rest);
      break;
    }

    case "deps": {
      const { runDeps } = await import("./deps/index.js");
      runDeps(rest);
      break;
    }

    case "help":
    case undefined:
      console.log(HELP);
      break;

    default:
      console.error(`Unknown command: ${subcommand}`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
