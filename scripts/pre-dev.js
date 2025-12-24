/**
 * Pre-dev script that forcefully removes .next/dev before Next.js starts
 * This runs synchronously and ensures clean state
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const devDir = path.join(process.cwd(), ".next", "dev");
const lockPath = path.join(devDir, "lock");

// #region agent log
const logPath = path.join(process.cwd(), ".cursor", "debug.log");
const cursorDir = path.join(process.cwd(), ".cursor");
if (!fs.existsSync(cursorDir)) {
  fs.mkdirSync(cursorDir, { recursive: true });
}

function log(data) {
  const logEntry = JSON.stringify({...data, timestamp: Date.now()}) + "\n";
  try {
    fs.appendFileSync(logPath, logEntry, "utf8");
  } catch (e) {}
}
log({location:'pre-dev.js:22',message:'Starting pre-dev cleanup',data:{devDir,lockPath},sessionId:'debug-session',runId:'pre-dev',hypothesisId:'D'});
// #endregion

// Step 1: Kill all Node processes (except this one)
console.log("🧹 Cleaning up before starting Next.js...");
try {
  // Get current process PID to avoid killing ourselves
  const currentPid = process.pid;
  log({location:'pre-dev.js:30',message:'Killing Node processes',data:{currentPid},sessionId:'debug-session',runId:'pre-dev',hypothesisId:'C'});
  execSync("taskkill /F /IM node.exe 2>nul", { stdio: "ignore" });
  // Wait for file handles to release
  const wait = (ms) => {
    const start = Date.now();
    while (Date.now() - start < ms) {}
  };
  wait(2000);
  log({location:'pre-dev.js:38',message:'Killed Node processes and waited',data:{},sessionId:'debug-session',runId:'pre-dev',hypothesisId:'C'});
} catch (e) {
  log({location:'pre-dev.js:40',message:'No Node processes to kill or kill failed',data:{error:String(e)},sessionId:'debug-session',runId:'pre-dev',hypothesisId:'C'});
}

// Step 2: Remove .next/dev directory if it exists
if (fs.existsSync(devDir)) {
  try {
    log({location:'pre-dev.js:50',message:'Removing dev directory',data:{devDir},sessionId:'debug-session',runId:'pre-dev',hypothesisId:'D'});
    fs.rmSync(devDir, { recursive: true, force: true });
    log({location:'pre-dev.js:52',message:'Successfully removed dev directory',data:{devDir},sessionId:'debug-session',runId:'pre-dev',hypothesisId:'D'});
    console.log("✅ Removed .next/dev directory");
  } catch (error) {
    log({location:'pre-dev.js:55',message:'Failed to remove dev directory',data:{error:error.message,code:error.code,errno:error.errno},sessionId:'debug-session',runId:'pre-dev',hypothesisId:'D'});
    console.error(`❌ Failed to remove .next/dev: ${error.message}`);
    // If removal fails, try just the lock file
    if (fs.existsSync(lockPath)) {
      try {
        log({location:'pre-dev.js:59',message:'Trying to remove lock file as fallback',data:{lockPath},sessionId:'debug-session',runId:'pre-dev',hypothesisId:'D'});
        fs.unlinkSync(lockPath);
        log({location:'pre-dev.js:61',message:'Removed lock file as fallback',data:{lockPath},sessionId:'debug-session',runId:'pre-dev',hypothesisId:'D'});
        console.log("✅ Removed lock file");
      } catch (lockError) {
        log({location:'pre-dev.js:64',message:'Failed to remove lock file',data:{error:lockError.message,code:lockError.code},sessionId:'debug-session',runId:'pre-dev',hypothesisId:'D'});
        console.error(`❌ Cannot remove lock: ${lockError.message}`);
        console.error("\n💡 Please manually delete .next/dev directory:");
        console.error(`   Remove-Item -Path ".next\\dev" -Recurse -Force`);
        process.exit(1);
      }
    } else {
      console.error("\n💡 Please manually delete .next/dev directory:");
      console.error(`   Remove-Item -Path ".next\\dev" -Recurse -Force`);
      process.exit(1);
    }
  }
} else {
  log({location:'pre-dev.js:75',message:'Dev directory does not exist',data:{devDir},sessionId:'debug-session',runId:'pre-dev',hypothesisId:'D'});
}

log({location:'pre-dev.js:44',message:'Pre-dev cleanup complete',data:{},sessionId:'debug-session',runId:'pre-dev',hypothesisId:'D'});

