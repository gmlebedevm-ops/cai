'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Users, 
  Settings,
  Key,
  UserCheck
} from 'lucide-react'

interface Permission {
  id: string
  type: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

interface RolePermission {
  id: string
  permission: Permission
}

interface Role {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  permissions: RolePermission[]
  _count: {
    users: number
  }
}

interface RolesResponse {
  roles: Role[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface PermissionsResponse {
  permissions: Permission[]
  groupedPermissions: Record<string, Permission[]>
  total: number
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({})
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRoles, setTotalRoles] = useState(0)
  
  // Форма создания/редактирования роли
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissionIds: [] as string[]
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        includePermissions: 'true'
      })

      const response = await fetch(`/api/roles-management?${params}`)
      if (response.ok) {
        const data: RolesResponse = await response.json()
        setRoles(data.roles)
        setTotalPages(data.pagination.pages)
        setTotalRoles(data.pagination.total)
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/permissions')
      if (response.ok) {
        const data: PermissionsResponse = await response.json()
        setPermissions(data.permissions)
        setGroupedPermissions(data.groupedPermissions)
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
    }
  }

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [currentPage])

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const url = editingRole ? `/api/roles-management/${editingRole.id}` : '/api/roles-management'
      const method = editingRole ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: roleForm.name,
          description: roleForm.description,
          permissionIds: roleForm.permissionIds
        })
      })

      if (response.ok) {
        await fetchRoles()
        setIsRoleDialogOpen(false)
        resetRoleForm()
      } else {
        const data = await response.json()
        setError(data.error || 'Произошла ошибка')
      }
    } catch (error) {
      console.error('Error submitting role:', error)
      setError('Произошла ошибка при сохранении')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditRole = (role: Role) => {
    setEditingRole(role)
    setRoleForm({
      name: role.name,
      description: role.description || '',
      permissionIds: role.permissions.map(rp => rp.permission.id)
    })
    setIsRoleDialogOpen(true)
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту роль?')) {
      return
    }

    try {
      const response = await fetch(`/api/roles-management/${roleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchRoles()
      } else {
        const data = await response.json()
        setError(data.error || 'Ошибка при удалении роли')
      }
    } catch (error) {
      console.error('Error deleting role:', error)
      setError('Произошла ошибка при удалении')
    }
  }

  const resetRoleForm = () => {
    setEditingRole(null)
    setRoleForm({
      name: '',
      description: '',
      permissionIds: [] as string[]
    })
    setError('')
  }

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    setRoleForm(prev => ({
      ...prev,
      permissionIds: checked
        ? [...prev.permissionIds, permissionId]
        : prev.permissionIds.filter(id => id !== permissionId)
    }))
  }

  const getPermissionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'CREATE_CONTRACT': 'Управление договорами',
      'VIEW_CONTRACT': 'Просмотр договоров',
      'EDIT_CONTRACT': 'Редактирование договоров',
      'DELETE_CONTRACT': 'Удаление договоров',
      'APPROVE_CONTRACT': 'Согласование договоров',
      'REJECT_CONTRACT': 'Отклонение договоров',
      'UPLOAD_DOCUMENT': 'Загрузка документов',
      'VIEW_DOCUMENT': 'Просмотр документов',
      'DELETE_DOCUMENT': 'Удаление документов',
      'CREATE_USER': 'Создание пользователей',
      'VIEW_USER': 'Просмотр пользователей',
      'EDIT_USER': 'Редактирование пользователей',
      'DELETE_USER': 'Удаление пользователей',
      'MANAGE_ROLES': 'Управление ролями',
      'MANAGE_PERMISSIONS': 'Управление разрешениями',
      'MANAGE_WORKFLOWS': 'Управление маршрутами',
      'MANAGE_REFERENCES': 'Управление справочниками',
      'MANAGE_INTEGRATIONS': 'Управление интеграциями',
      'VIEW_REPORTS': 'Просмотр отчетов',
      'MANAGE_SYSTEM': 'Управление системой',
      'VIEW_ALL_CONTRACTS': 'Просмотр всех договоров',
      'VIEW_ALL_USERS': 'Просмотр всех пользователей'
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6">
      {/* Заголовок страницы */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Управление ролями и правами</h1>
          <p className="text-muted-foreground">
            Управление ролями, разрешениями и правами доступа • Всего ролей: {totalRoles}
          </p>
        </div>
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetRoleForm}>
              <Plus className="h-4 w-4 mr-2" />
              Новая роль
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleRoleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingRole ? 'Редактирование роли' : 'Создание роли'}
                </DialogTitle>
                <DialogDescription>
                  {editingRole 
                    ? 'Измените данные роли и ее разрешения'
                    : 'Заполните форму для создания новой роли'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="roleName">Название роли *</Label>
                  <Input
                    id="roleName"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="roleDescription">Описание</Label>
                  <Input
                    id="roleDescription"
                    value={roleForm.description}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Описание роли и ее назначения"
                  />
                </div>

                <div className="space-y-4">
                  <Label>Разрешения роли</Label>
                  <div className="max-h-60 overflow-y-auto space-y-4 border rounded-md p-4">
                    {Object.entries(groupedPermissions).map(([type, typePermissions]) => (
                      <div key={type} className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground">
                          {getPermissionTypeLabel(type)}
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {typePermissions.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={permission.id}
                                checked={roleForm.permissionIds.includes(permission.id)}
                                onCheckedChange={(checked) => 
                                  handlePermissionToggle(permission.id, checked as boolean)
                                }
                              />
                              <Label htmlFor={permission.id} className="text-sm cursor-pointer">
                                {permission.name}
                                {permission.description && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    ({permission.description})
                                  </span>
                                )}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Сохранение...' : (editingRole ? 'Сохранить' : 'Создать')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Роли</TabsTrigger>
          <TabsTrigger value="permissions">Разрешения</TabsTrigger>
        </TabsList>
        
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Роли системы
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
                          <TableHead>Роль</TableHead>
                          <TableHead>Разрешения</TableHead>
                          <TableHead>Пользователи</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roles.map((role) => (
                          <TableRow key={role.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{role.name}</div>
                                {role.description && (
                                  <div className="text-sm text-muted-foreground">
                                    {role.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {role.permissions.length} разрешений
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {role._count.users}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={role.isActive ? 'default' : 'secondary'}>
                                {role.isActive ? 'Активна' : 'Неактивна'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditRole(role)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteRole(role.id)}
                                  disabled={role._count.users > 0}
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
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Разрешения системы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([type, typePermissions]) => (
                  <div key={type} className="space-y-3">
                    <h3 className="text-lg font-semibold">
                      {getPermissionTypeLabel(type)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {typePermissions.map((permission) => (
                        <Card key={permission.id} className="p-4">
                          <div className="space-y-2">
                            <div className="font-medium text-sm">
                              {permission.name}
                            </div>
                            {permission.description && (
                              <div className="text-xs text-muted-foreground">
                                {permission.description}
                              </div>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {permission.type}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}