// Fix for Next.js SIGINT error where process.exit receives string instead of number

if (typeof window === 'undefined' && typeof process !== 'undefined') {
  const originalExit = process.exit;
  
  // Override process.exit to handle string arguments
  process.exit = function(code) {
    let exitCode = 0;
    
    if (typeof code === 'string') {
      // Convert common signal strings to appropriate exit codes
      switch (code) {
        case 'SIGINT':
          exitCode = 130; // Standard SIGINT exit code
          break;
        case 'SIGTERM':
          exitCode = 143; // Standard SIGTERM exit code
          break;
        default:
          exitCode = 1; // Generic error exit code
      }
    } else if (typeof code === 'number') {
      exitCode = code;
    }
    
    return originalExit.call(this, exitCode);
  };
  
  // Add signal handlers to gracefully handle interrupts
  process.on('SIGINT', () => {
    console.log('\nReceived SIGINT. Gracefully shutting down...');
    process.exit(130);
  });
  
  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM. Gracefully shutting down...');
    process.exit(143);
  });
}
