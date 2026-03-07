export const timeframeToDateRange = (timeframe: string): { start_date?: string; end_date?: string } => {
  const now = new Date();
  let start_date: Date | undefined;
  let end_date: Date | undefined;

  // Set to end of current day for precise 'up to now' filtering
  end_date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (timeframe) {
    case 'today':
      start_date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      break;
    case 'week':
      start_date = new Date(now);
      // Get to Monday of the current week
      const day = start_date.getDay();
      const diff = start_date.getDate() - day + (day === 0 ? -6 : 1);
      start_date.setDate(diff);
      start_date.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start_date = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    case '3months':
      start_date = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
      break;
    case 'all':
    default:
      return {}; // undefined start/end means everything
  }

  return {
    start_date: start_date.toISOString(),
    end_date: end_date.toISOString(),
  };
};
