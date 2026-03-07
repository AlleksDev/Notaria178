import { useState, useCallback } from 'react';
import type { DashboardFilters } from '../types';
import { GlobalSearch } from '../../../components/GlobalSearch';
import { GlobalFilters } from '../../../components/GlobalFilters';
import { KPICards } from '../components/KPICards';
import { TrendChart } from '../components/TrendChart';
import { DistributionChart } from '../components/DistributionChart';
import { RecentActivity } from '../components/RecentActivity';
import { TopDrafters } from '../components/TopDrafters';
import { TopActs } from '../components/TopActs';
import { useDashboardKPIs } from '../hooks/useDashboardKPIs';
import { useDashboardTrend } from '../hooks/useDashboardTrend';
import { useDashboardDistribution } from '../hooks/useDashboardDistribution';
import { useDashboardActivity } from '../hooks/useDashboardActivity';
import { useDashboardTopDrafters } from '../hooks/useDashboardTopDrafters';
import { useDashboardTopActs } from '../hooks/useDashboardTopActs';

export const HomePage = () => {
  const [filters, setFilters] = useState<DashboardFilters>({
    timeframe: 'month',
    branch_id: '',
    search: '',
    sort: 'desc'
  });

  const handleSearch = useCallback((term: string) => {
    setFilters(prev => prev.search === term ? prev : { ...prev, search: term });
  }, []);

  const handleDateChange = useCallback((timeframe: string) => {
    setFilters(prev => prev.timeframe === timeframe ? prev : { ...prev, timeframe });
  }, []);

  const handleLocationChange = useCallback((branchId: string) => {
    setFilters(prev => prev.branch_id === branchId ? prev : { ...prev, branch_id: branchId });
  }, []);

  const handleSortChange = useCallback((sort: string) => {
    setFilters(prev => prev.sort === sort ? prev : { ...prev, sort });
  }, []);

  const { data: kpiData, isLoading: isKpiLoading, error: kpiError } = useDashboardKPIs(filters);
  const { data: trendData, isLoading: isTrendLoading, error: trendError } = useDashboardTrend(filters);
  const { data: distributionData, isLoading: isDistributionLoading, error: distributionError } = useDashboardDistribution(filters);
  
  // New bottom section hooks
  const { data: activityData, isLoading: isActivityLoading, error: activityError } = useDashboardActivity({ ...filters, limit: 8 });
  const { data: draftersData, isLoading: isDraftersLoading, error: draftersError } = useDashboardTopDrafters({ ...filters, limit: 5 });
  const { data: actsData, isLoading: isActsLoading, error: actsError } = useDashboardTopActs({ ...filters, limit: 7 });

  return (
    <div className="flex flex-col gap-6 w-full max-w-full pb-8">
      {/* Top Bar: Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-6 items-center w-full">
        <div className="flex-1 w-full max-w-[800px]">
          <GlobalSearch onSearch={handleSearch} />
        </div>
        <div className="flex-shrink-0 sm:ml-auto">
          <GlobalFilters
            timeframe={filters.timeframe}
            branchId={filters.branch_id}
            sort={filters.sort}
            onDateChange={handleDateChange}
            onLocationChange={handleLocationChange}
            onSortChange={handleSortChange}
          />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-600">Panel de control</h1>
      </div>

      {/* Top Stats Grid Component */}
      <KPICards data={kpiData} isLoading={isKpiLoading} error={kpiError} />

      {/* Middle Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TrendChart data={trendData} isLoading={isTrendLoading} error={trendError} />
        <DistributionChart data={distributionData} isLoading={isDistributionLoading} error={distributionError} />
      </div>

      {/* Bottom Section: Activity & Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <RecentActivity data={activityData} isLoading={isActivityLoading} error={activityError} />
        
        <div className="flex flex-col gap-6 w-full h-full">
          <TopDrafters data={draftersData} isLoading={isDraftersLoading} error={draftersError} />
          <TopActs data={actsData} isLoading={isActsLoading} error={actsError} />
        </div>
      </div>
    </div>
  );
};
