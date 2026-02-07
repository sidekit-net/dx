import { useState, useEffect } from "react";
import { render, Box, Text } from "ink";
import { Spinner } from "../components/Spinner.js";
import { SelectInput } from "../components/SelectInput.js";
import {
  fetchChannels,
  fetchChannelVersions,
  installVersion,
  resolveVersion,
  isInstalled,
  getSupportLabel,
  type Channel,
  type SdkVersion,
} from "../utils/dotnet.js";

type Step = "loading-channels" | "select-channel" | "loading-versions" | "select-version" | "installing" | "done" | "error";

interface Props {
  version?: string;
}

function InstallCommand({ version }: Props) {
  const [step, setStep] = useState<Step>(version ? "installing" : "loading-channels");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [versions, setVersions] = useState<SdkVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Load channels on mount (interactive mode)
  useEffect(() => {
    if (version) {
      // Direct install mode
      doInstall(version);
    } else {
      // Interactive mode - fetch channels
      fetchChannels()
        .then(ch => {
          setChannels(ch);
          setStep("select-channel");
        })
        .catch(err => {
          setError(err.message);
          setStep("error");
        });
    }
  }, []);

  // Load versions when channel is selected
  useEffect(() => {
    if (selectedChannel) {
      setStep("loading-versions");
      fetchChannelVersions(selectedChannel)
        .then(v => {
          setVersions(v);
          setStep("select-version");
        })
        .catch(err => {
          setError(err.message);
          setStep("error");
        });
    }
  }, [selectedChannel]);

  // Install when version is selected
  useEffect(() => {
    if (selectedVersion && step === "select-version") {
      doInstall(selectedVersion);
    }
  }, [selectedVersion]);

  async function doInstall(ver: string) {
    setStep("installing");
    try {
      // Resolve version alias if needed
      const resolved = await resolveVersion(ver);
      if (!resolved) {
        throw new Error(`Could not resolve version '${ver}'`);
      }

      if (isInstalled(resolved)) {
        setSelectedVersion(resolved);
        setError(`Version ${resolved} is already installed`);
        setStep("done");
        return;
      }

      setSelectedVersion(resolved);
      await installVersion(resolved);
      setStep("done");
    } catch (err: any) {
      setError(err.message);
      setStep("error");
    }
  }

  const channelItems = channels.map(ch => ({
    label: `${ch.channelVersion} (${getSupportLabel(ch.supportPhase)})`,
    value: ch.channelVersion,
  }));

  const versionItems = versions.map(v => ({
    label: v.isLatest ? `${v.version} (latest)` : v.version,
    value: v.version,
  }));

  return (
    <Box flexDirection="column">
      {step === "loading-channels" && (
        <Spinner label="Fetching available .NET versions..." />
      )}

      {step === "select-channel" && (
        <>
          <Text>Select .NET channel:</Text>
          <SelectInput
            items={channelItems}
            onSelect={item => setSelectedChannel(item.value)}
          />
        </>
      )}

      {step === "loading-versions" && (
        <Spinner label={`Fetching SDK versions for .NET ${selectedChannel}...`} />
      )}

      {step === "select-version" && (
        <>
          <Text>Select SDK version to install:</Text>
          <SelectInput
            items={versionItems}
            onSelect={item => setSelectedVersion(item.value)}
          />
        </>
      )}

      {step === "installing" && (
        <Spinner label={`Installing .NET SDK ${selectedVersion || version}...`} />
      )}

      {step === "done" && (
        <>
          {error ? (
            <Text color="yellow">{error}</Text>
          ) : (
            <Text color="green">Successfully installed .NET SDK {selectedVersion}</Text>
          )}
          <Text>Run 'dx sdk use {selectedVersion}' to start using it</Text>
        </>
      )}

      {step === "error" && (
        <Text color="red">Error: {error}</Text>
      )}
    </Box>
  );
}

export async function runInstall(version?: string) {
  const { waitUntilExit } = render(<InstallCommand version={version} />);
  await waitUntilExit();
}
