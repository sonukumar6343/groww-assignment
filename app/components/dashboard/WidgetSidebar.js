'use client';

import { useState } from 'react';
import { CreditCard, BarChart3, Table, X, Trash2 } from 'lucide-react';
import { useStore } from '../../../lib/store';

export function WidgetSidebar() {
  const { widgets, showWidget, removeWidget } = useStore();
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [addingWidgetId, setAddingWidgetId] = useState(null);

  const categories = [
    { id: 'card', label: 'Cards', icon: CreditCard, color: 'blue' },
    { id: 'chart', label: 'Charts', icon: BarChart3, color: 'green' },
    { id: 'table', label: 'Tables', icon: Table, color: 'purple' },
  ];

  const getWidgetsByType = (type) => {
    return widgets.filter(w => w.type === type && w.endpoint); // Only show widgets with API configured
  };

  const handleAddToScreen = (widgetId) => {
    setAddingWidgetId(widgetId);
    showWidget(widgetId);
    // Reset after a brief moment
    setTimeout(() => setAddingWidgetId(null), 300);
  };

  const handleDeleteWidget = (e, widgetId) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to permanently delete this widget?')) {
      removeWidget(widgetId);
    }
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Widget Library</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select widgets to add to dashboard</p>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-2">
        {categories.map((category) => {
          const Icon = category.icon;
          const categoryWidgets = getWidgetsByType(category.id);
          const isHovered = hoveredCategory === category.id;

          return (
            <div
              key={category.id}
              className="mb-2"
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              {/* Category Button */}
              <button
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all border ${
                  isHovered
                    ? category.color === 'blue'
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700'
                      : category.color === 'green'
                      ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700'
                      : 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-700'
                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <Icon 
                  size={20} 
                  className={
                    isHovered 
                      ? category.color === 'blue'
                        ? 'text-blue-600 dark:text-blue-400'
                        : category.color === 'green'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-600 dark:text-gray-400'
                  } 
                />
                <span className={`font-semibold flex-1 text-left ${
                  isHovered
                    ? category.color === 'blue'
                      ? 'text-blue-700 dark:text-blue-300'
                      : category.color === 'green'
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-purple-700 dark:text-purple-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {category.label}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isHovered
                    ? category.color === 'blue'
                      ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                      : category.color === 'green'
                      ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                      : 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {categoryWidgets.length}
                </span>
              </button>

              {/* Widget List (shown on hover) */}
              {isHovered && categoryWidgets.length > 0 && (
                <div className="mt-2 ml-2 space-y-1 max-h-96 overflow-y-auto">
                  {categoryWidgets.map((widget) => (
                    <div
                      key={widget.id}
                      className={`group relative p-3 rounded-lg border transition-all ${
                        widget.hidden
                          ? 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                            {widget.title || 'Untitled Widget'}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {widget.endpoint || 'No endpoint'}
                          </p>
                          {widget.hidden && (
                            <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded">
                              Hidden
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => handleDeleteWidget(e, widget.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                          title="Delete widget permanently"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => handleAddToScreen(widget.id)}
                        disabled={addingWidgetId === widget.id}
                        className={`mt-2 w-full py-1.5 px-3 text-xs font-medium rounded transition-all ${
                          addingWidgetId === widget.id
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : widget.hidden
                            ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {addingWidgetId === widget.id
                          ? 'Adding...'
                          : widget.hidden
                          ? 'Add to Screen'
                          : 'Already on Screen'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {isHovered && categoryWidgets.length === 0 && (
                <div className="mt-2 ml-2 p-4 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No {category.label.toLowerCase()} widgets yet
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Create one using the Add Widget button
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Total: {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

