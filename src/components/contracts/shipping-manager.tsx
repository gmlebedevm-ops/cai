'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Package, 
  Truck, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Edit,
  Save,
  X
} from 'lucide-react'
import { 
  Contract, 
  ShippingMethod, 
  ShippingStatus 
} from '@/types/contract'

interface ShippingManagerProps {
  contract: Contract
  currentUserId: string
  onShippingUpdate: () => void
}

export function ShippingManager({ 
  contract, 
  currentUserId, 
  onShippingUpdate 
}: ShippingManagerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shippingData, setShippingData] = useState({
    shippingMethod: contract.shippingMethod || '',
    shippingStatus: contract.shippingStatus || '',
    trackingNumber: contract.trackingNumber || '',
    shippingDate: contract.shippingDate ? new Date(contract.shippingDate).toISOString().split('T')[0] : '',
    deliveryDate: contract.deliveryDate ? new Date(contract.deliveryDate).toISOString().split('T')[0] : '',
    shippingAddress: contract.shippingAddress || '',
    shippingNotes: contract.shippingNotes || ''
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/contracts/${contract.id}/shipping`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...shippingData,
          shippingDate: shippingData.shippingDate ? new Date(shippingData.shippingDate) : null,
          deliveryDate: shippingData.deliveryDate ? new Date(shippingData.deliveryDate) : null,
          shippingMethod: shippingData.shippingMethod || null,
          shippingStatus: shippingData.shippingStatus || null,
          trackingNumber: shippingData.trackingNumber || null,
          shippingAddress: shippingData.shippingAddress || null,
          shippingNotes: shippingData.shippingNotes || null
        }),
      })

      if (response.ok) {
        setIsEditing(false)
        onShippingUpdate()
      }
    } catch (error) {
      console.error('Error updating shipping information:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setShippingData({
      shippingMethod: contract.shippingMethod || '',
      shippingStatus: contract.shippingStatus || '',
      trackingNumber: contract.trackingNumber || '',
      shippingDate: contract.shippingDate ? new Date(contract.shippingDate).toISOString().split('T')[0] : '',
      deliveryDate: contract.deliveryDate ? new Date(contract.deliveryDate).toISOString().split('T')[0] : '',
      shippingAddress: contract.shippingAddress || '',
      shippingNotes: contract.shippingNotes || ''
    })
    setIsEditing(false)
  }

  const getShippingMethodLabel = (method: ShippingMethod) => {
    switch (method) {
      case 'RUSSIAN_POST': return 'Почта России'
      case 'COURIER': return 'Курьерская доставка'
      case 'SELF_PICKUP': return 'Самовывоз'
      case 'OTHER': return 'Другое'
      default: return 'Не указано'
    }
  }

  const getShippingStatusLabel = (status: ShippingStatus) => {
    switch (status) {
      case 'PENDING': return 'Ожидает отправки'
      case 'SHIPPED': return 'Отправлен'
      case 'DELIVERED': return 'Доставлен'
      case 'RETURNED': return 'Возвращен'
      case 'LOST': return 'Утерян'
      default: return 'Не указано'
    }
  }

  const getShippingStatusColor = (status: ShippingStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500'
      case 'SHIPPED': return 'bg-blue-500'
      case 'DELIVERED': return 'bg-green-500'
      case 'RETURNED': return 'bg-orange-500'
      case 'LOST': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getShippingStatusIcon = (status: ShippingStatus) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />
      case 'SHIPPED': return <Package className="h-4 w-4" />
      case 'DELIVERED': return <CheckCircle className="h-4 w-4" />
      case 'RETURNED': return <AlertTriangle className="h-4 w-4" />
      case 'LOST': return <AlertTriangle className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Информация о доставке</h3>
        </div>
        
        {!isEditing ? (
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Редактировать
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              Сохранить
            </Button>
          </div>
        )}
      </div>

      {/* Shipping Status Card */}
      {contract.shippingStatus && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getShippingStatusIcon(contract.shippingStatus)}
                <div>
                  <p className="font-medium">Статус доставки</p>
                  <Badge className={`${getShippingStatusColor(contract.shippingStatus)} text-white`}>
                    {getShippingStatusLabel(contract.shippingStatus)}
                  </Badge>
                </div>
              </div>
              
              {contract.shippingMethod && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Способ доставки</p>
                  <p className="font-medium">{getShippingMethodLabel(contract.shippingMethod)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipping Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Method and Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="shippingMethod">Способ доставки</Label>
              {isEditing ? (
                <Select 
                  value={shippingData.shippingMethod} 
                  onValueChange={(value) => setShippingData({...shippingData, shippingMethod: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите способ доставки" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RUSSIAN_POST">Почта России</SelectItem>
                    <SelectItem value="COURIER">Курьерская доставка</SelectItem>
                    <SelectItem value="SELF_PICKUP">Самовывоз</SelectItem>
                    <SelectItem value="OTHER">Другое</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium">
                  {contract.shippingMethod ? getShippingMethodLabel(contract.shippingMethod) : 'Не указано'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="shippingStatus">Статус доставки</Label>
              {isEditing ? (
                <Select 
                  value={shippingData.shippingStatus} 
                  onValueChange={(value) => setShippingData({...shippingData, shippingStatus: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Ожидает отправки</SelectItem>
                    <SelectItem value="SHIPPED">Отправлен</SelectItem>
                    <SelectItem value="DELIVERED">Доставлен</SelectItem>
                    <SelectItem value="RETURNED">Возвращен</SelectItem>
                    <SelectItem value="LOST">Утерян</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium">
                  {contract.shippingStatus ? getShippingStatusLabel(contract.shippingStatus) : 'Не указано'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="trackingNumber">Трек-номер</Label>
              {isEditing ? (
                <Input
                  id="trackingNumber"
                  value={shippingData.trackingNumber}
                  onChange={(e) => setShippingData({...shippingData, trackingNumber: e.target.value})}
                  placeholder="Введите трек-номер"
                />
              ) : (
                <p className="text-sm font-medium">
                  {contract.trackingNumber || 'Не указано'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Даты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="shippingDate">Дата отправки</Label>
              {isEditing ? (
                <Input
                  id="shippingDate"
                  type="date"
                  value={shippingData.shippingDate}
                  onChange={(e) => setShippingData({...shippingData, shippingDate: e.target.value})}
                />
              ) : (
                <p className="text-sm font-medium">
                  {contract.shippingDate ? new Date(contract.shippingDate).toLocaleDateString('ru-RU') : 'Не указано'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="deliveryDate">Дата доставки</Label>
              {isEditing ? (
                <Input
                  id="deliveryDate"
                  type="date"
                  value={shippingData.deliveryDate}
                  onChange={(e) => setShippingData({...shippingData, deliveryDate: e.target.value})}
                />
              ) : (
                <p className="text-sm font-medium">
                  {contract.deliveryDate ? new Date(contract.deliveryDate).toLocaleDateString('ru-RU') : 'Не указано'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Address and Notes */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Адрес и примечания</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="shippingAddress">Адрес доставки</Label>
              {isEditing ? (
                <Textarea
                  id="shippingAddress"
                  value={shippingData.shippingAddress}
                  onChange={(e) => setShippingData({...shippingData, shippingAddress: e.target.value})}
                  placeholder="Введите адрес доставки"
                  rows={3}
                />
              ) : (
                <p className="text-sm font-medium">
                  {contract.shippingAddress || 'Не указано'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="shippingNotes">Примечания</Label>
              {isEditing ? (
                <Textarea
                  id="shippingNotes"
                  value={shippingData.shippingNotes}
                  onChange={(e) => setShippingData({...shippingData, shippingNotes: e.target.value})}
                  placeholder="Введите примечания к доставке"
                  rows={3}
                />
              ) : (
                <p className="text-sm font-medium">
                  {contract.shippingNotes || 'Нет примечаний'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {contract.shippingMethod && !isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Быстрые действия</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {contract.shippingMethod === 'RUSSIAN_POST' && contract.trackingNumber && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open(`https://www.pochta.ru/tracking#${contract.trackingNumber}`, '_blank')
                  }}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Отследить на Почте России
                </Button>
              )}
              
              {contract.shippingStatus === 'PENDING' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShippingData({...shippingData, shippingStatus: 'SHIPPED'})
                    setIsEditing(true)
                  }}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Отметить как отправленный
                </Button>
              )}
              
              {contract.shippingStatus === 'SHIPPED' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShippingData({...shippingData, shippingStatus: 'DELIVERED'})
                    setIsEditing(true)
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Отметить как доставленный
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}