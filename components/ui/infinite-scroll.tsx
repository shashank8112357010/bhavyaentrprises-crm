"use client";

import React, { useCallback, useRef } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Spinner } from './spinner';
import { Button } from './button';
import { RefreshCw } from 'lucide-react';

interface InfiniteScrollListProps<T> {
  // Data
  data: T[];
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  
  // Callbacks
  fetchMore: () => Promise<void>;
  onRefresh?: () => Promise<void>;
  
  // Rendering
  renderItem: (item: T, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderError?: (error: string) => React.ReactNode;
  
  // UI Configuration
  scrollableTarget?: string;
  className?: string;
  height?: number | string;
  endMessage?: React.ReactNode;
  pullDownToRefresh?: boolean;
  refreshFunction?: () => Promise<void>;
  
  // Search and filter indicators
  searchQuery?: string;
  activeFilters?: Record<string, any>;
}

export function InfiniteScrollList<T>({
  data,
  hasMore,
  loading,
  loadingMore,
  error,
  fetchMore,
  onRefresh,
  renderItem,
  renderEmpty,
  renderError,
  scrollableTarget,
  className = "",
  height = "calc(100vh - 200px)",
  endMessage,
  pullDownToRefresh = false,
  refreshFunction,
  searchQuery,
  activeFilters
}: InfiniteScrollListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Default empty state
  const defaultEmpty = useCallback(() => {
    const hasActiveSearch = searchQuery && searchQuery.length > 0;
    const hasActiveFilters = activeFilters && Object.keys(activeFilters).length > 0;
    
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-muted-foreground mb-4">
          {hasActiveSearch || hasActiveFilters ? (
            <>
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm">
                Try adjusting your search or filter criteria
              </p>
              {(hasActiveSearch || hasActiveFilters) && onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  className="mt-4"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear filters
                </Button>
              )}
            </>
          ) : (
            <>
              <p className="text-lg font-medium">No items found</p>
              <p className="text-sm">There are no items to display</p>
            </>
          )}
        </div>
      </div>
    );
  }, [searchQuery, activeFilters, onRefresh]);

  // Default error state
  const defaultError = useCallback((errorMessage: string) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-destructive mb-4">
        <p className="text-lg font-medium">Failed to load data</p>
        <p className="text-sm">{errorMessage}</p>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>
        )}
      </div>
    </div>
  ), [onRefresh]);

  // Default end message
  const defaultEndMessage = (
    <div className="text-center py-8 text-muted-foreground">
      <p className="text-sm">You&apos;ve reached the end of the list</p>
    </div>
  );

  // Show error state
  if (error && !loading && data.length === 0) {
    return (
      <div className={className} style={{ height }}>
        {renderError ? renderError(error) : defaultError(error)}
      </div>
    );
  }

  // Show loading state for initial load
  if (loading && data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="flex flex-col items-center gap-2">
          <Spinner size="8" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!loading && data.length === 0) {
    return (
      <div className={className} style={{ height }}>
        {renderEmpty ? renderEmpty() : defaultEmpty()}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <InfiniteScroll
        dataLength={data.length}
        next={fetchMore}
        hasMore={hasMore}
        loader={
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2">
              <Spinner size="4" />
              <span className="text-sm text-muted-foreground">Loading more...</span>
            </div>
          </div>
        }
        endMessage={endMessage || defaultEndMessage}
        height={height}
        scrollableTarget={scrollableTarget}
        pullDownToRefresh={pullDownToRefresh}
        pullDownToRefreshContent={
          <div className="flex justify-center py-4">
            <p className="text-sm text-muted-foreground">↓ Pull down to refresh</p>
          </div>
        }
        releaseToRefreshContent={
          <div className="flex justify-center py-4">
            <p className="text-sm text-muted-foreground">↑ Release to refresh</p>
          </div>
        }
        refreshFunction={refreshFunction}
        style={{ overflow: 'auto' }}
      >
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </InfiniteScroll>

      {/* Show loading overlay when loading more */}
      {loadingMore && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-background border rounded-lg px-4 py-2 shadow-lg">
            <Spinner size="4" />
            <span className="text-sm">Loading more...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default InfiniteScrollList;
