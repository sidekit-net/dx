import { useState, useEffect } from "react";
import { render, Box, Text } from "ink";
import { SelectInput } from "../components/SelectInput.js";
import {
  getInstalledVersions,
  findInstalledVersion,
  setCurrentVersion,
  clearCurrentVersion,
  getCurrentVersion,
} from "../utils/dotnet.js";

interface Props {
  version?: string;
}

function UseCommand({ version }: Props) {
  const [installed, setInstalled] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const versions = getInstalledVersions();
    setInstalled(versions);

    if (version) {
      handleSelect(version);
    }
  }, []);

  function handleSelect(ver: string) {
    if (ver === "system") {
      clearCurrentVersion();
      setSelected("system");
      setDone(true);
      return;
    }

    const found = findInstalledVersion(ver);
    if (!found) {
      setError(`Version '${ver}' is not installed. Use 'dx sdk install ${ver}' to install it.`);
      setDone(true);
      return;
    }

    try {
      setCurrentVersion(found);
      setSelected(found);
      setDone(true);
    } catch (err: any) {
      setError(err.message);
      setDone(true);
    }
  }

  const items = [
    ...installed.map(v => ({ label: v, value: v })),
    { label: "system", value: "system" },
  ];

  if (version || done) {
    return (
      <Box flexDirection="column">
        {error ? (
          <Text color="red">{error}</Text>
        ) : selected === "system" ? (
          <Text color="green">Now using system .NET</Text>
        ) : selected ? (
          <Text color="green">Now using .NET SDK {selected}</Text>
        ) : null}
      </Box>
    );
  }

  if (installed.length === 0) {
    return (
      <Text color="yellow">No SDK versions installed. Use 'dx sdk install' to install one.</Text>
    );
  }

  return (
    <Box flexDirection="column">
      <Text>Select version to use:</Text>
      <SelectInput
        items={items}
        onSelect={item => handleSelect(item.value)}
      />
    </Box>
  );
}

export async function runUse(version?: string) {
  const { waitUntilExit } = render(<UseCommand version={version} />);
  await waitUntilExit();
}
