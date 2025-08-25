// Export utilities for reports

export interface ExportData {
  type: 'excel' | 'pdf'
  data: any
  filename: string
  title: string
}

export function exportToExcel(data: ExportData): void {
  // This is a placeholder implementation
  // In a real application, you would use a library like xlsx or exceljs
  
  console.log('Exporting to Excel:', data)
  
  // Create a simple CSV format as fallback
  const csvContent = convertToCSV(data.data)
  downloadFile(csvContent, `${data.filename}.csv`, 'text/csv')
}

export function exportToPDF(data: ExportData): void {
  // This is a placeholder implementation
  // In a real application, you would use a library like jsPDF or Puppeteer
  
  console.log('Exporting to PDF:', data)
  
  // Create a simple HTML content as fallback
  const htmlContent = convertToHTML(data)
  downloadFile(htmlContent, `${data.filename}.html`, 'text/html')
}

function convertToCSV(data: any): string {
  if (!data || typeof data !== 'object') return ''
  
  // Handle different data structures
  if (Array.isArray(data)) {
    if (data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ]
    
    return csvRows.join('\n')
  }
  
  // Handle object with overview data
  const rows = []
  for (const [key, value] of Object.entries(data)) {
    rows.push(`${key},${value}`)
  }
  
  return rows.join('\n')
}

function convertToHTML(data: ExportData): string {
  const { title, data: reportData } = data
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .metric { margin: 10px 0; }
        .metric-label { font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p>Сгенерировано: ${new Date().toLocaleString('ru-RU')}</p>
  `
  
  // Add overview metrics
  if (reportData.overview) {
    html += '<h2>Обзор</h2>'
    for (const [key, value] of Object.entries(reportData.overview)) {
      const label = formatMetricLabel(key)
      html += `<div class="metric"><span class="metric-label">${label}:</span> ${value}</div>`
    }
  }
  
  // Add department statistics
  if (reportData.departmentStats) {
    html += '<h2>Статистика по отделам</h2>'
    html += '<table>'
    html += '<tr><th>Отдел</th><th>Всего</th><th>Согласовано</th><th>Отклонено</th><th>Среднее время</th></tr>'
    
    reportData.departmentStats.forEach((dept: any) => {
      html += `<tr>
        <td>${dept.name}</td>
        <td>${dept.total}</td>
        <td>${dept.approved}</td>
        <td>${dept.rejected}</td>
        <td>${dept.avgTime} дней</td>
      </tr>`
    })
    
    html += '</table>'
  }
  
  // Add approver workload
  if (reportData.approverWorkload) {
    html += '<h2>Нагрузка на согласующих</h2>'
    html += '<table>'
    html += '<tr><th>Имя</th><th>Роль</th><th>На согласовании</th><th>Завершено</th><th>Среднее время</th></tr>'
    
    reportData.approverWorkload.forEach((approver: any) => {
      html += `<tr>
        <td>${approver.name}</td>
        <td>${approver.role}</td>
        <td>${approver.pending}</td>
        <td>${approver.completed}</td>
        <td>${approver.avgTime} дней</td>
      </tr>`
    })
    
    html += '</table>'
  }
  
  html += `
    </body>
    </html>
  `
  
  return html
}

function formatMetricLabel(key: string): string {
  const labels: { [key: string]: string } = {
    totalContracts: 'Всего договоров',
    inReview: 'На согласовании',
    approved: 'Согласовано',
    rejected: 'Отклонено',
    avgApprovalTime: 'Среднее время согласования',
    overdueApprovals: 'Просрочено согласований',
    completionRate: 'Процент завершения'
  }
  
  return labels[key] || key
}

function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Helper function to prepare data for export
export function prepareExportData(
  data: any, 
  reportType: 'dashboard' | 'timelines' | 'statistics'
): ExportData {
  const timestamp = new Date().toISOString().split('T')[0]
  
  switch (reportType) {
    case 'dashboard':
      return {
        type: 'excel',
        data: {
          overview: data.overview,
          departmentStats: data.departmentStats,
          approverWorkload: data.approverWorkload,
          kpiData: data.kpiData
        },
        filename: `dashboard_report_${timestamp}`,
        title: 'Аналитическая панель - Отчет'
      }
      
    case 'timelines':
      return {
        type: 'excel',
        data: {
          summary: data.summary,
          timelineData: data.timelineData,
          bottlenecks: data.bottlenecks
        },
        filename: `timelines_report_${timestamp}`,
        title: 'Анализ сроков согласования - Отчет'
      }
      
    case 'statistics':
      return {
        type: 'excel',
        data: {
          overview: data.overview,
          departmentDetails: data.departmentDetails,
          performanceMetrics: data.performanceMetrics,
          workloadDistribution: data.workloadDistribution
        },
        filename: `statistics_report_${timestamp}`,
        title: 'Статистика по отделам - Отчет'
      }
      
    default:
      return {
        type: 'excel',
        data: data,
        filename: `report_${timestamp}`,
        title: 'Отчет'
      }
  }
}