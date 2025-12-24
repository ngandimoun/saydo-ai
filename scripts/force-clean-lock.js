/**
 * Forcefully clean Next.js lock file and dev directory
 * This script aggressively removes the lock to fix persistent lock issues
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const lockPath = path.join(process.cwd(), ".next", "dev", "lock");
const devDir = path.join(process.cwd(), ".next", "dev");
const nextDir = path.join(process.cwd(), ".next");

// #region agent log
const logData = {location:'force-clean-lock.js:12',message:'Starting force cleanup',data:{lockPath,devDir,nextDir},sessionId:'debug-session',runId:'force-clean',hypothesisId:'D'};
try {
  const logEntry = JSON.stringify({...logData, timestamp: Date.now()}) + "\n";
  fs.appendFileSync(path.join(process.cwd(), ".cursor", "debug.log"), logEntry, "utf8");
} catch (e) {}
fetch('http://127.0.0.1:7242/ingest/11afd2ee-84bf-4b58-80b6-6e69f84da6fd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
// #endregion

console.log("🧹 Force cleaning Next.js lock files...\n");

// Step 1: Kill all Node processes
console.log("1. Killing all Node.js processes...");
try {
  execSync("taskkill /F /IM node.exe 2>nul", { stdio: "ignore" });
  // #region agent log
  const logKill = {location:'force-clean-lock.js:25',message:'Killed Node processes',data:{},sessionId:'debug-session',runId:'force-clean',hypothesisId:'C'};
  try {
    fs.appendFileSync(path.join(process.cwd(), ".cursor", "debug.log"), JSON.stringify({...logKill, timestamp: Date.now()}) + "\n", "utf8");
  } catch (e) {}
  fetch('http://127.0.0.1:7242/ingest/11afd2ee-84bf-4b58-80b6-6e69f84da6fd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logKill)}).catch(()=>{});
  // #endregion
  console.log("   ✅ Killed Node.js processes");
} catch (e) {
  // #region agent log
  const logKillErr = {location:'force-clean-lock.js:32',message:'No Node processes to kill',data:{error:String(e)},sessionId:'debug-session',runId:'force-clean',hypothesisId:'C'};
  try {
    fs.appendFileSync(path.join(process.cwd(), ".cursor", "debug.log"), JSON.stringify({...logKillErr, timestamp: Date.now()}) + "\n", "utf8");
  } catch (e) {}
  fetch('http://127.0.0.1:7242/ingest/11afd2ee-84bf-4b58-80b6-6e69f84da6fd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logKillErr)}).catch(()=>{});
  // #endregion
  console.log("   ℹ️  No Node.js processes found");
}

// Wait a moment for file handles to release (synchronous wait)
const wait = (ms) => {
  const start = Date.now();
  while (Date.now() - start < ms) {}
};
wait(1000);

// Step 2: Remove lock file
console.log("\n2. Removing lock file...");
if (fs.existsSync(lockPath)) {
  try {
    // Try normal delete first
    fs.unlinkSync(lockPath);
    // #region agent log
    const logDel = {location:'force-clean-lock.js:46',message:'Deleted lock file',data:{lockPath},sessionId:'debug-session',runId:'force-clean',hypothesisId:'D'};
    try {
      fs.appendFileSync(path.join(process.cwd(), ".cursor", "debug.log"), JSON.stringify({...logDel, timestamp: Date.now()}) + "\n", "utf8");
    } catch (e) {}
    fetch('http://127.0.0.1:7242/ingest/11afd2ee-84bf-4b58-80b6-6e69f84da6fd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logDel)}).catch(()=>{});
    // #endregion
    console.log("   ✅ Removed lock file");
  } catch (error) {
    // #region agent log
    const logDelErr = {location:'force-clean-lock.js:54',message:'Failed to delete lock file',data:{error:error.message,code:error.code},sessionId:'debug-session',runId:'force-clean',hypothesisId:'D'};
    try {
      fs.appendFileSync(path.join(process.cwd(), ".cursor", "debug.log"), JSON.stringify({...logDelErr, timestamp: Date.now()}) + "\n", "utf8");
    } catch (e) {}
    fetch('http://127.0.0.1:7242/ingest/11afd2ee-84bf-4b58-80b6-6e69f84da6fd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logDelErr)}).catch(()=>{});
    // #endregion
    console.log(`   ❌ Failed: ${error.message}`);
    console.log("   ⚠️  Trying to remove entire .next/dev directory...");
    
    // Step 3: Remove entire dev directory as fallback
    try {
      if (fs.existsSync(devDir)) {
        fs.rmSync(devDir, { recursive: true, force: true });
        // #region agent log
        const logRmDir = {location:'force-clean-lock.js:65',message:'Removed dev directory',data:{devDir},sessionId:'debug-session',runId:'force-clean',hypothesisId:'D'};
        try {
          fs.appendFileSync(path.join(process.cwd(), ".cursor", "debug.log"), JSON.stringify({...logRmDir, timestamp: Date.now()}) + "\n", "utf8");
        } catch (e) {}
        fetch('http://127.0.0.1:7242/ingest/11afd2ee-84bf-4b58-80b6-6e69f84da6fd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logRmDir)}).catch(()=>{});
        // #endregion
        console.log("   ✅ Removed .next/dev directory");
      }
    } catch (rmError) {
      // #region agent log
      const logRmErr = {location:'force-clean-lock.js:74',message:'Failed to remove dev directory',data:{error:rmError.message},sessionId:'debug-session',runId:'force-clean',hypothesisId:'D'};
      try {
        fs.appendFileSync(path.join(process.cwd(), ".cursor", "debug.log"), JSON.stringify({...logRmErr, timestamp: Date.now()}) + "\n", "utf8");
      } catch (e) {}
      fetch('http://127.0.0.1:7242/ingest/11afd2ee-84bf-4b58-80b6-6e69f84da6fd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logRmErr)}).catch(()=>{});
      // #endregion
      console.log(`   ❌ Failed to remove directory: ${rmError.message}`);
      console.log("\n   💡 Try manually deleting .next/dev directory or restart your computer");
      process.exit(1);
    }
  }
} else {
  // #region agent log
  const logNoLock = {location:'force-clean-lock.js:84',message:'Lock file does not exist',data:{lockPath},sessionId:'debug-session',runId:'force-clean',hypothesisId:'D'};
  try {
    fs.appendFileSync(path.join(process.cwd(), ".cursor", "debug.log"), JSON.stringify({...logNoLock, timestamp: Date.now()}) + "\n", "utf8");
  } catch (e) {}
  fetch('http://127.0.0.1:7242/ingest/11afd2ee-84bf-4b58-80b6-6e69f84da6fd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logNoLock)}).catch(()=>{});
  // #endregion
  console.log("   ℹ️  No lock file found");
}

// #region agent log
const logDone = {location:'force-clean-lock.js:92',message:'Force cleanup complete',data:{},sessionId:'debug-session',runId:'force-clean',hypothesisId:'D'};
try {
  fs.appendFileSync(path.join(process.cwd(), ".cursor", "debug.log"), JSON.stringify({...logDone, timestamp: Date.now()}) + "\n", "utf8");
} catch (e) {}
fetch('http://127.0.0.1:7242/ingest/11afd2ee-84bf-4b58-80b6-6e69f84da6fd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logDone)}).catch(()=>{});
// #endregion

console.log("\n✅ Cleanup complete! You can now run: npm run dev");

