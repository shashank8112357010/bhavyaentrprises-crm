#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Function to recursively find all TypeScript/JavaScript files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, .git directories
      if (!["node_modules", ".next", ".git", "prisma"].includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Function to clean a file of development code
function cleanFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let changed = false;

    // Remove console.log, console.debug, but keep console.error for production error handling
    const originalContent = content;

    // Remove console.log statements
    content = content.replace(/console\.log\([^;]*\);?/g, "");
    content = content.replace(/console\.debug\([^;]*\);?/g, "");

    // Remove empty lines created by removing console statements
    content = content.replace(/^\s*\n/gm, "");

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, "utf8");
      changed = true;
    }

    return changed;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
function main() {
  console.log("🧹 Cleaning project for production...");

  const projectRoot = process.cwd();
  const files = findFiles(projectRoot);

  let changedFiles = 0;

  files.forEach((file) => {
    if (cleanFile(file)) {
      changedFiles++;
      console.log(`✅ Cleaned: ${path.relative(projectRoot, file)}`);
    }
  });

  console.log(`\n🎉 Production cleanup complete!`);
  console.log(`📄 Processed ${files.length} files`);
  console.log(`🔧 Modified ${changedFiles} files`);
  console.log("\n✨ Your application is now production-ready!");
}

main();
