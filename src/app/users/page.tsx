'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Mail, 
  Calendar,
  FileText,
  MessageSquare,
  CheckCircle,
  UserCheck,
  User as UserIcon,
  Building2,
  Shield,
  Activity
} from 'lucide-react'
import { Department } from '@/types'
import { User as UserType, UserRole } from '@/types/contract'

interface UserWithStats extends UserType {
  _count: {
    contracts: number
    comments: number
    approvals: number
  }
  userRole?: {
    id: string
    name: string
    description?: string
  }
  roleId?: string
  departmentId?: string
  department?: {
    id: string
    name: string
  }
}

interface Role {
  id: string
  name: string
  description?: string
  isActive: boolean
}

interface UsersResponse {
  users: UserWithStats[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState<Department[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  
  // Форма создания/редактирования
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithStats | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    roleId: '',
    departmentId: 'null' as string | null
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles-management')
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles)
      } else {
        console.error('Failed to fetch roles:', response.status)
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments')
      if (response.ok) {
        const data = await response.json()
        setDepartments(data)
      } else {
        console.error('Failed to fetch departments:', response.status)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        role: roleFilter
      })

      const response = await fetch(`/api/users?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Ошибка при загрузке пользователей')
      }
      
      const data: UsersResponse = await response.json()
      console.log('Users data loaded:', data)
      setUsers(data.users)
      setTotalPages(data.pagination.pages)
      setTotalUsers(data.pagination.total)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchDepartments()
    fetchRoles()
  }, [currentPage, searchTerm, roleFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'

      // Подготавливаем данные для отправки
      const submitData = {
        email: formData.email,
        name: formData.name,
        roleId: formData.roleId,
        departmentId: formData.departmentId === 'null' ? null : formData.departmentId
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        await fetchUsers()
        setIsDialogOpen(false)
        resetForm()
      } else {
        const data = await response.json()
        setError(data.error || 'Произошла ошибка')
      }
    } catch (error) {
      console.error('Error submitting user:', error)
      setError('Произошла ошибка при сохранении')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (user: UserWithStats) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      name: user.name || '',
      roleId: user.roleId || user.userRole?.id || '',
      departmentId: user.department?.id || 'null'
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchUsers()
      } else {
        const data = await response.json()
        setError(data.error || 'Ошибка при удалении пользователя')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      setError('Произошла ошибка при удалении')
    }
  }

  const resetForm = () => {
    setEditingUser(null)
    setFormData({
      email: '',
      name: '',
      roleId: '',
      departmentId: 'null'
    })
    setError('')
  }

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case 'Администратор':
        return 'destructive'
      case 'Генеральный директор':
        return 'default'
      case 'Главный юрист':
        return 'secondary'
      case 'Руководитель отдела':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      {/* Заголовок страницы */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Управление пользователями</h1>
          <p className="text-muted-foreground">
            Управление пользователями и их ролями в системе • Всего: {totalUsers}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Новый пользователь
            </Button>
          </DialogTrigger>
          <DialogContent className="adaptive-dialog max-h-[90vh] overflow-hidden flex flex-col">
            <form onSubmit={handleSubmit}>
              <DialogHeader className="flex-shrink-0 pb-4 border-b">
                <DialogTitle className="flex items-center gap-2">
                  {editingUser ? (
                    <>
                      <Edit className="h-5 w-5" />
                      Редактирование пользователя
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Создание пользователя
                    </>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {editingUser 
                    ? 'Измените данные пользователя и сохраните изменения'
                    : 'Заполните форму для создания нового пользователя'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {editingUser && (
                  <Card className="bg-muted/50 py-2">
                  <CardContent className="pt-1 pb-1">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <span className="text-muted-foreground">Создан:</span>
                        <span className="font-medium">{new Date(editingUser.createdAt).toLocaleDateString('ru-RU')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-muted-foreground" />
                        <span className="text-muted-foreground">Активность:</span>
                        <span className="font-medium">{new Date(editingUser.updatedAt).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 py-3">
                {/* Основная информация */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Основная информация
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        placeholder="user@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Полное имя</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Иван Иванов"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Роль и доступ */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Роль и доступ
                  </h4>
                  <div className="space-y-2">
                    <Label htmlFor="role">Роль в системе *</Label>
                    <Select value={formData.roleId} onValueChange={(value) => setFormData(prev => ({ ...prev, roleId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите роль" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <div className="flex flex-col">
                              <div className="font-medium">{role.name}</div>
                              {role.description && (
                                <div className="text-xs text-muted-foreground">{role.description}</div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Отдел */}
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Организационная структура
                    </h4>
                    <div className="space-y-2">
                      <Label htmlFor="department">Отдел</Label>
                      <Select 
                        value={formData.departmentId} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите отдел" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">Без отдела</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>

                {/* Статистика (только для редактирования) */}
                {editingUser && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Статистика активности
                      </h4>
                      <Card className="py-2">
                        <CardContent className="pt-1 pb-1">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="space-y-1">
                              <div className="flex items-center justify-center gap-1 text-blue-600">
                                <FileText className="h-5 w-5" />
                                <span className="text-xl font-bold">{editingUser._count.contracts}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">Договоры</div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-center gap-1 text-green-600">
                                <MessageSquare className="h-5 w-5" />
                                <span className="text-xl font-bold">{editingUser._count.comments}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">Комментарии</div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-center gap-1 text-purple-600">
                                <CheckCircle className="h-5 w-5" />
                                <span className="text-xl font-bold">{editingUser._count.approvals}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">Согласования</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
              </div>
              
              <DialogFooter className="flex-shrink-0 pt-4 border-t flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="sm:w-auto w-full">
                  Отмена
                </Button>
                <Button type="submit" disabled={submitting} className="sm:w-auto w-full">
                  {submitting ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                      Сохранение...
                    </>
                  ) : editingUser ? (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Сохранить изменения
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Создать пользователя
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Фильтры и поиск */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Поиск и фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по email или имени..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Фильтр по роли" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все роли</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Таблица пользователей */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Пользователи системы
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead>Отдел</TableHead>
                      <TableHead>Статистика</TableHead>
                      <TableHead>Создан</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name || 'Без имени'}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.userRole?.name || user.role)}>
                            {user.userRole?.name || user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.department ? (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {user.department.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Без отдела</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {user._count.contracts}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {user._count.comments}
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {user._count.approvals}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(user.id)}
                              disabled={user.role === UserRole.ADMINISTRATOR || (user.userRole && user.userRole.name === 'Администратор')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Пагинация */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Страница {currentPage} из {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Назад
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Вперед
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}