import { cookies } from 'next/headers';

interface PreloadedData {
  dashboard?: any;
  agents?: any;
  clients?: any;
}

/**
 * Server-side data preloading for hydration
 * This runs during server rendering to fetch critical data
 */
export async function preloadCommonData(): Promise<PreloadedData> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('connect.sid');
    
    if (!sessionCookie) {
      return {};
    }

    // Use internal URL for server-side requests
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // Prepare headers for server-side requests
    const headers = {
      'Cookie': `connect.sid=${sessionCookie.value}`,
      'Content-Type': 'application/json',
      'User-Agent': 'NextJS-Server',
    };

    // Parallel fetch of critical data with timeout
    const fetchWithTimeout = (url: string, options: any, timeout = 5000) => {
      return Promise.race([
        fetch(url, options),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
      ]);
    };

    const fetchPromises = [
      fetchWithTimeout(`${baseUrl}/api/dashboard/data`, { headers }).catch(() => null),
      fetchWithTimeout(`${baseUrl}/api/agent?limit=20`, { headers }).catch(() => null),
      fetchWithTimeout(`${baseUrl}/api/client?limit=20`, { headers }).catch(() => null),
    ];

    const [dashboardRes, agentsRes, clientsRes] = await Promise.allSettled(fetchPromises);
    
    const data: PreloadedData = {};

    // Process dashboard data
    if (dashboardRes.status === 'fulfilled' && dashboardRes.value && (dashboardRes.value as any)?.ok) {
      try {
        data.dashboard = await (dashboardRes.value as Response).json();
      } catch (e) {
        console.error('Failed to parse dashboard data:', e);
      }
    }

    // Process agents data
    if (agentsRes.status === 'fulfilled' && agentsRes.value && (agentsRes.value as any)?.ok) {
      try {
        data.agents = await (agentsRes.value as Response).json();
      } catch (e) {
        console.error('Failed to parse agents data:', e);
      }
    }

    // Process clients data
    if (clientsRes.status === 'fulfilled' && clientsRes.value && (clientsRes.value as any)?.ok) {
      try {
        data.clients = await (clientsRes.value as Response).json();
      } catch (e) {
        console.error('Failed to parse clients data:', e);
      }
    }

    return data;
  } catch (error) {
    console.error('Error preloading data:', error);
    return {};
  }
}

/**
 * Serialize data for embedding in HTML
 */
export function serializePreloadedData(data: PreloadedData): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Error serializing preloaded data:', error);
    return '{}';
  }
}
