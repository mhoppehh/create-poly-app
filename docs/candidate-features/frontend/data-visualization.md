# Data Visualization

## Overview

Comprehensive data visualization system with interactive charts, dashboards, real-time updates, and customizable visualization components for React applications.

## Priority

**MEDIUM** - Important for data-driven applications and analytics dashboards

## Dependencies

- `vite` (React application base)
- `tailwind` (styling foundation)
- `ui-component-library` (UI components)

## Feature Description

Advanced data visualization infrastructure providing interactive charts, real-time dashboards, customizable visualizations, and comprehensive analytics tools for creating compelling data-driven user interfaces.

### Key Features

- **Chart Library Integration**: Recharts, D3.js, Chart.js, or Victory support
- **Interactive Charts**: Zoom, pan, hover effects, click events, brushing
- **Real-Time Updates**: Live data streaming, WebSocket integration, automatic refresh
- **Dashboard System**: Drag-and-drop layout, widget system, customizable views
- **Export Capabilities**: PNG, SVG, PDF export, data export to CSV/JSON
- **Responsive Design**: Mobile-optimized charts, adaptive layouts
- **Performance Optimization**: Virtual scrolling, data sampling, lazy loading

## Configuration

```typescript
interface DataVisualizationConfig {
  library: 'recharts' | 'd3' | 'chart.js' | 'victory' | 'visx'
  theme: {
    colorPalette: string[]
    fontFamily: string
    animations: boolean
    darkMode: boolean
  }
  charts: {
    responsive: boolean
    animations: boolean
    tooltips: boolean
    legends: boolean
    grid: boolean
  }
  dashboard: {
    draggable: boolean
    resizable: boolean
    persistent: boolean
    exportable: boolean
  }
  performance: {
    virtualScrolling: boolean
    dataSampling: number
    lazyLoading: boolean
    memoization: boolean
  }
  realTime: {
    enabled: boolean
    updateInterval: number
    maxDataPoints: number
    bufferSize: number
  }
}
```

## Generated Files

### Data Visualization Structure

```
web/src/
├── visualization/
│   ├── index.ts                      # Visualization exports
│   ├── components/
│   │   ├── charts/
│   │   │   ├── LineChart.tsx         # Line chart component
│   │   │   ├── BarChart.tsx          # Bar chart component
│   │   │   ├── PieChart.tsx          # Pie chart component
│   │   │   ├── AreaChart.tsx         # Area chart component
│   │   │   ├── ScatterChart.tsx      # Scatter plot component
│   │   │   ├── Histogram.tsx         # Histogram component
│   │   │   ├── HeatMap.tsx           # Heat map component
│   │   │   ├── TreeMap.tsx           # Tree map component
│   │   │   ├── RadialChart.tsx       # Radial/polar chart
│   │   │   ├── Gauge.tsx             # Gauge/speedometer
│   │   │   ├── Funnel.tsx            # Funnel chart
│   │   │   └── index.ts
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx         # Main dashboard container
│   │   │   ├── DashboardGrid.tsx     # Draggable grid layout
│   │   │   ├── Widget.tsx            # Dashboard widget wrapper
│   │   │   ├── WidgetLibrary.tsx     # Widget selection panel
│   │   │   ├── DashboardControls.tsx # Dashboard controls
│   │   │   └── index.ts
│   │   ├── interactive/
│   │   │   ├── ZoomableChart.tsx     # Chart with zoom/pan
│   │   │   ├── BrushChart.tsx        # Chart with brush selection
│   │   │   ├── CrossfilterChart.tsx  # Linked charts
│   │   │   ├── AnimatedChart.tsx     # Animated transitions
│   │   │   └── index.ts
│   │   ├── realtime/
│   │   │   ├── RealTimeChart.tsx     # Real-time data chart
│   │   │   ├── StreamingChart.tsx    # Streaming data component
│   │   │   ├── LiveDashboard.tsx     # Live dashboard
│   │   │   └── index.ts
│   │   └── export/
│   │       ├── ExportButton.tsx      # Export functionality
│   │       ├── ChartExporter.tsx     # Chart export utilities
│   │       └── index.ts
│   ├── hooks/
│   │   ├── useChart.ts               # Chart configuration hook
│   │   ├── useRealTimeData.ts        # Real-time data hook
│   │   ├── useDashboard.ts           # Dashboard state hook
│   │   ├── useChartExport.ts         # Chart export hook
│   │   ├── useDataTransform.ts       # Data transformation hook
│   │   └── useChartInteraction.ts    # Chart interaction hook
│   ├── utils/
│   │   ├── dataTransforms.ts         # Data transformation utilities
│   │   ├── colorPalettes.ts          # Color palette definitions
│   │   ├── chartUtils.ts             # Chart utility functions
│   │   ├── exportUtils.ts            # Export utility functions
│   │   ├── formatters.ts             # Data formatters
│   │   └── performance.ts            # Performance optimizations
│   ├── types/
│   │   ├── chart.ts                  # Chart type definitions
│   │   ├── dashboard.ts              # Dashboard types
│   │   ├── data.ts                   # Data structure types
│   │   └── export.ts                 # Export types
│   ├── providers/
│   │   ├── ChartThemeProvider.tsx    # Chart theming context
│   │   ├── DashboardProvider.tsx     # Dashboard state context
│   │   └── DataProvider.tsx          # Data context
│   └── examples/
│       ├── SalesAnalytics.tsx        # Sales analytics example
│       ├── UserMetrics.tsx           # User metrics dashboard
│       ├── RealTimeMonitoring.tsx    # Real-time monitoring
│       └── CustomDashboard.tsx       # Custom dashboard example
```

## Code Examples

### Line Chart Component

```typescript
// web/src/visualization/components/charts/LineChart.tsx
import React, { useMemo } from 'react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { cn } from '../../../utils/cn'

export interface LineChartProps {
  data: any[]
  dataKey: string
  xAxisKey: string
  width?: number
  height?: number
  color?: string
  strokeWidth?: number
  dot?: boolean
  grid?: boolean
  tooltip?: boolean
  legend?: boolean
  animations?: boolean
  className?: string
  onPointClick?: (data: any, index: number) => void
  onPointHover?: (data: any, index: number) => void
  formatXAxis?: (value: any) => string
  formatYAxis?: (value: any) => string
  formatTooltip?: (value: any, name: string) => [any, string]
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  dataKey,
  xAxisKey,
  width,
  height = 400,
  color = '#8884d8',
  strokeWidth = 2,
  dot = true,
  grid = true,
  tooltip = true,
  legend = false,
  animations = true,
  className,
  onPointClick,
  onPointHover,
  formatXAxis,
  formatYAxis,
  formatTooltip,
}) => {
  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return []
    return data.filter(item => item != null)
  }, [data])

  const handlePointClick = (data: any, index: number) => {
    onPointClick?.(data, index)
  }

  const handlePointHover = (data: any, index: number) => {
    onPointHover?.(data, index)
  }

  if (chartData.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center border rounded-lg", className)}
        style={{ height }}
      >
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width={width || '100%'} height={height}>
        <RechartsLineChart
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          {grid && (
            <CartesianGrid
              strokeDasharray="3 3"
              className="opacity-30"
            />
          )}

          <XAxis
            dataKey={xAxisKey}
            tickFormatter={formatXAxis}
            className="text-sm"
          />

          <YAxis
            tickFormatter={formatYAxis}
            className="text-sm"
          />

          {tooltip && (
            <Tooltip
              formatter={formatTooltip}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
          )}

          {legend && <Legend />}

          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={strokeWidth}
            dot={dot}
            activeDot={{
              r: 6,
              onClick: handlePointClick,
              onMouseEnter: handlePointHover
            }}
            isAnimationActive={animations}
            animationDuration={1000}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Multi-line chart variant
export interface MultiLineChartProps {
  data: any[]
  lines: Array<{
    dataKey: string
    name: string
    color: string
    strokeWidth?: number
    dot?: boolean
  }>
  xAxisKey: string
  width?: number
  height?: number
  grid?: boolean
  tooltip?: boolean
  legend?: boolean
  animations?: boolean
  className?: string
  formatXAxis?: (value: any) => string
  formatYAxis?: (value: any) => string
}

export const MultiLineChart: React.FC<MultiLineChartProps> = ({
  data,
  lines,
  xAxisKey,
  width,
  height = 400,
  grid = true,
  tooltip = true,
  legend = true,
  animations = true,
  className,
  formatXAxis,
  formatYAxis,
}) => {
  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return []
    return data.filter(item => item != null)
  }, [data])

  if (chartData.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center border rounded-lg", className)}
        style={{ height }}
      >
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width={width || '100%'} height={height}>
        <RechartsLineChart
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          {grid && (
            <CartesianGrid
              strokeDasharray="3 3"
              className="opacity-30"
            />
          )}

          <XAxis
            dataKey={xAxisKey}
            tickFormatter={formatXAxis}
            className="text-sm"
          />

          <YAxis
            tickFormatter={formatYAxis}
            className="text-sm"
          />

          {tooltip && (
            <Tooltip
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
          )}

          {legend && <Legend />}

          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={line.strokeWidth || 2}
              dot={line.dot ?? true}
              isAnimationActive={animations}
              animationDuration={1000}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### Dashboard Component

```typescript
// web/src/visualization/components/dashboard/Dashboard.tsx
import React, { useState, useCallback } from 'react'
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import { Widget } from './Widget'
import { DashboardControls } from './DashboardControls'
import { WidgetLibrary } from './WidgetLibrary'
import { useDashboard } from '../../hooks/useDashboard'
import { cn } from '../../../utils/cn'

// Import CSS for react-grid-layout
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

export interface DashboardWidget {
  id: string
  type: string
  title: string
  config: any
  layout: {
    x: number
    y: number
    w: number
    h: number
  }
}

export interface DashboardProps {
  widgets: DashboardWidget[]
  editable?: boolean
  className?: string
  onWidgetAdd?: (widget: DashboardWidget) => void
  onWidgetUpdate?: (id: string, updates: Partial<DashboardWidget>) => void
  onWidgetDelete?: (id: string) => void
  onLayoutChange?: (layout: Layout[]) => void
}

export const Dashboard: React.FC<DashboardProps> = ({
  widgets,
  editable = false,
  className,
  onWidgetAdd,
  onWidgetUpdate,
  onWidgetDelete,
  onLayoutChange,
}) => {
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false)
  const { exportDashboard, importDashboard } = useDashboard()

  const layouts = {
    lg: widgets.map(widget => ({
      i: widget.id,
      x: widget.layout.x,
      y: widget.layout.y,
      w: widget.layout.w,
      h: widget.layout.h,
    })),
    md: widgets.map(widget => ({
      i: widget.id,
      x: widget.layout.x,
      y: widget.layout.y,
      w: Math.min(widget.layout.w, 8),
      h: widget.layout.h,
    })),
    sm: widgets.map(widget => ({
      i: widget.id,
      x: 0,
      y: widget.layout.y,
      w: 6,
      h: widget.layout.h,
    })),
    xs: widgets.map(widget => ({
      i: widget.id,
      x: 0,
      y: widget.layout.y,
      w: 4,
      h: widget.layout.h,
    })),
  }

  const handleLayoutChange = useCallback((layout: Layout[], layouts: any) => {
    if (!editable) return

    const updatedWidgets = widgets.map(widget => {
      const layoutItem = layout.find(item => item.i === widget.id)
      if (layoutItem) {
        return {
          ...widget,
          layout: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          }
        }
      }
      return widget
    })

    onLayoutChange?.(layout)
  }, [widgets, editable, onLayoutChange])

  const handleWidgetUpdate = useCallback((id: string, updates: Partial<DashboardWidget>) => {
    onWidgetUpdate?.(id, updates)
  }, [onWidgetUpdate])

  const handleWidgetDelete = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this widget?')) {
      onWidgetDelete?.(id)
    }
  }, [onWidgetDelete])

  const handleAddWidget = useCallback((widgetType: string) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      type: widgetType,
      title: `New ${widgetType}`,
      config: {},
      layout: {
        x: 0,
        y: 0,
        w: 4,
        h: 4,
      }
    }

    onWidgetAdd?.(newWidget)
    setShowWidgetLibrary(false)
  }, [onWidgetAdd])

  return (
    <div className={cn("dashboard-container", className)}>
      {/* Dashboard Controls */}
      {editable && (
        <DashboardControls
          onAddWidget={() => setShowWidgetLibrary(true)}
          onExport={() => exportDashboard(widgets)}
          onImport={importDashboard}
        />
      )}

      {/* Widget Library Modal */}
      {showWidgetLibrary && (
        <WidgetLibrary
          isOpen={showWidgetLibrary}
          onClose={() => setShowWidgetLibrary(false)}
          onSelectWidget={handleAddWidget}
        />
      )}

      {/* Dashboard Grid */}
      <ResponsiveGridLayout
        className="dashboard-grid"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        isDraggable={editable}
        isResizable={editable}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
        rowHeight={60}
        margin={[16, 16]}
        containerPadding={[16, 16]}
        useCSSTransforms={true}
      >
        {widgets.map((widget) => (
          <div key={widget.id}>
            <Widget
              widget={widget}
              editable={editable}
              onUpdate={(updates) => handleWidgetUpdate(widget.id, updates)}
              onDelete={() => handleWidgetDelete(widget.id)}
            />
          </div>
        ))}
      </ResponsiveGridLayout>

      {widgets.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-xl text-muted-foreground mb-4">No widgets added yet</p>
          {editable && (
            <button
              onClick={() => setShowWidgetLibrary(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Add Your First Widget
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

### Real-Time Chart Component

```typescript
// web/src/visualization/components/realtime/RealTimeChart.tsx
import React, { useEffect, useRef } from 'react'
import { LineChart } from '../charts/LineChart'
import { useRealTimeData } from '../../hooks/useRealTimeData'

export interface RealTimeChartProps {
  endpoint: string
  dataKey: string
  xAxisKey: string
  updateInterval?: number
  maxDataPoints?: number
  height?: number
  className?: string
  onDataUpdate?: (data: any[]) => void
  formatters?: {
    xAxis?: (value: any) => string
    yAxis?: (value: any) => string
    tooltip?: (value: any, name: string) => [any, string]
  }
}

export const RealTimeChart: React.FC<RealTimeChartProps> = ({
  endpoint,
  dataKey,
  xAxisKey,
  updateInterval = 1000,
  maxDataPoints = 50,
  height = 400,
  className,
  onDataUpdate,
  formatters,
}) => {
  const {
    data,
    isConnected,
    error,
    connect,
    disconnect
  } = useRealTimeData({
    endpoint,
    updateInterval,
    maxDataPoints,
  })

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  useEffect(() => {
    if (data.length > 0) {
      onDataUpdate?.(data)
    }
  }, [data, onDataUpdate])

  const connectionIndicator = (
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-2 h-2 rounded-full ${
        isConnected ? 'bg-green-500' : error ? 'bg-red-500' : 'bg-yellow-500'
      }`} />
      <span className="text-sm text-muted-foreground">
        {isConnected ? 'Connected' : error ? `Error: ${error}` : 'Connecting...'}
      </span>
    </div>
  )

  return (
    <div className={className}>
      {connectionIndicator}

      <LineChart
        data={data}
        dataKey={dataKey}
        xAxisKey={xAxisKey}
        height={height}
        animations={false} // Disable animations for real-time
        formatXAxis={formatters?.xAxis}
        formatYAxis={formatters?.yAxis}
        formatTooltip={formatters?.tooltip}
      />

      <div className="mt-2 text-xs text-muted-foreground">
        Data points: {data.length} / {maxDataPoints} |
        Update interval: {updateInterval}ms
      </div>
    </div>
  )
}
```

### Data Transformation Hook

```typescript
// web/src/visualization/hooks/useDataTransform.ts
import { useMemo } from 'react'

export interface DataTransformOptions {
  groupBy?: string
  aggregateBy?: 'sum' | 'average' | 'count' | 'min' | 'max'
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filterBy?: (item: any) => boolean
  dateRange?: {
    start?: Date
    end?: Date
    dateKey: string
  }
  limit?: number
}

export function useDataTransform(data: any[], options: DataTransformOptions = {}) {
  const transformedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return []

    let result = [...data]

    // Filter by date range
    if (options.dateRange) {
      const { start, end, dateKey } = options.dateRange
      result = result.filter(item => {
        const itemDate = new Date(item[dateKey])
        if (start && itemDate < start) return false
        if (end && itemDate > end) return false
        return true
      })
    }

    // Apply custom filter
    if (options.filterBy) {
      result = result.filter(options.filterBy)
    }

    // Group by field
    if (options.groupBy) {
      const grouped = result.reduce(
        (acc, item) => {
          const groupKey = item[options.groupBy!]
          if (!acc[groupKey]) {
            acc[groupKey] = []
          }
          acc[groupKey].push(item)
          return acc
        },
        {} as Record<string, any[]>,
      )

      // Aggregate grouped data
      if (options.aggregateBy) {
        result = Object.entries(grouped).map(([key, items]) => {
          const aggregated = { [options.groupBy!]: key }

          // Get all numeric fields for aggregation
          const numericFields = Object.keys(items[0] || {}).filter(
            field => field !== options.groupBy && typeof items[0][field] === 'number',
          )

          numericFields.forEach(field => {
            const values = items.map(item => item[field]).filter(val => typeof val === 'number')

            switch (options.aggregateBy) {
              case 'sum':
                aggregated[field] = values.reduce((sum, val) => sum + val, 0)
                break
              case 'average':
                aggregated[field] = values.reduce((sum, val) => sum + val, 0) / values.length
                break
              case 'count':
                aggregated[field] = values.length
                break
              case 'min':
                aggregated[field] = Math.min(...values)
                break
              case 'max':
                aggregated[field] = Math.max(...values)
                break
              default:
                aggregated[field] = values[0]
            }
          })

          return aggregated
        })
      } else {
        // Just return the first item from each group
        result = Object.entries(grouped).map(([key, items]) => ({
          [options.groupBy!]: key,
          count: items.length,
          ...items[0],
        }))
      }
    }

    // Sort data
    if (options.sortBy) {
      result.sort((a, b) => {
        const aVal = a[options.sortBy!]
        const bVal = b[options.sortBy!]

        let comparison = 0
        if (aVal < bVal) comparison = -1
        if (aVal > bVal) comparison = 1

        return options.sortOrder === 'desc' ? -comparison : comparison
      })
    }

    // Limit results
    if (options.limit && options.limit > 0) {
      result = result.slice(0, options.limit)
    }

    return result
  }, [data, options])

  // Calculate basic statistics
  const statistics = useMemo(() => {
    if (!Array.isArray(transformedData) || transformedData.length === 0) {
      return { count: 0 }
    }

    const numericFields = Object.keys(transformedData[0] || {}).filter(
      field => typeof transformedData[0][field] === 'number',
    )

    const stats = { count: transformedData.length } as any

    numericFields.forEach(field => {
      const values = transformedData.map(item => item[field]).filter(val => typeof val === 'number')

      if (values.length > 0) {
        stats[field] = {
          min: Math.min(...values),
          max: Math.max(...values),
          sum: values.reduce((sum, val) => sum + val, 0),
          average: values.reduce((sum, val) => sum + val, 0) / values.length,
          count: values.length,
        }
      }
    })

    return stats
  }, [transformedData])

  return {
    data: transformedData,
    statistics,
    isEmpty: transformedData.length === 0,
    count: transformedData.length,
  }
}

// Usage example hook for common data transformations
export function useSalesAnalytics(salesData: any[]) {
  const dailySales = useDataTransform(salesData, {
    groupBy: 'date',
    aggregateBy: 'sum',
    sortBy: 'date',
    sortOrder: 'asc',
  })

  const monthlySales = useDataTransform(salesData, {
    groupBy: 'month',
    aggregateBy: 'sum',
    sortBy: 'month',
    sortOrder: 'asc',
  })

  const topProducts = useDataTransform(salesData, {
    groupBy: 'product',
    aggregateBy: 'sum',
    sortBy: 'revenue',
    sortOrder: 'desc',
    limit: 10,
  })

  const recentSales = useDataTransform(salesData, {
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      dateKey: 'date',
    },
    sortBy: 'date',
    sortOrder: 'desc',
    limit: 50,
  })

  return {
    dailySales,
    monthlySales,
    topProducts,
    recentSales,
  }
}
```

### Export Utilities

```typescript
// web/src/visualization/utils/exportUtils.ts
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export interface ExportOptions {
  filename?: string
  format: 'png' | 'jpeg' | 'svg' | 'pdf' | 'csv' | 'json'
  quality?: number
  scale?: number
}

export async function exportChart(element: HTMLElement, options: ExportOptions): Promise<void> {
  const { filename = 'chart', format, quality = 1, scale = 2 } = options

  try {
    switch (format) {
      case 'png':
      case 'jpeg':
        await exportAsImage(element, { filename, format, quality, scale })
        break
      case 'pdf':
        await exportAsPDF(element, { filename, scale })
        break
      case 'svg':
        await exportAsSVG(element, filename)
        break
      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  } catch (error) {
    console.error('Export failed:', error)
    throw error
  }
}

async function exportAsImage(
  element: HTMLElement,
  options: { filename: string; format: 'png' | 'jpeg'; quality: number; scale: number },
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: options.scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
  })

  const link = document.createElement('a')
  link.download = `${options.filename}.${options.format}`
  link.href = canvas.toDataURL(`image/${options.format}`, options.quality)
  link.click()
}

async function exportAsPDF(element: HTMLElement, options: { filename: string; scale: number }): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: options.scale,
    useCORS: true,
    allowTaint: true,
  })

  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height],
  })

  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height)
  pdf.save(`${options.filename}.pdf`)
}

async function exportAsSVG(element: HTMLElement, filename: string): Promise<void> {
  const svgElement = element.querySelector('svg')
  if (!svgElement) {
    throw new Error('No SVG element found in the chart')
  }

  const svgData = new XMLSerializer().serializeToString(svgElement)
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })

  const link = document.createElement('a')
  link.download = `${filename}.svg`
  link.href = URL.createObjectURL(svgBlob)
  link.click()

  URL.revokeObjectURL(link.href)
}

export function exportData(data: any[], options: { filename: string; format: 'csv' | 'json' }): void {
  const { filename, format } = options

  try {
    switch (format) {
      case 'csv':
        exportAsCSV(data, filename)
        break
      case 'json':
        exportAsJSON(data, filename)
        break
      default:
        throw new Error(`Unsupported data format: ${format}`)
    }
  } catch (error) {
    console.error('Data export failed:', error)
    throw error
  }
}

function exportAsCSV(data: any[], filename: string): void {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No data to export')
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header]
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        .join(','),
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.download = `${filename}.csv`
  link.href = URL.createObjectURL(blob)
  link.click()

  URL.revokeObjectURL(link.href)
}

function exportAsJSON(data: any[], filename: string): void {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })

  const link = document.createElement('a')
  link.download = `${filename}.json`
  link.href = URL.createObjectURL(blob)
  link.click()

  URL.revokeObjectURL(link.href)
}
```

## Installation Steps

1. **Install Visualization Dependencies**

   ```bash
   # Recharts (recommended for React)
   pnpm add recharts

   # D3.js (for advanced custom visualizations)
   pnpm add d3 @types/d3

   # Dashboard and layout
   pnpm add react-grid-layout

   # Export functionality
   pnpm add html2canvas jspdf
   ```

2. **Install Additional Utilities**

   ```bash
   # Date handling
   pnpm add date-fns

   # Color palettes and utilities
   pnpm add chroma-js @types/chroma-js
   ```

3. **Setup CSS for Grid Layout**
   ```bash
   # Ensure proper CSS imports for react-grid-layout
   # (included in component examples above)
   ```

This data visualization system provides comprehensive charting, dashboards, real-time updates, and export capabilities for creating compelling data-driven React applications.
