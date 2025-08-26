'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Plus, Edit, Trash2, Users, ChevronRight, AlertTriangle } from 'lucide-react'
import { Department } from '@/types'

interface DepartmentWithChildren extends Department {
  children: DepartmentWithChildren[]
  users: Array<{
    id: string
    name: string | null
    email: string
    role: string
  }>
  _count: {
    users: number
    children: number
  }
}

export default function CompanyPage() {
  const [departments, setDepartments] = useState<DepartmentWithChildren[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentWithChildren | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    parentId: 'null',
    isActive: true
  })

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments')
      if (response.ok) {
        const data = await response.json()
        setDepartments(data)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDepartment = async () => {
    try {
      console.log('Creating department with data:', formData)
      
      // Валидация данных перед отправкой
      if (!formData.name.trim()) {
        alert('Название отдела обязательно для заполнения')
        return
      }
      
      if (!formData.code.trim()) {
        alert('Код отдела обязателен для заполнения')
        return
      }
      
      // Преобразуем "null" в null для parentId
      const submitData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim(),
        parentId: formData.parentId === "null" ? null : formData.parentId
      }
      
      console.log('Submitting data:', submitData)
      
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      console.log('Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('Department created:', result)
        await fetchDepartments()
        setIsCreateDialogOpen(false)
        resetForm()
      } else {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        alert(errorData.error || 'Ошибка при создании отдела')
      }
    } catch (error) {
      console.error('Error creating department:', error)
      alert('Произошла ошибка при создании отдела')
    }
  }

  const handleUpdateDepartment = async () => {
    if (!selectedDepartment) return

    try {
      // Преобразуем "null" в null для parentId
      const submitData = {
        ...formData,
        parentId: formData.parentId === "null" ? null : formData.parentId
      }
      
      const response = await fetch(`/api/departments/${selectedDepartment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        await fetchDepartments()
        setIsEditDialogOpen(false)
        resetForm()
        setSelectedDepartment(null)
      }
    } catch (error) {
      console.error('Error updating department:', error)
    }
  }

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот отдел?')) return

    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchDepartments()
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка при удалении отдела')
      }
    } catch (error) {
      console.error('Error deleting department:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      parentId: 'null',
      isActive: true
    })
  }

  const openEditDialog = (department: DepartmentWithChildren) => {
    setSelectedDepartment(department)
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || '',
      parentId: department.parentId || 'null',
      isActive: department.isActive
    })
    setIsEditDialogOpen(true)
  }

  const buildDepartmentTree = (departments: DepartmentWithChildren[], parentId: string | null = null): DepartmentWithChildren[] => {
    return departments
      .filter(dept => dept.parentId === parentId)
      .map(dept => ({
        ...dept,
        children: buildDepartmentTree(departments, dept.id)
      }))
  }

  const renderDepartmentRow = (department: DepartmentWithChildren, level = 0) => [
    <TableRow key={department.id}>
      <TableCell>
        <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
          {level > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <Building2 className="h-4 w-4" />
          <span className="font-medium">{department.name}</span>
          {!department.isActive && (
            <Badge variant="secondary" className="text-xs">
              Неактивен
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{department.code}</TableCell>
      <TableCell>{department.description || '-'}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{department._count.users}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span>{department._count.children}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditDialog(department)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteDepartment(department.id)}
            disabled={department._count.users > 0 || department._count.children > 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>,
    ...department.children.map(child => 
      renderDepartmentRow(child, level + 1)
    ).flat()
  ]

  const departmentTree = buildDepartmentTree(departments)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка структуры компании...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Структура компании</h1>
          <p className="text-muted-foreground">
            Управление отделами и организационной структурой
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Создать отдел
            </Button>
          </DialogTrigger>
          <DialogContent className="adaptive-dialog max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0 pb-4 border-b">
              <DialogTitle>Создание отдела</DialogTitle>
              <DialogDescription>
                Создайте новый отдел в структуре компании
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto py-4">
              <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Название
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">
                  Код
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Описание
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="parentId" className="text-right">
                  Родительский отдел
                </Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Выберите отдел" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Без родительского отдела</SelectItem>
                    {departments
                      .filter(dept => !dept.parentId)
                      .map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 pt-4 border-t">
              <Button onClick={handleCreateDepartment}>Создать</Button>
            </DialogFooter>
          </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="structure" className="space-y-4">
        <TabsList>
          <TabsTrigger value="structure">Структура</TabsTrigger>
          <TabsTrigger value="tree">Дерево отделов</TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Отделы компании</CardTitle>
              <CardDescription>
                Список всех отделов с информацией о пользователях и подотделах
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Отдел</TableHead>
                    <TableHead>Код</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead>Пользователи</TableHead>
                    <TableHead>Подотделы</TableHead>
                    <TableHead className="w-[100px]">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentTree.map(department => renderDepartmentRow(department))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tree" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Иерархическая структура</CardTitle>
              <CardDescription>
                Визуальное представление организационной структуры компании
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentTree.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Отделы еще не созданы</p>
                    <p className="text-sm text-muted-foreground">
                      Создайте первый отдел, чтобы начать формирование структуры компании
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {departmentTree.map(department => (
                      <DepartmentTreeNode
                        key={department.id}
                        department={department}
                        onEdit={openEditDialog}
                        onDelete={handleDeleteDepartment}
                        level={0}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="adaptive-dialog max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4 border-b">
            <DialogTitle>Редактирование отдела</DialogTitle>
            <DialogDescription>
              Измените информацию об отделе
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Название
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-code" className="text-right">
                Код
              </Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Описание
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-parentId" className="text-right">
                Родительский отдел
              </Label>
              <Select
                value={formData.parentId}
                onValueChange={(value) => setFormData({ ...formData, parentId: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Выберите отдел" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Без родительского отдела</SelectItem>
                  {departments
                    .filter(dept => dept.id !== selectedDepartment?.id && !dept.parentId)
                    .map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-isActive" className="text-right">
                Статус
              </Label>
              <Select
                value={formData.isActive.toString()}
                onValueChange={(value) => setFormData({ ...formData, isActive: value === 'true' })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Активен</SelectItem>
                  <SelectItem value="false">Неактивен</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button onClick={handleUpdateDepartment}>Сохранить</Button>
          </DialogFooter>
          </div>
          </DialogContent>
      </Dialog>
    </div>
  )
}

interface DepartmentTreeNodeProps {
  department: DepartmentWithChildren
  onEdit: (department: DepartmentWithChildren) => void
  onDelete: (id: string) => void
  level: number
}

function DepartmentTreeNode({ department, onEdit, onDelete, level }: DepartmentTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const hasChildren = department.children.length > 0

  return (
    <div className="space-y-2">
      <div
        className={`flex items-center gap-3 p-3 rounded-lg border bg-card ${
          !department.isActive ? 'opacity-60' : ''
        }`}
        style={{ marginLeft: `${level * 24}px` }}
      >
        {hasChildren && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </Button>
        )}
        {!hasChildren && <div className="w-6" />}
        
        <Building2 className="h-5 w-5 text-muted-foreground" />
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{department.name}</span>
            {!department.isActive && (
              <Badge variant="secondary" className="text-xs">
                Неактивен
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {department.code} • {department._count.users} пользователей • {department._count.children} подотделов
          </div>
          {department.description && (
            <div className="text-xs text-muted-foreground mt-1">
              {department.description}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(department)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(department.id)}
            disabled={department._count.users > 0 || department._count.children > 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="space-y-2">
          {department.children.map(child => (
            <DepartmentTreeNode
              key={child.id}
              department={child}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}