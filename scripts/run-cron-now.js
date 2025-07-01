require('next/dist/server/next').default({
  dev: true,
  dir: __dirname,
}).then(async (app) => {
  const { businessInsightsCron } = require('./business-insights-cron');
  
  try {
    console.log('Starting business insights cron now...');
    await businessInsightsCron();
    console.log('Cron job completed successfully!');
  } catch (error) {
    console.error('Error running cron now:', error);
  } finally {
    await app.close();
  }
}).catch(console.error);
