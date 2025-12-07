import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Helper function to calculate chart width based on available space
const getChartWidth = () => {
  if (typeof window === 'undefined') {
    // Server-side or initial render, use a reasonable default
    return 1000;
  }
  const sidebarWidth = 256; // w-64 = 256px
  const padding = 40; // 20px padding on each side
  const availableWidth = window.innerWidth - sidebarWidth - padding;
  return Math.max(400, availableWidth); // Minimum 400px
};

export const useStore = create(
  persist(
    (set, get) => ({
      // Widgets state
      widgets: [],
      layout: [],
      
      // API configuration
      apiConfig: {
        endpoint: '',
        apiKey: '',
        refreshInterval: 60,
      },
      
      // Theme
      theme: 'light',
      
      // Actions
      addWidget: (widget) => set((state) => {
        // Initialize position and size for new widgets
        // Position new widgets in a staggered grid to avoid overlap
        const existingCount = state.widgets.length;
        const cols = 3;
        const col = existingCount % cols;
        const row = Math.floor(existingCount / cols);
        const spacing = 20;
        const padding = 20; // Padding from edges
        
        // Set different default sizes based on widget type
        let defaultWidth, defaultHeight;
        if (widget.type === 'chart') {
          defaultWidth = getChartWidth();
          defaultHeight = 450;
        } else if (widget.type === 'table') {
          defaultWidth = 800;
          defaultHeight = 500;
        } else if (widget.type === 'websocket') {
          defaultWidth = 600;
          defaultHeight = 500;
        } else {
          // Card or default
          defaultWidth = 400;
          defaultHeight = 300;
        }
        
        // Get the highest z-index from existing widgets, or start from 1
        const maxZIndex = state.widgets.length > 0 
          ? Math.max(...state.widgets.map(w => w.zIndex || 1))
          : 0;
        
        // For charts, position at the left with padding and use full available width
        // For WebSocket widgets, center them on the screen
        let position, size;
        if (widget.type === 'chart' && !widget.position && !widget.size) {
          position = { x: padding, y: row * (defaultHeight + spacing) + spacing };
          size = { width: defaultWidth, height: defaultHeight };
        } else if (widget.type === 'websocket' && !widget.position && !widget.size) {
          // Center WebSocket widgets on the screen
          const sidebarWidth = 256; // w-64 = 256px
          const headerHeight = 73; // Header height
          const availableWidth = typeof window !== 'undefined' ? window.innerWidth - sidebarWidth : 1200;
          const availableHeight = typeof window !== 'undefined' ? window.innerHeight - headerHeight : 800;
          
          position = {
            x: sidebarWidth + (availableWidth - defaultWidth) / 2,
            y: headerHeight + (availableHeight - defaultHeight) / 2
          };
          size = { width: defaultWidth, height: defaultHeight };
        } else {
          position = widget.position || { 
            x: col * (defaultWidth + spacing) + spacing, 
            y: row * (defaultHeight + spacing) + spacing 
          };
          size = widget.size || { width: defaultWidth, height: defaultHeight };
        }
        
        const newWidget = {
          ...widget,
          position,
          size,
          zIndex: widget.zIndex || maxZIndex + 1,
          hidden: widget.hidden !== undefined ? widget.hidden : false, // Default to visible when created
        };
        return {
          widgets: [...state.widgets, newWidget],
        };
      }),
      
      removeWidget: (id) => set((state) => ({
        widgets: state.widgets.filter(w => w.id !== id),
      })),
      
      hideWidget: (id) => set((state) => ({
        widgets: state.widgets.map(w => 
          w.id === id ? { ...w, hidden: true } : w
        ),
      })),
      
      showWidget: (id) => set((state) => {
        const widget = state.widgets.find(w => w.id === id);
        if (!widget) return state;
        
        // If widget doesn't have a position, give it one
        let updates = { hidden: false };
        if (!widget.position) {
          const visibleCount = state.widgets.filter(w => !w.hidden && w.id !== id).length;
          const cols = 3;
          const col = visibleCount % cols;
          const row = Math.floor(visibleCount / cols);
          const spacing = 20;
          const padding = 20; // Padding from edges
          
          // Set different default sizes based on widget type
          let defaultWidth, defaultHeight;
          if (widget.type === 'chart') {
            defaultWidth = getChartWidth();
            defaultHeight = 450;
          } else if (widget.type === 'table') {
            defaultWidth = 700;
            defaultHeight = 500;
          } else if (widget.type === 'websocket') {
            defaultWidth = 600;
            defaultHeight = 500;
          } else {
            // Card or default
            defaultWidth = 400;
            defaultHeight = 300;
          }
          
          // For charts, position at the left with padding and use full available width
          // For WebSocket widgets, center them on the screen
          if (widget.type === 'chart') {
            updates.position = { x: padding, y: row * (defaultHeight + spacing) + spacing };
            if (!widget.size) {
              updates.size = { width: defaultWidth, height: defaultHeight };
            }
          } else if (widget.type === 'websocket') {
            // Center WebSocket widgets on the screen
            const sidebarWidth = 256; // w-64 = 256px
            const headerHeight = 73; // Header height
            const availableWidth = typeof window !== 'undefined' ? window.innerWidth - sidebarWidth : 1200;
            const availableHeight = typeof window !== 'undefined' ? window.innerHeight - headerHeight : 800;
            
            updates.position = {
              x: sidebarWidth + (availableWidth - defaultWidth) / 2,
              y: headerHeight + (availableHeight - defaultHeight) / 2
            };
            if (!widget.size) {
              updates.size = { width: defaultWidth, height: defaultHeight };
            }
          } else {
            updates.position = {
              x: col * (defaultWidth + spacing) + spacing,
              y: row * (defaultHeight + spacing) + spacing
            };
            // Also set size if not present
            if (!widget.size) {
              updates.size = { width: defaultWidth, height: defaultHeight };
            }
          }
        }
        
        return {
          widgets: state.widgets.map(w => 
            w.id === id ? { ...w, ...updates } : w
          ),
        };
      }),
      
      updateWidget: (id, updates) => set((state) => ({
        widgets: state.widgets.map(w => 
          w.id === id ? { ...w, ...updates } : w
        ),
      })),
      
      bringToFront: (id) => set((state) => {
        const maxZIndex = state.widgets.length > 0 
          ? Math.max(...state.widgets.map(w => w.zIndex || 1))
          : 0;
        return {
          widgets: state.widgets.map(w => 
            w.id === id ? { ...w, zIndex: maxZIndex + 1 } : w
          ),
        };
      }),
      
      sendToBack: (id) => set((state) => {
        const minZIndex = state.widgets.length > 0 
          ? Math.min(...state.widgets.map(w => w.zIndex || 1))
          : 1;
        return {
          widgets: state.widgets.map(w => 
            w.id === id ? { ...w, zIndex: minZIndex - 1 } : w
          ),
        };
      }),
      
      updateLayout: (layout) => set({ layout }),
      
      setApiConfig: (config) => set({ apiConfig: config }),
      
      setTheme: (theme) => set({ theme }),
      
      // Import/Export
      exportConfig: () => {
        const state = get();
        return JSON.stringify({
          widgets: state.widgets,
          apiConfig: state.apiConfig,
        }, null, 2);
      },
      
      importConfig: (config) => {
        try {
          const parsed = JSON.parse(config);
          set({
            widgets: parsed.widgets || [],
            apiConfig: parsed.apiConfig || get().apiConfig,
          });
          return true;
        } catch (error) {
          console.error('Invalid config:', error);
          return false;
        }
      },
    }),
    {
      name: 'finboard-storage',
    }
  )
);