'use client';

import { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  MouseSensor,
} from '@dnd-kit/core';
import { Widget } from '../widget/widget';
import DashboardHeader from './DashboardHeader';
import { WidgetAdder } from './widgetadder';
import { WebSocketWidgetAdder } from './WebSocketWidgetAdder';
import { WidgetSidebar } from './WidgetSidebar';
import { useStore } from '../../../lib/store';

function DraggableWidget({ widget }) {
  const { updateWidget, bringToFront } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(widget.position || { x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [size, setSize] = useState(widget.size || { width: 400, height: 300 });
  const widgetRef = useRef(null);
  const headerRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const currentPositionRef = useRef(position);
  const currentSizeRef = useRef(size);
  
  // Update refs when position/size changes
  useEffect(() => {
    currentPositionRef.current = position;
  }, [position]);
  
  useEffect(() => {
    currentSizeRef.current = size;
  }, [size]);
  
  // Initialize z-index if not present
  useEffect(() => {
    if (!widget.zIndex) {
      updateWidget(widget.id, { zIndex: 1 });
    }
  }, [widget.id, widget.zIndex, updateWidget]);

  useEffect(() => {
    setPosition(widget.position || { x: 0, y: 0 });
    setSize(widget.size || { width: 400, height: 300 });
  }, [widget.position, widget.size]);

  const handleHeaderMouseDown = (e) => {
    // Don't start drag if clicking on buttons or inputs
    if (e.target.closest('button, input, textarea, select, a')) {
      return;
    }
    
    // Bring widget to front when starting to drag
    bringToFront(widget.id);
    
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
  };
  
  const handleWidgetClick = (e) => {
    // Bring widget to front when clicked (but not if clicking buttons)
    if (!e.target.closest('button, input, textarea, select, a')) {
      bringToFront(widget.id);
    }
  };


  useEffect(() => {
    if (isDragging || isResizing) {
      const handleMove = (e) => {
        if (isDragging) {
          const newX = e.clientX - dragStartPos.current.x;
          const newY = e.clientY - dragStartPos.current.y;
          setPosition({ x: Math.max(0, newX), y: Math.max(0, newY) });
        } else if (isResizing) {
          const deltaX = e.clientX - resizeStartPos.current.x;
          const deltaY = e.clientY - resizeStartPos.current.y;
          // Set minimum sizes based on widget type
          const minWidth = widget.type === 'table' ? 500 : widget.type === 'chart' ? 400 : widget.type === 'websocket' ? 400 : 300;
          const minHeight = widget.type === 'table' ? 300 : widget.type === 'chart' ? 300 : widget.type === 'websocket' ? 300 : 200;
          const newWidth = Math.max(minWidth, resizeStartPos.current.width + deltaX);
          const newHeight = Math.max(minHeight, resizeStartPos.current.height + deltaY);
          setSize({ width: newWidth, height: newHeight });
        }
      };
      
      const handleUp = () => {
        if (isDragging) {
          updateWidget(widget.id, { position: currentPositionRef.current });
          setIsDragging(false);
        } else if (isResizing) {
          updateWidget(widget.id, { size: currentSizeRef.current });
          setIsResizing(false);
        }
      };
      
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
      return () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };
    }
  }, [isDragging, isResizing, widget.id, updateWidget]);

  const handleResizeStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    resizeStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };
  };

  return (
    <div
      ref={widgetRef}
      onClick={handleWidgetClick}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: widget.zIndex || 1,
      }}
      className="select-none"
    >
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Widget 
          widget={widget} 
          onHeaderMouseDown={handleHeaderMouseDown}
        />
        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          className="absolute bottom-0 right-0 w-5 h-5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 cursor-nwse-resize rounded-tl-lg shadow-lg border-2 border-white dark:border-gray-900 transition-colors"
          style={{ zIndex: 10 }}
          title="Resize widget"
        />
      </div>
    </div>
  );
}

export function Dashboard() {
  const { widgets } = useStore();
  const [addingWidget, setAddingWidget] = useState(false);
  const [addingWebSocketWidget, setAddingWebSocketWidget] = useState(false);

  // Filter to show only visible widgets
  const visibleWidgets = widgets.filter(w => !w.hidden);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Left Sidebar */}
      <WidgetSidebar />
      
      {/* Main Content Area */}
      <div className="ml-64 flex flex-col min-h-screen">
        <DashboardHeader 
          onAddWidget={() => setAddingWidget(true)} 
          onAddWebSocketWidget={() => setAddingWebSocketWidget(true)}
        />
        
        <main className="flex-1 relative overflow-hidden" style={{ position: 'relative', width: '100%', height: 'calc(100vh - 73px)' }}>
          {addingWidget && (
            <WidgetAdder onClose={() => setAddingWidget(false)} />
          )}
          {addingWebSocketWidget && (
            <WebSocketWidgetAdder onClose={() => setAddingWebSocketWidget(false)} />
          )}

          {visibleWidgets.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center py-16">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">No widgets on screen</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Select widgets from the left panel to add them to your dashboard
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Connect your finance API to get real-time data and insights
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Or create a new widget using the Add Widget button
                </p>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0" style={{ position: 'relative', width: '100%', height: '100%' }}>
              {visibleWidgets
                .slice()
                .sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1))
                .map(widget => (
                  <DraggableWidget key={widget.id} widget={widget} />
                ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}