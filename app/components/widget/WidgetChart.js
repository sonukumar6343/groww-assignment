'use client';

import { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ReferenceArea } from 'recharts';
import { ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

export function WidgetChart({ data, widget }) {
  const [zoomDomain, setZoomDomain] = useState(null);
  const chartRef = useRef(null);
  
  // Transform data for Recharts
  const chartData = Array.isArray(data) 
    ? data
        .filter(item => item.value !== undefined && item.value !== null)
        .map((item, index) => ({
          name: item.label,
          value: Number(item.value) || 0,
        }))
    : [];
  
  // Initialize zoom to show approximately 50 points by default
  useEffect(() => {
    if (chartData.length > 50) {
      const initialEnd = Math.min(49, chartData.length - 1);
      setZoomDomain({ startIndex: 0, endIndex: initialEnd });
    }
  }, [chartData.length]);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="text-center">
          <div className="mb-2 text-lg">⚠️ No valid data to display</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Some fields may not be found in the API response</div>
        </div>
      </div>
    );
  }

  const chartType = widget?.chartType || 'line';
  const showGrid = widget?.showGrid !== false;
  const showTooltip = widget?.showTooltip !== false;


  const handleZoomIn = () => {
    if (chartData.length === 0) return;
    const currentStart = zoomDomain?.startIndex ?? 0;
    const currentEnd = zoomDomain?.endIndex ?? chartData.length - 1;
    const range = currentEnd - currentStart;
    if (range <= 2) return; // Can't zoom in more
    
    const newRange = Math.max(2, Math.floor(range * 0.6)); // Zoom in by 40%
    const center = Math.floor((currentStart + currentEnd) / 2);
    const newStart = Math.max(0, center - Math.floor(newRange / 2));
    const newEnd = Math.min(chartData.length - 1, newStart + newRange - 1);
    setZoomDomain({ startIndex: newStart, endIndex: newEnd });
  };

  const handleZoomOut = () => {
    if (chartData.length === 0) return;
    const currentStart = zoomDomain?.startIndex ?? 0;
    const currentEnd = zoomDomain?.endIndex ?? chartData.length - 1;
    const range = currentEnd - currentStart;
    if (range >= chartData.length - 1) {
      handleResetZoom();
      return;
    }
    
    const newRange = Math.min(chartData.length, Math.ceil(range * 1.5)); // Zoom out by 50%
    const center = Math.floor((currentStart + currentEnd) / 2);
    const newStart = Math.max(0, center - Math.floor(newRange / 2));
    const newEnd = Math.min(chartData.length - 1, newStart + newRange - 1);
    setZoomDomain({ startIndex: newStart, endIndex: newEnd });
  };

  const handleResetZoom = () => {
    if (chartData.length > 50) {
      const initialEnd = Math.min(49, chartData.length - 1);
      setZoomDomain({ startIndex: 0, endIndex: initialEnd });
    } else {
      setZoomDomain(null);
    }
  };

  // Horizontal scrolling functions
  const handleScrollLeft = () => {
    if (chartData.length === 0) return;
    const currentStart = zoomDomain?.startIndex ?? 0;
    const currentEnd = zoomDomain?.endIndex ?? chartData.length - 1;
    const range = currentEnd - currentStart;
    
    if (currentStart > 0) {
      const scrollAmount = Math.max(1, Math.floor(range * 0.2)); // Scroll 20% of visible range
      const newStart = Math.max(0, currentStart - scrollAmount);
      const newEnd = newStart + range;
      setZoomDomain({ startIndex: newStart, endIndex: Math.min(chartData.length - 1, newEnd) });
    }
  };

  const handleScrollRight = () => {
    if (chartData.length === 0) return;
    const currentStart = zoomDomain?.startIndex ?? 0;
    const currentEnd = zoomDomain?.endIndex ?? chartData.length - 1;
    const range = currentEnd - currentStart;
    
    if (currentEnd < chartData.length - 1) {
      const scrollAmount = Math.max(1, Math.floor(range * 0.2)); // Scroll 20% of visible range
      const newEnd = Math.min(chartData.length - 1, currentEnd + scrollAmount);
      const newStart = newEnd - range;
      setZoomDomain({ startIndex: Math.max(0, newStart), endIndex: newEnd });
    }
  };

  // Filter data based on zoom - this makes the chart expand to show more detail
  const displayData = zoomDomain && zoomDomain.startIndex !== undefined && zoomDomain.endIndex !== undefined
    ? chartData.slice(zoomDomain.startIndex, zoomDomain.endIndex + 1)
    : chartData;

  // Color scheme that adapts to dark mode
  const lineColor = '#3b82f6'; // blue-500
  const fillColor = 'rgba(59, 130, 246, 0.1)';
  const gridColor = '#e5e7eb'; // gray-200
  const gridColorDark = '#374151'; // gray-700
  const axisLabelColor = '#ffffff'; // white for axis labels

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{label}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            Value: {typeof payload[0].value === 'number' ? payload[0].value.toLocaleString() : payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    // Adjust margin based on data count - more space for labels when zoomed
    const bottomMargin = displayData.length > 15 ? 40 : displayData.length > 8 ? 30 : 20;
    
    const commonProps = {
      data: displayData, // Filtered data - fewer points = each point takes more space = expanded view
      margin: { top: 10, right: 10, left: 0, bottom: bottomMargin },
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} className="dark:stroke-gray-700" />}
            <XAxis 
              dataKey="name" 
              tick={{ fill: axisLabelColor, fontSize: 11 }}
              className="[&_text]:fill-white [&_line]:stroke-gray-600"
              interval={0}
              angle={displayData.length > 12 ? -45 : 0}
              textAnchor={displayData.length > 12 ? 'end' : 'middle'}
              height={displayData.length > 12 ? 70 : 30}
            />
            <YAxis 
              tick={{ fill: axisLabelColor, fontSize: 12 }}
              className="[&_text]:fill-white [&_line]:stroke-gray-600"
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={lineColor} 
              fill={fillColor}
              strokeWidth={2}
            />
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} className="dark:stroke-gray-700" />}
            <XAxis 
              dataKey="name" 
              tick={{ fill: axisLabelColor, fontSize: 11 }}
              className="[&_text]:fill-white [&_line]:stroke-gray-600"
              interval={0}
              angle={displayData.length > 12 ? -45 : 0}
              textAnchor={displayData.length > 12 ? 'end' : 'middle'}
              height={displayData.length > 12 ? 70 : 30}
            />
            <YAxis 
              tick={{ fill: axisLabelColor, fontSize: 12 }}
              className="[&_text]:fill-white [&_line]:stroke-gray-600"
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            <Bar dataKey="value" fill={lineColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      default: // line
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} className="dark:stroke-gray-700" />}
            <XAxis 
              dataKey="name" 
              tick={{ fill: axisLabelColor, fontSize: 11 }}
              className="[&_text]:fill-white [&_line]:stroke-gray-600"
              interval={0}
              angle={displayData.length > 12 ? -45 : 0}
              textAnchor={displayData.length > 12 ? 'end' : 'middle'}
              height={displayData.length > 12 ? 70 : 30}
            />
            <YAxis 
              tick={{ fill: axisLabelColor, fontSize: 12 }}
              className="[&_text]:fill-white [&_line]:stroke-gray-600"
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={lineColor} 
              strokeWidth={2}
              dot={{ fill: lineColor, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );
    }
  };

  // Handle mouse wheel zoom and horizontal scrolling
  const handleWheel = (e) => {
    if (chartData.length === 0) return;
    
    // Horizontal scrolling with Shift + wheel
    if (e.shiftKey) {
      e.preventDefault();
      const currentStart = zoomDomain?.startIndex ?? 0;
      const currentEnd = zoomDomain?.endIndex ?? chartData.length - 1;
      const range = currentEnd - currentStart;
      
      if (e.deltaY < 0) {
        // Scroll left
        if (currentStart > 0) {
          const scrollAmount = Math.max(1, Math.floor(range * 0.1));
          const newStart = Math.max(0, currentStart - scrollAmount);
          const newEnd = newStart + range;
          setZoomDomain({ startIndex: newStart, endIndex: Math.min(chartData.length - 1, newEnd) });
        }
      } else {
        // Scroll right
        if (currentEnd < chartData.length - 1) {
          const scrollAmount = Math.max(1, Math.floor(range * 0.1));
          const newEnd = Math.min(chartData.length - 1, currentEnd + scrollAmount);
          const newStart = newEnd - range;
          setZoomDomain({ startIndex: Math.max(0, newStart), endIndex: newEnd });
        }
      }
      return;
    }
    
    // Zoom with Ctrl/Cmd + wheel
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    
    const currentStart = zoomDomain?.startIndex ?? 0;
    const currentEnd = zoomDomain?.endIndex ?? chartData.length - 1;
    const range = currentEnd - currentStart;
    
    if (e.deltaY < 0) {
      // Zoom in
      if (range <= 2) return;
      const newRange = Math.max(2, Math.floor(range * 0.9));
      const center = Math.floor((currentStart + currentEnd) / 2);
      const newStart = Math.max(0, center - Math.floor(newRange / 2));
      const newEnd = Math.min(chartData.length - 1, newStart + newRange - 1);
      setZoomDomain({ startIndex: newStart, endIndex: newEnd });
    } else {
      // Zoom out
      if (range >= chartData.length) {
        handleResetZoom();
        return;
      }
      const newRange = Math.min(chartData.length, Math.ceil(range * 1.1));
      const center = Math.floor((currentStart + currentEnd) / 2);
      const newStart = Math.max(0, center - Math.floor(newRange / 2));
      const newEnd = Math.min(chartData.length - 1, newStart + newRange - 1);
      setZoomDomain({ startIndex: newStart, endIndex: newEnd });
    }
  };

  return (
    <div 
      className="h-full w-full bg-white dark:bg-gray-900 rounded-lg flex flex-col"
      onWheel={handleWheel}
      ref={chartRef}
    >
      {/* Zoom Controls */}
      <div className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomIn}
            disabled={zoomDomain && (zoomDomain.endIndex - zoomDomain.startIndex) <= 2}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom In (or Ctrl/Cmd + Scroll)"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleZoomOut}
            disabled={!zoomDomain || (zoomDomain.endIndex - zoomDomain.startIndex) >= chartData.length}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom Out (or Ctrl/Cmd + Scroll)"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={handleResetZoom}
            disabled={!zoomDomain && chartData.length <= 50}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reset Zoom"
          >
            <RotateCcw size={16} />
          </button>
        </div>
        {chartData.length > 50 && (
          <div className="flex items-center gap-1 border-l border-gray-300 dark:border-gray-600 pl-2 ml-2">
            <button
              onClick={handleScrollLeft}
              disabled={zoomDomain && zoomDomain.startIndex === 0}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Scroll Left (or Shift + Scroll)"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleScrollRight}
              disabled={zoomDomain && zoomDomain.endIndex >= chartData.length - 1}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Scroll Right (or Shift + Scroll)"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
        {zoomDomain && (
          <div className="flex-1 flex items-center justify-end gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Showing: {zoomDomain.startIndex + 1}-{zoomDomain.endIndex + 1} of {chartData.length} 
              <span className="ml-1 text-gray-500">
                ({Math.round(((zoomDomain.endIndex - zoomDomain.startIndex + 1) / chartData.length) * 100)}%)
              </span>
            </span>
          </div>
        )}
        {!zoomDomain && chartData.length > 50 && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
            Showing first 50 points. Use arrows or Shift + Scroll to navigate
          </span>
        )}
        {!zoomDomain && chartData.length <= 50 && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
            Use buttons or Ctrl/Cmd + Scroll to zoom
          </span>
        )}
      </div>
      
      {/* Chart */}
      <div className="flex-1 min-h-0" key={`chart-${zoomDomain?.startIndex}-${zoomDomain?.endIndex}`}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}