/**
 * Wrapper script that always cleans lock before starting Next.js dev server
 * This ensures the lock is removed every time before Next.js starts
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const lockPath = path.join(process.cwd(), ".next", "dev", "lock");
const devDir = path.join(process.cwd(), ".next", "dev");

// #region agent log
const logPath = path.join(process.cwd(), ".cursor", "debug.log");
// Ensure .cursor directory exists
const cursorDir = path.join(process.cwd(), ".cursor");
if (!fs.existsSync(cursorDir)) {
  fs.mkdirSync(cursorDir, { recursive: true });
}

function log(data) {
  const logEntry = JSON.stringify({...data, timestamp: Date.now()}) + "\n";
  try {
    fs.appendFileSync(logPath, logEntry, "utf8");
  } catch (e) {
    // If logging fails, at least try to console.error
    console.error("Log write failed:", e.message);
  }
  // Try HTTP logging (may fail in Node < 18)
  if (typeof fetch !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/11afd2ee-84bf-4b58-80b6-6e69f84da6fd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).catch(()=>{});
  }
}
log({location:'dev-wrapper.js:25',message:'Starting dev wrapper',data:{lockPath,devDir,cwd:process.cwd()},sessionId:'debug-session',runId:'wrapper-start',hypothesisId:'D'});
// #endregion

console.log("🧹 Cleaning lock files before starting Next.js...\n");

// Try to remove directory first (non-destructive)
const wait = (ms) => {
  const start = Date.now();
  while (Date.now() - start < ms) {}
};

// Always remove entire .next/dev directory to ensure clean state
// This is more reliable than just removing the lock file
if (fs.existsSync(devDir)) {
  try {
    log({location:'dev-wrapper.js:48',message:'Attempting to remove dev directory',data:{devDir},sessionId:'debug-session',runId:'wrapper-start',hypothesisId:'D'});
    fs.rmSync(devDir, { recursive: true, force: true });
    log({location:'dev-wrapper.js:50',message:'Removed dev directory successfully',data:{devDir},sessionId:'debug-session',runId:'wrapper-start',hypothesisId:'D'});
    console.log("✅ Removed .next/dev directory");
  } catch (rmError) {
    log({location:'dev-wrapper.js:53',message:'Failed to remove dev directory, trying to kill processes',data:{error:rmError.message,code:rmError.code},sessionId:'debug-session',runId:'wrapper-start',hypothesisId:'D'});
    console.log(`⚠️  Could not remove .next/dev directory: ${rmError.message}`);
    console.log("   Attempting to kill Node processes and retry...");
    
    // Only kill processes if removal failed
    try {
      execSync("taskkill /F /IM node.exe 2>nul", { stdio: "ignore" });
      log({location:'dev-wrapper.js:59',message:'Killed Node processes',data:{},sessionId:'debug-session',runId:'wrapper-start',hypothesisId:'C'});
      wait(2000); // Wait longer after killing processes
      
      // Retry removal
      if (fs.existsSync(devDir)) {
        try {
          fs.rmSync(devDir, { recursive: true, force: true });
          log({location:'dev-wrapper.js:65',message:'Removed dev directory after killing processes',data:{devDir},sessionId:'debug-session',runId:'wrapper-start',hypothesisId:'D'});
          console.log("✅ Removed .next/dev directory after killing processes");
        } catch (retryError) {
          log({location:'dev-wrapper.js:69',message:'Failed to remove dev directory after retry',data:{error:retryError.message,code:retryError.code},sessionId:'debug-session',runId:'wrapper-start',hypothesisId:'D'});
          console.error(`❌ Still cannot remove directory: ${retryError.message}`);
          console.error("\n💡 Please manually delete .next/dev directory and try again");
          process.exit(1);
        }
      }
    } catch (killError) {
      log({location:'dev-wrapper.js:75',message:'Failed to kill processes',data:{error:killError.message},sessionId:'debug-session',runId:'wrapper-start',hypothesisId:'C'});
      console.error(`❌ Failed to kill processes: ${killError.message}`);
      console.error("\n💡 Please manually delete .next/dev directory and try again");
      process.exit(1);
    }
  }
} else {
  log({location:'dev-wrapper.js:81',message:'Dev directory does not exist',data:{devDir},sessionId:'debug-session',runId:'wrapper-start',hypothesisId:'D'});
  console.log("ℹ️  .next/dev directory doesn't exist (clean state)");
}

// Ensure dev directory exists
if (!fs.existsSync(devDir)) {
  try {
    fs.mkdirSync(devDir, { recursive: true });
    log({location:'dev-wrapper.js:68',message:'Created dev directory',data:{devDir},sessionId:'debug-session',runId:'wrapper-start',hypothesisId:'E'});
  } catch (e) {
    log({location:'dev-wrapper.js:71',message:'Failed to create dev directory',data:{error:e.message},sessionId:'debug-session',runId:'wrapper-start',hypothesisId:'E'});
    console.error(`❌ Failed to create dev directory: ${e.message}`);
    process.exit(1);
  }
}

log({location:'dev-wrapper.js:76',message:'Starting Next.js dev server',data:{},sessionId:'debug-session',runId:'wrapper-start',hypothesisId:'D'});
console.log("\n🚀 Starting Next.js dev server...\n");

// Start Next.js dev server
const nextProcess = spawn("npx", ["next", "dev"], {
  stdio: "inherit",
  shell: true,
  cwd: process.cwd(),
});

nextProcess.on("error", (error) => {
  log({location:'dev-wrapper.js:85',message:'Next.js process error',data:{error:error.message},sessionId:'debug-session',runId:'wrapper-start',hypothesisId:'D'});
  console.error(`❌ Failed to start Next.js: ${error.message}`);
  process.exit(1);
});

nextProcess.on("exit", (code) => {
  log({location:'dev-wrapper.js:90',message:'Next.js process exited',data:{code},sessionId:'debug-session',runId:'wrapper-start',hypothesisId:'D'});
  process.exit(code || 0);
});

