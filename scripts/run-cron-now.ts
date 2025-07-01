const main = require('./business-insightks-cron')
async function runNow() {
  try {
    console.log('Starting business insights cron now...');
    await main();
    console.log('Cron job completed successfully!');
  } catch (error) {
    console.error('Error running cron now:', error);
  }
}

runNow();
