import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url)).replace(/[\\/]scripts$/, "");
const backendDirectory = path.join(projectRoot, "backend");
const backendPython = path.join(
  backendDirectory,
  process.platform === "win32" ? ".venv\\Scripts\\python.exe" : ".venv/bin/python",
);
const nextCli = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const startupTimeoutMs = 180_000;
const healthCheckIntervalMs = 1_000;
const healthCheckTimeoutMs = 1_500;

function getBackendUrl() {
  if (process.env.FASTAPI_BACKEND_URL) {
    return process.env.FASTAPI_BACKEND_URL.replace(/\/+$/, "");
  }

  for (const fileName of [".env.local", ".env"]) {
    const filePath = path.join(projectRoot, fileName);
    if (!existsSync(filePath)) continue;

    const match = readFileSync(filePath, "utf8").match(
      /^FASTAPI_BACKEND_URL\s*=\s*(.*)$/m,
    );
    if (match?.[1]) {
      return match[1].trim().replace(/^(['"])(.*)\1$/, "$2").replace(/\/+$/, "");
    }
  }

  return "http://127.0.0.1:8000";
}

const backendUrl = getBackendUrl();
let backendProcess;
let frontendProcess;
let stopping = false;

function stopChild(child) {
  if (child && child.exitCode === null && !child.killed) {
    child.kill();
  }
}

function shutdown(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  stopChild(frontendProcess);
  stopChild(backendProcess);
  process.exitCode = exitCode;
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

async function isHealthy() {
  try {
    const response = await fetch(`${backendUrl}/health`, {
      signal: AbortSignal.timeout(healthCheckTimeoutMs),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForBackend() {
  const deadline = Date.now() + startupTimeoutMs;
  while (Date.now() < deadline) {
    if (backendProcess?.exitCode !== null && backendProcess?.exitCode !== undefined) {
      throw new Error(`FastAPI exited during startup with code ${backendProcess.exitCode}.`);
    }
    if (await isHealthy()) return;
    await new Promise((resolve) => setTimeout(resolve, healthCheckIntervalMs));
  }

  throw new Error(`FastAPI did not become healthy at ${backendUrl}/health within 180 seconds.`);
}

try {
  if (!existsSync(nextCli)) {
    throw new Error("Next.js is not installed. Run npm install first.");
  }

  const configuredUrl = new URL(backendUrl);
  const isLocalBackend =
    configuredUrl.hostname === "localhost" ||
    configuredUrl.hostname === "127.0.0.1" ||
    configuredUrl.hostname === "::1";

  if (isLocalBackend && !(await isHealthy())) {
    if (!existsSync(backendPython)) {
      throw new Error(
        "The backend virtual environment is missing. Set it up using backend/README.md.",
      );
    }

    console.log("Starting FastAPI assistant backend...");
    backendProcess = spawn(
      backendPython,
      ["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", configuredUrl.port || "8000"],
      { cwd: backendDirectory, stdio: "inherit" },
    );
    backendProcess.once("error", (error) => {
      console.error("Could not start FastAPI:", error.message);
      shutdown(1);
    });
    backendProcess.once("exit", (code) => {
      if (!stopping && code !== 0) {
        console.error(`FastAPI exited unexpectedly with code ${code}.`);
        shutdown(code || 1);
      }
    });
    await waitForBackend();
  } else if (isLocalBackend) {
    console.log("Reusing the healthy FastAPI assistant backend.");
  } else {
    console.log(`Using configured remote FastAPI backend at ${configuredUrl.origin}.`);
    await waitForBackend();
  }

  if (!stopping) {
    frontendProcess = spawn(process.execPath, [nextCli, "dev"], {
      cwd: projectRoot,
      stdio: "inherit",
    });
    frontendProcess.once("error", (error) => {
      console.error("Could not start Next.js:", error.message);
      shutdown(1);
    });
    frontendProcess.once("exit", (code) => shutdown(code || 0));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Development startup failed.");
  shutdown(1);
}
