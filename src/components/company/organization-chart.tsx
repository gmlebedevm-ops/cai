'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Users, 
  ChevronDown, 
  ChevronRight, 
  Plus,
  Trash2,
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { CompanyStructure, DepartmentNode } from '@/types/company'

interface OrganizationChartProps {
  data?: CompanyStructure
  onNodeClick?: (node: DepartmentNode) => void
  className?: string
}

interface TreeNodeProps {
  node: DepartmentNode
  level: number
  onNodeClick?: (node: DepartmentNode) => void
}

function TreeNode({ node, level, onNodeClick }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2) // Раскрываем первые 2 уровня по умолчанию

  const hasChildren = node.children && node.children.length > 0

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    }
    onNodeClick?.(node)
  }

  const getNodeIcon = () => {
    if (level === 0) return <Building2 className="h-5 w-5 text-blue-600" />
    if (level === 1) return <Building2 className="h-4 w-4 text-green-600" />
    return <Users className="h-4 w-4 text-gray-600" />
  }

  return (
    <div className="select-none">
      <div 
        className={`
          flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all
          hover:bg-gray-50 hover:shadow-sm
          ${level === 0 ? 'bg-blue-50 border-blue-200' : ''}
          ${level === 1 ? 'bg-green-50 border-green-200' : ''}
          ${level === 2 ? 'bg-gray-50 border-gray-200' : ''}
        `}
        onClick={handleClick}
      >
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        )}
        
        {getNodeIcon()}
        
        <div className="flex-1">
          <div className="font-medium text-sm">{node.department}</div>
          {node.parent && node.parent !== node.department && (
            <div className="text-xs text-gray-500">Подчиняется: {node.parent}</div>
          )}
        </div>
        
        {hasChildren && (
          <Badge variant="secondary" className="text-xs">
            {node.children.length}
          </Badge>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div className="ml-6 mt-2 space-y-2">
          {node.children.map((child, index) => (
            <TreeNode
              key={`${child.department}-${index}`}
              node={child}
              level={level + 1}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function OrganizationChart({ data, onNodeClick, className }: OrganizationChartProps) {
  const [selectedNode, setSelectedNode] = useState<DepartmentNode | null>(null)

  const handleNodeClick = (node: DepartmentNode) => {
    setSelectedNode(node)
    onNodeClick?.(node)
  }

  if (!data) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Нет данных о структуре компании</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Организационная структура
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Корневой узел */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="h-6 w-6 text-blue-600" />
                <div>
                  <div className="font-semibold text-lg">{data.root_node}</div>
                  <div className="text-sm text-blue-600">Руководство компании</div>
                </div>
                <Badge variant="outline" className="ml-auto">
                  {data.children.length} подразделений
                </Badge>
              </div>
            </div>

            {/* Дочерние узлы */}
            <div className="space-y-3">
              {data.children.map((child, index) => (
                <TreeNode
                  key={`${child.department}-${index}`}
                  node={child}
                  level={1}
                  onNodeClick={handleNodeClick}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Информация о выбранном узле */}
      {selectedNode && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Информация о подразделении</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Название</label>
                <p className="mt-1 text-sm text-gray-900">{selectedNode.department}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Родительское подразделение</label>
                <p className="mt-1 text-sm text-gray-900">{selectedNode.parent}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Количество дочерних подразделений</label>
                <p className="mt-1 text-sm text-gray-900">{selectedNode.children.length}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Уровень в иерархии</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedNode.parent === data.root_node ? '1' : '2+'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}