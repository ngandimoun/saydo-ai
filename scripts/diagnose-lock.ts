/**
 * Diagnostic script to investigate Next.js lock file issues
 */

import { existsSync, statSync, unlinkSync, mkdirSync, writeFileSync, readFileSync, appendFileSync } from "fs"
import { join } from "path"
import { execSync } from "child_process"

const LOG_PATH = join(process.cwd(), ".cursor", "debug.log")

function log(data: any) {
  const logEntry = JSON.stringify({...data, timestamp: Date.now()}) + "\n"
  try {
    appendFileSync(LOG_PATH, logEntry, "utf8")
  } catch (e) {
    // Ignore log write errors
  }
  // Also try HTTP
  fetch('http://127.0.0.1:7242/ingest/11afd2ee-84bf-4b58-80b6-6e69f84da6fd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).catch(()=>{})
}

const lockPath = join(process.cwd(), ".next", "dev", "lock")
const devDir = join(process.cwd(), ".next", "dev")

// #region agent log
log({location:'diagnose-lock.ts:20',message:'Starting lock file diagnosis',data:{lockPath,devDir},sessionId:'debug-session',runId:'diagnosis',hypothesisId:'A,B,C,D,E'})
// #endregion

console.log("🔍 Diagnosing Next.js lock file issue...\n")
console.log("=".repeat(60))

// Hypothesis A: Check if lock file exists
const lockExists = existsSync(lockPath)
// #region agent log
log({location:'diagnose-lock.ts:25',message:'Lock file existence check',data:{lockExists,lockPath},sessionId:'debug-session',runId:'diagnosis',hypothesisId:'A'})
// #endregion

console.log(`1. Lock file exists: ${lockExists ? "✅ YES" : "❌ NO"}`)
if (lockExists) {
  try {
    const stats = statSync(lockPath)
    // #region agent log
    log({location:'diagnose-lock.ts:31',message:'Lock file stats',data:{size:stats.size,mtime:stats.mtime.toISOString(),mode:stats.mode},sessionId:'debug-session',runId:'diagnosis',hypothesisId:'A'})
    // #endregion
    console.log(`   Size: ${stats.size} bytes`)
    console.log(`   Modified: ${stats.mtime.toISOString()}`)
    console.log(`   Age: ${Math.round((Date.now() - stats.mtime.getTime()) / 1000)} seconds`)
    
    // Try to read it
    try {
      const content = readFileSync(lockPath, "utf8")
      // #region agent log
      log({location:'diagnose-lock.ts:39',message:'Lock file content',data:{content:content.substring(0,100)},sessionId:'debug-session',runId:'diagnosis',hypothesisId:'A'})
      // #endregion
      console.log(`   Content preview: ${content.substring(0, 50)}...`)
    } catch (e) {
      // #region agent log
      log({location:'diagnose-lock.ts:42',message:'Failed to read lock file',data:{error:String(e)},sessionId:'debug-session',runId:'diagnosis',hypothesisId:'A'})
      // #endregion
      console.log(`   ❌ Cannot read: ${e}`)
    }
  } catch (e) {
    // #region agent log
    log({location:'diagnose-lock.ts:47',message:'Failed to stat lock file',data:{error:String(e)},sessionId:'debug-session',runId:'diagnosis',hypothesisId:'A'})
    // #endregion
    console.log(`   ❌ Cannot stat: ${e}`)
  }
}

// Hypothesis B: Check for processes using the file (Windows)
console.log("\n2. Checking for processes using the file...")
try {
  const handleOutput = execSync(`handle "${lockPath}" 2>nul || echo "Handle.exe not found"`, { encoding: "utf8" })
  // #region agent log
  log({location:'diagnose-lock.ts:56',message:'Handle.exe output',data:{output:handleOutput.substring(0,200)},sessionId:'debug-session',runId:'diagnosis',hypothesisId:'B'})
  // #endregion
  if (!handleOutput.includes("not found")) {
    console.log(handleOutput)
  } else {
    console.log("   ⚠️  Handle.exe not available (install Sysinternals Handle for detailed info)")
  }
} catch (e) {
  // #region agent log
  log({location:'diagnose-lock.ts:64',message:'Handle.exe check failed',data:{error:String(e)},sessionId:'debug-session',runId:'diagnosis',hypothesisId:'B'})
  // #endregion
  console.log("   ⚠️  Could not check file handles")
}

// Hypothesis C: Check Node.js processes
console.log("\n3. Checking for Node.js processes...")
try {
  const nodeProcs = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', { encoding: "utf8" })
  // #region agent log
  log({location:'diagnose-lock.ts:72',message:'Node.js processes',data:{output:nodeProcs},sessionId:'debug-session',runId:'diagnosis',hypothesisId:'C'})
  // #endregion
  const lines = nodeProcs.split("\n").filter(l => l.includes("node.exe"))
  if (lines.length > 1) {
    console.log(`   ⚠️  Found ${lines.length - 1} Node.js process(es):`)
    lines.slice(1).forEach(line => {
      const parts = line.split(",")
      if (parts.length > 1) {
        console.log(`      PID: ${parts[1].replace(/"/g, "")}`)
      }
    })
  } else {
    console.log("   ✅ No Node.js processes running")
  }
} catch (e) {
  // #region agent log
  log({location:'diagnose-lock.ts:84',message:'Failed to check Node processes',data:{error:String(e)},sessionId:'debug-session',runId:'diagnosis',hypothesisId:'C'})
  // #endregion
  console.log(`   ❌ Error: ${e}`)
}

// Hypothesis D: Try to delete the lock file
console.log("\n4. Attempting to delete lock file...")
if (lockExists) {
  try {
    unlinkSync(lockPath)
    // #region agent log
    log({location:'diagnose-lock.ts:93',message:'Successfully deleted lock file',data:{lockPath},sessionId:'debug-session',runId:'diagnosis',hypothesisId:'D'})
    // #endregion
    console.log("   ✅ Successfully deleted lock file")
  } catch (e: any) {
    // #region agent log
    log({location:'diagnose-lock.ts:97',message:'Failed to delete lock file',data:{error:String(e),code:e.code,errno:e.errno},sessionId:'debug-session',runId:'diagnosis',hypothesisId:'D'})
    // #endregion
    console.log(`   ❌ Failed to delete: ${e.message}`)
    console.log(`   Error code: ${e.code || "N/A"}`)
    if (e.code === "EBUSY" || e.code === "EPERM") {
      console.log("   ⚠️  File is locked or permission denied - another process may be using it")
    }
  }
} else {
  console.log("   ℹ️  Lock file doesn't exist, nothing to delete")
}

// Hypothesis E: Check directory permissions
console.log("\n5. Checking directory permissions...")
try {
  if (!existsSync(devDir)) {
    // #region agent log
    log({location:'diagnose-lock.ts:111',message:'Dev directory does not exist',data:{devDir},sessionId:'debug-session',runId:'diagnosis',hypothesisId:'E'})
    // #endregion
    console.log("   ⚠️  .next/dev directory doesn't exist")
    try {
      mkdirSync(devDir, { recursive: true })
      // #region agent log
      log({location:'diagnose-lock.ts:115',message:'Created dev directory',data:{devDir},sessionId:'debug-session',runId:'diagnosis',hypothesisId:'E'})
      // #endregion
      console.log("   ✅ Created .next/dev directory")
    } catch (e) {
      // #region agent log
      log({location:'diagnose-lock.ts:119',message:'Failed to create dev directory',data:{error:String(e)},sessionId:'debug-session',runId:'diagnosis',hypothesisId:'E'})
      // #endregion
      console.log(`   ❌ Cannot create directory: ${e}`)
    }
  } else {
    const dirStats = statSync(devDir)
    // #region agent log
    log({location:'diagnose-lock.ts:124',message:'Dev directory stats',data:{mode:dirStats.mode,isDirectory:dirStats.isDirectory()},sessionId:'debug-session',runId:'diagnosis',hypothesisId:'E'})
    // #endregion
    console.log("   ✅ Directory exists and is accessible")
    
    // Try to write a test file
    const testFile = join(devDir, "test-write.tmp")
    try {
      writeFileSync(testFile, "test")
      unlinkSync(testFile)
      // #region agent log
      log({location:'diagnose-lock.ts:131',message:'Directory is writable',data:{devDir},sessionId:'debug-session',runId:'diagnosis',hypothesisId:'E'})
      // #endregion
      console.log("   ✅ Directory is writable")
    } catch (e) {
      // #region agent log
      log({location:'diagnose-lock.ts:135',message:'Directory is not writable',data:{error:String(e)},sessionId:'debug-session',runId:'diagnosis',hypothesisId:'E'})
      // #endregion
      console.log(`   ❌ Directory is not writable: ${e}`)
    }
  }
} catch (e) {
  // #region agent log
  log({location:'diagnose-lock.ts:140',message:'Failed to check directory',data:{error:String(e)},sessionId:'debug-session',runId:'diagnosis',hypothesisId:'E'})
  // #endregion
  console.log(`   ❌ Error checking directory: ${e}`)
}

// #region agent log
log({location:'diagnose-lock.ts:145',message:'Diagnosis complete',data:{},sessionId:'debug-session',runId:'diagnosis',hypothesisId:'A,B,C,D,E'})
// #endregion

console.log("\n" + "=".repeat(60))
console.log("✅ Diagnosis complete!")

