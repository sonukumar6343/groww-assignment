'use client';

export function WidgetCard({ data, widget }) {
  const formatValue = (value, type) => {
    if (type === 'number') {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }
    return String(value);
  };

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className="p-8 text-gray-500 dark:text-gray-400 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl">📭</span>
          <span className="font-medium">No data available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Array.isArray(data) ? (
        data.map((item, index) => {
          // Check if value is undefined
          if (item.value === undefined) {
            return (
              <div key={index} className="p-4 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-900/20 dark:to-yellow-800/10 shadow-sm">
                <div className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">{item.label}</div>
                <div className="text-lg font-bold text-yellow-700 dark:text-yellow-400 mb-2">
                  ⚠️ Field not found in API response
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-500 font-mono bg-yellow-100/50 dark:bg-yellow-900/30 px-2 py-1 rounded">
                  Path: {item.path}
                </div>
              </div>
            );
          }
          
          return (
            <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                {item.label}
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {formatValue(item.value, item.type)}
              </div>
            </div>
          );
        })
      ) : (
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <pre className="text-sm overflow-auto text-gray-900 dark:text-gray-100 font-mono">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}