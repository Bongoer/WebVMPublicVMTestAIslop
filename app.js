const CHEERPX_URL = "https://cxrtnc.leaningtech.com/1.2.8/cx.esm.js";
const DISK_URL = new URL("./xfce.ext2?v=11", window.location.href).href;
const OVERLAY_NAME = "webvm-xfce-overlay-v11";
const COI_RELOAD_KEY = "webvm-xfce-coi-reloaded-v1";

const statusElement = document.getElementById("status");
const canvas = document.getElementById("display");
const screen = document.getElementById("screen");
const splash = document.getElementById("splash");
const consoleElement = document.getElementById("console");
const loginLink = document.getElementById("login-link");
const startButton = document.getElementById("start");
const networkButton = document.getElementById("start-network");
const logsButton = document.getElementById("logs");
const resetButton = document.getElementById("reset");

let CheerpX = null;
let cx = null;
let running = false;
let resizeTimer = null;

function setStatus(message) {
  statusElement.textContent = message;
}

function setStartButtons(enabled) {
  startButton.disabled = !enabled;
  networkButton.disabled = !enabled;
  resetButton.disabled = !enabled;
}

async function ensureCrossOriginIsolation() {
  if (window.crossOriginIsolated) {
    sessionStorage.removeItem(COI_RELOAD_KEY);
    return true;
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support the service worker required by CheerpX.");
  }

  await navigator.serviceWorker.register("./coi-sw.js?v=6", { scope: "./" });
  await navigator.serviceWorker.ready;

  if (sessionStorage.getItem(COI_RELOAD_KEY) === "1") {
    throw new Error(
      "Cross-origin isolation did not start. Open the published GitHub Pages address in Chrome, not a file preview."
    );
  }

  sessionStorage.setItem(COI_RELOAD_KEY, "1");
  window.location.reload();
  return false;
}

async function loadCheerpX() {
  if (!CheerpX) {
    setStatus("Loading CheerpX...");
    CheerpX = await import(CHEERPX_URL);
  }
  return CheerpX;
}

function resizeDisplay() {
  if (!cx) {
    return;
  }

  const bounds = screen.getBoundingClientRect();
  const width = Math.max(640, Math.floor(bounds.width));
  const height = Math.max(480, Math.floor(bounds.height));

  canvas.width = width;
  canvas.height = height;
  cx.setKmsCanvas(canvas, width, height);
}

function scheduleResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resizeDisplay, 120);
}

function createNetworkConfiguration() {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const authKey = fragment.get("authKey");
  const controlUrl = fragment.get("controlUrl");

  const configuration = {
    loginUrlCb(url) {
      loginLink.href = url;
      loginLink.hidden = false;
      setStatus("Tap \"Open Tailscale login\" to connect the VM.");
    },

    stateUpdateCb(state) {
      if (state === 6) {
        setStatus("Network connected.");
      } else {
        setStatus(`Network state: ${state}`);
      }
    },

    netmapUpdateCb(map) {
      const address = map?.self?.addresses?.[0];
      if (address) {
        setStatus(`Network connected: ${address}`);
      }
    }
  };

  if (authKey) {
    configuration.authKey = authKey;
  }

  if (controlUrl) {
    configuration.controlUrl = controlUrl;
  }

  return configuration;
}

async function startVm(withNetwork) {
  if (running) {
    return;
  }

  running = true;
  setStartButtons(false);
  loginLink.hidden = true;
  setStatus("Opening the Linux disk...");

  try {
    const api = await loadCheerpX();
    const baseDevice = await api.HttpBytesDevice.create(DISK_URL);
    const localDevice = await api.IDBDevice.create(OVERLAY_NAME);
    const overlayDevice = await api.OverlayDevice.create(baseDevice, localDevice);

    const options = {
      mounts: [
        { type: "ext2", path: "/", dev: overlayDevice },
        { type: "devs", path: "/dev" },
        { type: "proc", path: "/proc" }
      ]
    };

    if (withNetwork) {
      options.networkInterface = createNetworkConfiguration();
    }

    setStatus("Starting the virtual machine...");
    cx = await api.Linux.create(options);
    cx.setConsole(consoleElement);

    resizeDisplay();
    let completeConsoleSwitch = () => {};

    completeConsoleSwitch = cx.setActivateConsole((index) => {
      completeConsoleSwitch(index);
      setStatus("XFCE display active.");
    });
    window.addEventListener("resize", scheduleResize);
    canvas.addEventListener("pointerdown", () => canvas.focus());

    splash.hidden = true;
    canvas.focus();
    setStatus(withNetwork ? "Linux started. Waiting for XFCE and network..." : "Linux started. Waiting for XFCE display...");

    cx.run("/usr/local/bin/webvm-xfce-start", [], {
      uid: 0,
      gid: 0,
      cwd: "/",
      env: [
        "HOME=/root",
        "USER=root",
        "SHELL=/bin/sh",
        "PATH=/sbin:/bin:/usr/sbin:/usr/bin",
        "DISPLAY=:0"
      ]
    }).then((exitCode) => {
      setStatus(`Linux stopped with exit code ${exitCode}.`);
      running = false;
    }).catch((error) => {
      console.error(error);
      setStatus(`Linux stopped: ${error.message}`);
      running = false;
      consoleElement.hidden = false;
    });
  } catch (error) {
    console.error(error);
    setStatus(`Start failed: ${error.message}`);
    consoleElement.textContent += `\nStart failed:\n${error.stack || error.message}\n`;
    consoleElement.hidden = false;
    running = false;
    setStartButtons(true);
  }
}

async function resetVm() {
  const confirmed = window.confirm(
    "Delete this browser's saved VM changes and return to the clean XFCE image?"
  );

  if (!confirmed) {
    return;
  }

  try {
    const api = await loadCheerpX();
    setStatus("Deleting saved VM changes...");
    const localDevice = await api.IDBDevice.create(OVERLAY_NAME);
    await localDevice.reset();
    window.location.reload();
  } catch (error) {
    setStatus(`Reset failed: ${error.message}`);
  }
}

startButton.addEventListener("click", () => startVm(false));
networkButton.addEventListener("click", () => startVm(true));
resetButton.addEventListener("click", resetVm);
logsButton.addEventListener("click", () => {
  consoleElement.hidden = !consoleElement.hidden;
  logsButton.textContent = consoleElement.hidden ? "Logs" : "Hide logs";

  if (!consoleElement.hidden) {
    consoleElement.focus();
  } else {
    canvas.focus();
  }
});

(async () => {
  try {
    const ready = await ensureCrossOriginIsolation();

    if (!ready) {
      return;
    }

    await loadCheerpX();
    setStartButtons(true);
    setStatus("Ready. Choose Start VM or Start + Network.");
  } catch (error) {
    console.error(error);
    setStatus(error.message);
    consoleElement.textContent = `${error.stack || error.message}\n`;
    consoleElement.hidden = false;
  }
})();
