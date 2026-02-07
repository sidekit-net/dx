import { useState, useEffect } from "react";
import { render, Box, Text, useInput } from "ink";
import { SelectInput } from "../components/SelectInput.js";
import {
  getInstalledVersions,
  findInstalledVersion,
  uninstallVersion,
} from "../utils/dotnet.js";

type Step = "select" | "confirm" | "done";

interface Props {
  version?: string;
}

function ConfirmPrompt({ version, onConfirm, onCancel }: { version: string; onConfirm: () => void; onCancel: () => void }) {
  useInput((input, key) => {
    if (input.toLowerCase() === "y") {
      onConfirm();
    } else if (input.toLowerCase() === "n" || key.escape) {
      onCancel();
    }
  });

  return (
    <Text>Are you sure you want to uninstall {version}? (y/N) </Text>
  );
}

function UninstallCommand({ version }: Props) {
  const [installed, setInstalled] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [step, setStep] = useState<Step>("select");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const versions = getInstalledVersions();
    setInstalled(versions);

    if (version) {
      const found = findInstalledVersion(version);
      if (!found) {
        setError(`Version '${version}' is not installed.`);
        setStep("done");
      } else {
        setSelected(found);
        setStep("confirm");
      }
    }
  }, []);

  function handleSelect(ver: string) {
    setSelected(ver);
    setStep("confirm");
  }

  function handleConfirm() {
    try {
      uninstallVersion(selected);
      setStep("done");
    } catch (err: any) {
      setError(err.message);
      setStep("done");
    }
  }

  function handleCancel() {
    setError("Cancelled.");
    setStep("done");
  }

  const items = installed.map(v => ({ label: v, value: v }));

  if (step === "done") {
    return (
      <Box flexDirection="column">
        {error ? (
          <Text color="yellow">{error}</Text>
        ) : (
          <Text color="green">Successfully uninstalled .NET SDK {selected}</Text>
        )}
      </Box>
    );
  }

  if (step === "confirm") {
    return <ConfirmPrompt version={selected} onConfirm={handleConfirm} onCancel={handleCancel} />;
  }

  if (installed.length === 0) {
    return <Text>No SDK versions installed.</Text>;
  }

  return (
    <Box flexDirection="column">
      <Text>Select version to uninstall:</Text>
      <SelectInput
        items={items}
        onSelect={item => handleSelect(item.value)}
      />
    </Box>
  );
}

export async function runUninstall(version?: string) {
  // Non-interactive: skip confirmation when version is passed directly
  if (version) {
    const found = findInstalledVersion(version);
    if (!found) {
      console.error(`Version '${version}' is not installed.`);
      process.exit(1);
    }
    uninstallVersion(found);
    console.log(`Successfully uninstalled .NET SDK ${found}`);
    return;
  }

  const { waitUntilExit } = render(<UninstallCommand version={version} />);
  await waitUntilExit();
}
