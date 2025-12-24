/**
 * Clean Next.js lock file before starting dev server
 */

const fs = require("fs");
const path = require("path");

const lockPath = path.join(process.cwd(), ".next", "dev", "lock");
const devDir = path.join(process.cwd(), ".next", "dev");

// #region agent log
fetch('http://127.0.0.1:7242/ingest/11afd2ee-84bf-4b58-80b6-6e69f84da6fd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clean-lock.js:10',message:'Starting lock cleanup',data:{lockPath,devDir},timestamp:Date.now(),sessionId:'debug-session',runId:'cleanup',hypothesisId:'D'})}).catch(()=>{});
// #endregion

try {
  // Remove lock file if it exists
  if (fs.existsSync(lockPath)) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/11afd2ee-84bf-4b58-80b6-6e69f84da6fd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clean-lock.js:16',message:'Lock file exists, attempting deletion',data:{lockPath},timestamp:Date.now(),sessionId:'debug-session',runId:'cleanup',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    try {
      fs.unlinkSync(lockPath);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/11afd2ee-84bf-4b58-80b6-6e69f84da6fd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clean-lock.js:20',message:'Lock file deleted successfully',data:{lockPath},timestamp:Date.now(),sessionId:'debug-session',runId:'cleanup',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.log("✅ Removed lock file");
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/11afd2ee-84bf-4b58-80b6-6e69f84da6fd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clean-lock.js:24',message:'Failed to delete lock file',data:{error:error.message,code:error.code},timestamp:Date.now(),sessionId:'debug-session',runId:'cleanup',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.error(`❌ Failed to remove lock file: ${error.message}`);
      if (error.code === "EBUSY" || error.code === "EPERM") {
        console.error("   File is locked by another process. Try closing all terminals and VS Code.");
        process.exit(1);
      }
    }
  } else {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/11afd2ee-84bf-4b58-80b6-6e69f84da6fd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clean-lock.js:32',message:'Lock file does not exist',data:{lockPath},timestamp:Date.now(),sessionId:'debug-session',runId:'cleanup',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    console.log("ℹ️  No lock file found");
  }
} catch (error) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/11afd2ee-84bf-4b58-80b6-6e69f84da6fd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clean-lock.js:37',message:'Unexpected error in cleanup',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'cleanup',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}

