const CHEERPX_URL = "https://cxrtnc.leaningtech.com/1.2.8/cx.esm.js";
const SYSTEM_IMAGE_URL = new URL("./xfce.ext2?v=17", location.href).href;
const OVERLAY_NAME = "webvm-linux-overlay-v17";
const COI_RELOAD_KEY = "webvm-coi-v17";

const statusElement = document.getElementById("status");
const canvas = document.getElementById("display");
const consoleElement = document.getElementById("console");
const splash = document.getElementById("splash");
const loginLink = document.getElementById("login-link");
const startButton = document.getElementById("start");
const networkButton = document.getElementById("start-network");
const logsButton = document.getElementById("logs");
const resetButton = document.getElementById("reset");

let CheerpX;
let cx;
let localDevice;
let running = false;
let resizeTimer;
let completeConsoleSwitch = () => {};

function setStatus(message) {
  statusElement.textContent = message;
}

function setButtonsEnabled(enabled) {
  startButton.disabled = !enabled;
  networkButton.disabled = !enabled;
  resetButton.disabled = !enabled;
}

async function ensureCrossOriginIsolation() {
  if (crossOriginIsolated) {
    sessionStorage.removeItem(COI_RELOAD_KEY);
    return true;
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are unavailable in this browser.");
  }

  await navigator.serviceWorker.register("./coi-sw.js?v=17", {
    scope: "./"
  });

  await navigator.serviceWorker.ready;

  if (sessionStorage.getItem(COI_RELOAD_KEY) === "1") {
    throw new Error("Cross-origin isolation could not be enabled.");
  }

  sessionStorage.setItem(COI_RELOAD_KEY, "1");
  location.reload();
  return false;
}

async function loadCheerpX() {
  if (!CheerpX) {
    setStatus("Loading Linux engine...");
    CheerpX = await import(CHEERPX_URL);
  }

  return CheerpX;
}

function resizeDisplay() {
  if (!cx) {
    return;
  }

  const width = Math.max(canvas.offsetWidth, 1);
  const height = Math.max(canvas.offsetHeight, 1);

  const scale = Math.max(
    1,
    1024 / width,
    768 / height
  );

  cx.setKmsCanvas(
    canvas,
    Math.floor(width * scale),
    Math.floor(height * scale)
  );
}

function scheduleResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resizeDisplay, 150);
}

function handleConsoleSwitch(vt) {
  completeConsoleSwitch(vt);

  if (vt === 7) {
    canvas.hidden = false;
    consoleElement.hidden = true;
    logsButton.textContent = "Logs";
    setStatus("Graphical display selected. XFCE is loading...");
    canvas.focus();
    return;
  }

  consoleElement.hidden = false;
  logsButton.textContent = "Hide logs";
  setStatus("Starting Linux graphical services...");
}

function createNetworkConfiguration() {
  const fragment = new URLSearchParams(location.hash.slice(1));
  const configuration = {
    loginUrlCb(url) {
      loginLink.href = url;
      loginLink.hidden = false;
      setStatus("Open the network login link.");
    },
    stateUpdateCb(state) {
      if (state === 6) {
        setStatus("Network connected.");
      }
    },
    netmapUpdateCb(map) {
      const address = map?.self?.addresses?.[0];

      if (address) {
        setStatus(`Network connected: ${address}`);
      }
    }
  };

  const authKey = fragment.get("authKey");
  const controlUrl = fragment.get("controlUrl");

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
  setButtonsEnabled(false);
  loginLink.hidden = true;

  try {
    const api = await loadCheerpX();

    setStatus("Loading Linux system image...");

    const baseDevice =
      await api.HttpBytesDevice.create(SYSTEM_IMAGE_URL);

    localDevice =
      await api.IDBDevice.create(OVERLAY_NAME);

    const overlayDevice =
      await api.OverlayDevice.create(baseDevice, localDevice);

    const options = {
      mounts: [
        {
          type: "ext2",
          path: "/",
          dev: overlayDevice
        },
        {
          type: "devs",
          path: "/dev"
        },
        {
          type: "devpts",
          path: "/dev/pts"
        },
        {
          type: "proc",
          path: "/proc"
        },
        {
          type: "sys",
          path: "/sys"
        }
      ]
    };

    if (withNetwork) {
      options.networkInterface =
        createNetworkConfiguration();
    }

    setStatus("Creating Linux virtual machine...");

    cx = await api.Linux.create(options);

    cx.setConsole(consoleElement);

    completeConsoleSwitch =
      cx.setActivateConsole(handleConsoleSwitch);

    canvas.hidden = false;
    consoleElement.hidden = false;
    splash.hidden = true;

    await new Promise(requestAnimationFrame);
    resizeDisplay();

    window.addEventListener("resize", scheduleResize);

    canvas.tabIndex = 0;
    canvas.addEventListener("pointerdown", () => {
      canvas.focus();
    });

    setStatus("Starting Linux graphical services...");

    cx.run("/usr/local/bin/webvm-xfce-start", [], {
      uid: 0,
      gid: 0,
      cwd: "/",
      env: [
        "HOME=/root",
        "USER=root",
        "LOGNAME=root",
        "SHELL=/bin/sh",
        "PATH=/sbin:/bin:/usr/sbin:/usr/bin"
      ]
    }).then((exitCode) => {
      running = false;
      setStatus(`Linux stopped with exit code ${exitCode}.`);
      consoleElement.hidden = false;
      logsButton.textContent = "Hide logs";
    }).catch((error) => {
      running = false;
      setStatus(`Linux stopped: ${error.message}`);
      consoleElement.hidden = false;
      logsButton.textContent = "Hide logs";
    });
  } catch (error) {
    console.error(error);
    running = false;
    setButtonsEnabled(true);
    setStatus(`Start failed: ${error.message}`);
    consoleElement.hidden = false;
    consoleElement.textContent +=
      `\n${error.stack || error.message}\n`;
  }
}

async function resetVm() {
  if (!confirm("Delete this browser's saved Linux changes?")) {
    return;
  }

  try {
    const api = await loadCheerpX();
    const device = await api.IDBDevice.create(OVERLAY_NAME);
    await device.reset();
    location.reload();
  } catch (error) {
    setStatus(`Reset failed: ${error.message}`);
  }
}

startButton.addEventListener("click", () => startVm(false));
networkButton.addEventListener("click", () => startVm(true));
resetButton.addEventListener("click", resetVm);

logsButton.addEventListener("click", () => {
  consoleElement.hidden = !consoleElement.hidden;
  logsButton.textContent =
    consoleElement.hidden ? "Logs" : "Hide logs";

  if (consoleElement.hidden) {
    canvas.focus();
  } else {
    consoleElement.focus();
  }
});

(async () => {
  try {
    if (!(await ensureCrossOriginIsolation())) {
      return;
    }

    await loadCheerpX();
    setButtonsEnabled(true);
    setStatus("Ready. Start Linux with or without network.");
  } catch (error) {
    console.error(error);
    setStatus(error.message);
    consoleElement.textContent =
      `${error.stack || error.message}\n`;
    consoleElement.hidden = false;
  }
})();
