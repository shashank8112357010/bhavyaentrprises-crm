import { businessInsightsCron } from "@/scripts/business-insights-cron";

export async function GET() {
  try {
    console.log('Starting business insights cron now...');
    await businessInsightsCron();
    console.log('Cron job completed successfully!');
    return new Response(JSON.stringify({ success: true, message: 'Cron job completed successfully' }));
  } catch (error:any) {
    console.error('Error running cron now:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}

