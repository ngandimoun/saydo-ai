/**
 * Dev script that cleans .next directory and starts Next.js dev server
 * This avoids PowerShell/batch file compatibility issues in VSCode
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const nextDir = path.join(process.cwd(), ".next");

console.log("🧹 Cleaning up before starting Next.js...\n");

// Step 1: Remove .next directory if it exists
if (fs.existsSync(nextDir)) {
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log("✅ Removed .next directory (clean slate)\n");
  } catch (error) {
    console.error(`❌ Failed to remove .next directory: ${error.message}`);
    console.error("💡 Try manually deleting .next directory and run again\n");
    // Continue anyway - Next.js might still work
  }
} else {
  console.log("ℹ️  .next directory doesn't exist (already clean)\n");
}

// Step 2: Start Next.js dev server
console.log("🚀 Starting Next.js dev server...\n");

const nextDev = spawn("npx", ["next", "dev"], {
  stdio: "inherit",
  shell: true,
  cwd: process.cwd(),
});

nextDev.on("error", (error) => {
  console.error(`❌ Failed to start Next.js: ${error.message}`);
  process.exit(1);
});

nextDev.on("close", (code) => {
  process.exit(code || 0);
});





