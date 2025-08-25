'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { User, Building2, Edit, Save, X } from 'lucide-react'
import { Department } from '@/types'

interface UserDepartmentAssignmentProps {
  userId: string
  userName: string
  userEmail: string
  currentDepartment?: Department | null
  departments: Department[]
  onAssign: (userId: string, departmentId: string | null) => Promise<void>
  compact?: boolean  // Добавляем флаг для компактного режима
}

export function UserDepartmentAssignment({
  userId,
  userName,
  userEmail,
  currentDepartment,
  departments,
  onAssign,
  compact = false  // По умолчанию используем полный режим
}: UserDepartmentAssignmentProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(
    currentDepartment?.id || 'null'
  )
  const [isUpdating, setIsUpdating] = useState(false)

  const handleAssign = async () => {
    setIsUpdating(true)
    try {
      await onAssign(userId, selectedDepartmentId === "null" ? null : selectedDepartmentId)
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error assigning department:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const buildDepartmentOptions = (departments: Department[], parentId: string | null = null, level = 0): JSX.Element[] => {
    const filteredDepts = departments.filter(dept => dept.parentId === parentId)
    
    return filteredDepts.flatMap(dept => [
      <SelectItem key={dept.id} value={dept.id}>
        {'  '.repeat(level)}{dept.name}
      </SelectItem>,
      ...buildDepartmentOptions(departments, dept.id, level + 1)
    ])
  }

  return (
    compact ? (
      // Компактный режим для использования в таблице
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Building2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Назначение отдела</DialogTitle>
            <DialogDescription>
              Выберите отдел для пользователя {userName || userEmail}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Отдел
              </Label>
              <Select
                value={selectedDepartmentId}
                onValueChange={setSelectedDepartmentId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Выберите отдел" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Без отдела</SelectItem>
                  {buildDepartmentOptions(departments)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Отмена
            </Button>
            <Button onClick={handleAssign} disabled={isUpdating}>
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ) : (
      // Полный режим для отдельного использования
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          <User className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="font-medium">{userName || 'Без имени'}</div>
            <div className="text-sm text-muted-foreground">{userEmail}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {currentDepartment ? (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">
                {currentDepartment.name}
              </Badge>
            </div>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Без отдела
            </Badge>
          )}
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Изменить
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Назначение отдела</DialogTitle>
                <DialogDescription>
                  Выберите отдел для пользователя {userName || userEmail}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="department" className="text-right">
                    Отдел
                  </Label>
                  <Select
                    value={selectedDepartmentId}
                    onValueChange={setSelectedDepartmentId}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Выберите отдел" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">Без отдела</SelectItem>
                      {buildDepartmentOptions(departments)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Отмена
                </Button>
                <Button onClick={handleAssign} disabled={isUpdating}>
                  <Save className="h-4 w-4 mr-2" />
                  {isUpdating ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    )
  )
}

interface DepartmentUsersListProps {
  department: Department
  users: Array<{
    id: string
    name: string | null
    email: string
    role: string
    department?: Department | null
  }>
  onUnassign: (userId: string) => Promise<void>
}

export function DepartmentUsersList({
  department,
  users,
  onUnassign
}: DepartmentUsersListProps) {
  const departmentUsers = users.filter(user => user.department?.id === department.id)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {department.name}
          <Badge variant="secondary" className="ml-auto">
            {departmentUsers.length} пользователей
          </Badge>
        </CardTitle>
        <CardDescription>
          {department.code} • {department.description || 'Без описания'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {departmentUsers.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            В этом отделе нет пользователей
          </div>
        ) : (
          <div className="space-y-2">
            {departmentUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">{user.name || 'Без имени'}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUnassign(user.id)}
                >
                  Убрать из отдела
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface DepartmentSelectProps {
  value: string | null
  onValueChange: (value: string | null) => void
  departments: Department[]
  placeholder?: string
  className?: string
}

export function DepartmentSelect({
  value,
  onValueChange,
  departments,
  placeholder = "Выберите отдел",
  className
}: DepartmentSelectProps) {
  const buildDepartmentOptions = (departments: Department[], parentId: string | null = null, level = 0): JSX.Element[] => {
    const filteredDepts = departments.filter(dept => dept.parentId === parentId)
    
    return filteredDepts.flatMap(dept => [
      <SelectItem key={dept.id} value={dept.id}>
        {'  '.repeat(level)}{dept.name}
      </SelectItem>,
      ...buildDepartmentOptions(departments, dept.id, level + 1)
    ])
  }

  return (
    <Select value={value || 'null'} onValueChange={(val) => onValueChange(val === 'null' ? null : val)}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="null">Без отдела</SelectItem>
        {buildDepartmentOptions(departments)}
      </SelectContent>
    </Select>
  )
}