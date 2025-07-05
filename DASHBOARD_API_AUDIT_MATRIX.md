# Dashboard API Audit Matrix - Cold Load Analysis

## Executive Summary
This audit catalogues every API request fired during a **cold dashboard load** to identify redundant calls and optimization opportunities.

## Primary Dashboard API Call

### Main Dashboard Data Fetch
| Component | API Endpoint | Method | Store Used | Cached | Cache Duration | Data Fetched | Role-Based |
|-----------|-------------|---------|------------|---------|---------------|--------------|------------|
| `useDashboardStore.fetchDashboardData()` | `/api/dashboard/data` | GET | ✅ Dashboard Store | ✅ | 5 minutes | All dashboard data in single call | ✅ |

**Data Returned:**
- Tickets (with relations: assignee, client, workStage, expenses, quotations, comments)
- Clients (admin/accounts only)
- Agents (admin/accounts only) 
- Recent quotations (50 records)
- Dashboard counts (open tickets, scheduled today, client updates needed, completed this week, total agents, total clients)

## Secondary Component-Level API Calls

### Performance Card (Admin/Agent Views)
| Component | API Endpoint | Method | Store Used | Cached | Cache Duration | Triggered When | Role-Based |
|-----------|-------------|---------|------------|---------|---------------|----------------|------------|
| Dashboard page `useEffect` | `/api/performance/agent/{agentId}` | GET | ❌ Component State | ❌ | None | Agent selected or user is agent | ✅ Admin/Agent only |

### Profit/Loss Chart
| Component | API Endpoint | Method | Store Used | Cached | Cache Duration | Triggered When | Role-Based |
|-----------|-------------|---------|------------|---------|---------------|----------------|------------|
| `ProfitLossChart` | `/api/finances/profit-loss-graph?mode=year` | GET | ❌ Component State | ❌ | None | Component mount + mode change | ❌ |

### Total Agents Card (Redundant Call)
| Component | API Endpoint | Method | Store Used | Cached | Cache Duration | Triggered When | Role-Based |
|-----------|-------------|---------|------------|---------|---------------|----------------|------------|
| `TotalAgentsCard.useEffect` | `/api/agent/count` | GET | ✅ Agent Store | ❌ | None | Component mount | ✅ Admin/Accounts only |

### Total Clients Card (Redundant Call)
| Component | API Endpoint | Method | Store Used | Cached | Cache Duration | Triggered When | Role-Based |
|-----------|-------------|---------|------------|---------|---------------|----------------|------------|
| `TotalClientsCard.useEffect` | `/api/client` | GET | ✅ Client Store | ❌ | None | Component mount | ✅ Admin/Accounts only |

## Data Usage Analysis by Component

### Dashboard Components Using Main Store Data (No Additional API Calls)
| Component | Data Source | Store Used | Additional API | Redundant |
|-----------|-------------|------------|----------------|-----------|
| **Overview Metrics** | Static hardcoded data | ❌ | ❌ | N/A |
| **Status Summary** | `useTicketStore.tickets` | ✅ Ticket Store | ❌ | ❌ |
| **Priority Issues** | `useTicketStore.all_tickets` | ✅ Ticket Store | ❌ | ❌ |
| **Recent Activity** | Static hardcoded data | ❌ | ❌ | N/A |
| **External Calls List** | Static hardcoded data | ❌ | ❌ | N/A |
| **Upcoming Schedule** | Static hardcoded data | ❌ | ❌ | N/A |

### Dashboard Stats Cards (Using Main Store Data)
| Component | Data Source | Store Used | Additional API | Redundant |
|-----------|-------------|------------|----------------|-----------|
| **Open Tickets Count** | `useTicketStore.openTicketsCount` | ✅ Ticket Store | ❌ | ❌ |
| **Scheduled Today Count** | `useTicketStore.scheduledTodayCount` | ✅ Ticket Store | ❌ | ❌ |
| **Client Updates Needed** | `useTicketStore.clientUpdatesNeededCount` | ✅ Ticket Store | ❌ | ❌ |
| **Completed This Week** | `useTicketStore.completedThisWeekCount` | ✅ Ticket Store | ❌ | ❌ |

## Redundancy Analysis

### ❌ REDUNDANT API CALLS IDENTIFIED

1. **Total Agents Count**
   - **Primary Call**: `/api/dashboard/data` already returns `totalAgents` count
   - **Redundant Call**: `/api/agent/count` in `TotalAgentsCard`
   - **Impact**: Unnecessary API call fetching same data
   - **Solution**: Use `dashboardStore.data.counts.totalAgents`

2. **Total Clients Count**  
   - **Primary Call**: `/api/dashboard/data` already returns `totalClients` count
   - **Redundant Call**: `/api/client` in `TotalClientsCard` 
   - **Impact**: Fetches all client records just to count them
   - **Solution**: Use `dashboardStore.data.counts.totalClients`

3. **Agent List for Performance Dropdown**
   - **Primary Call**: `/api/dashboard/data` already returns agents list
   - **Redundant Call**: Potentially calls agent store separately
   - **Impact**: Could fetch agents twice
   - **Solution**: Use `dashboardStore.data.agents` 

## Cache Analysis

### ✅ CACHED COMPONENTS
| Component | Cache Implementation | Duration | Store |
|-----------|---------------------|-----------|--------|
| Main Dashboard Data | `dashboardStore` cache check | 5 minutes | Dashboard Store |

### ❌ NON-CACHED COMPONENTS  
| Component | Cache Status | Impact |
|-----------|-------------|--------|
| Performance Card | No caching | Fetches on every agent selection |
| Profit/Loss Chart | No caching | Fetches on every mode change |
| Agent Count Card | No caching | Fetches on every mount |
| Client List Card | No caching | Fetches on every mount |

## API Call Flow on Cold Load

### For Admin/Accounts Users:
1. `GET /api/dashboard/data` (Primary - gets most data)
2. `GET /api/agent/count` (❌ REDUNDANT)
3. `GET /api/client` (❌ REDUNDANT) 
4. `GET /api/finances/profit-loss-graph?mode=year` (Chart data)
5. `GET /api/performance/agent/{agentId}` (If agent selected)

### For Regular Agent Users:
1. `GET /api/dashboard/data` (Primary - filtered to user's data)
2. `GET /api/finances/profit-loss-graph?mode=year` (Chart data)
3. `GET /api/performance/agent/{userId}` (Own performance)

## Optimization Recommendations

### 🔧 IMMEDIATE FIXES

1. **Remove Redundant API Calls**
   - Update `TotalAgentsCard` to use `dashboardStore.data.counts.totalAgents`
   - Update `TotalClientsCard` to use `dashboardStore.data.counts.totalClients`
   - **Impact**: Eliminate 2 redundant API calls per admin dashboard load

2. **Add Component-Level Caching**
   - Cache performance data for 10 minutes in performance card
   - Cache profit/loss chart data for 15 minutes
   - **Impact**: Reduce repeated calls on mode changes and selections

3. **Consolidate Chart Data**
   - Consider adding profit/loss data to main dashboard API
   - **Impact**: Single API call for all dashboard data

### 📊 METRICS
- **Current API Calls (Admin)**: 4-5 calls per cold load
- **Optimized API Calls**: 2-3 calls per cold load  
- **Reduction**: 40-50% fewer API calls
- **Cache Effectiveness**: Main dashboard data cached for 5 minutes

### 🎯 PERFORMANCE IMPACT
- **Network Requests**: Reduced by 2 redundant calls
- **Data Transfer**: Eliminate duplicate agent/client data fetching
- **Response Time**: Faster dashboard load due to fewer sequential API calls
- **Cache Hit Rate**: Improved with component-level caching

## Available Caching Infrastructure

The application has robust caching infrastructure available:
- **APICache class** (`lib/services/api-cache.ts`) - Client-side caching with configurable TTL
- **CachedAPIService** - Enhanced axios wrapper with automatic cache management  
- **APIService** - Standardized API patterns with built-in cache durations

**Recommended Cache Durations:**
- Dashboard data: 2-5 minutes (current)
- Performance data: 10 minutes  
- Chart data: 15 minutes
- Static data (counts): 30 minutes
