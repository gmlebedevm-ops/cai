'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  MessageSquare, 
  Send, 
  Clock, 
  User, 
  AlertCircle,
  CheckCircle,
  Edit3,
  Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Comment {
  id: string
  content: string
  authorId: string
  authorName: string
  authorRole: string
  createdAt: string
  updatedAt: string
  isEdited: boolean
  canEdit: boolean
  canDelete: boolean
}

interface CommentManagerProps {
  contractId: string
  currentUserId: string
  currentUserName?: string
  currentUserRole?: string
}

export function CommentManager({ 
  contractId, 
  currentUserId, 
  currentUserName = 'Текущий пользователь',
  currentUserRole = 'Пользователь'
}: CommentManagerProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    fetchComments()
  }, [contractId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?contractId=${contractId}`)
      if (response.ok) {
        const data = await response.json()
        setComments(Array.isArray(data) ? data : (data.comments || []))
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId,
          content: newComment.trim(),
          authorId: currentUserId,
          authorName: currentUserName,
          authorRole: currentUserRole
        })
      })

      if (response.ok) {
        setNewComment('')
        fetchComments()
      } else {
        const errorData = await response.json()
        alert(`Ошибка: ${errorData.error || 'Не удалось отправить комментарий'}`)
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      alert('Ошибка сети при отправке комментария')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      const response = await fetch('/api/comments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          content: editContent.trim()
        })
      })

      if (response.ok) {
        setEditingCommentId(null)
        setEditContent('')
        fetchComments()
      }
    } catch (error) {
      console.error('Error editing comment:', error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот комментарий?')) return

    try {
      const response = await fetch('/api/comments', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId
        })
      })

      if (response.ok) {
        fetchComments()
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditContent(comment.content)
  }

  const cancelEditing = () => {
    setEditingCommentId(null)
    setEditContent('')
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy в HH:mm', { locale: ru })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
      case 'administrator':
        return 'bg-red-500'
      case 'manager':
      case 'руководитель':
        return 'bg-blue-500'
      case 'lawyer':
      case 'юрист':
        return 'bg-purple-500'
      case 'chief_lawyer':
      case 'главный юрист':
        return 'bg-indigo-500'
      case 'general_director':
      case 'генеральный директор':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Загрузка комментариев...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Comment Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Добавить комментарий
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Введите ваш комментарий..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submitting}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Отправка...' : 'Отправить'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Комментарии ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">Пока нет комментариев</p>
              <p className="text-sm text-muted-foreground mt-2">
                Будьте первым, кто прокомментирует этот договор
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                    {/* Comment Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {comment.authorName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{comment.authorName}</span>
                            <Badge 
                              variant="secondary" 
                              className={`${getRoleBadgeColor(comment.authorRole)} text-white text-xs`}
                            >
                              {comment.authorRole}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDate(comment.createdAt)}
                            {comment.isEdited && (
                              <span className="text-xs">(изменено)</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      {(comment.canEdit || comment.canDelete) && (
                        <div className="flex items-center gap-1">
                          {comment.canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(comment)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          )}
                          {comment.canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Comment Content */}
                    {editingCommentId === comment.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[80px] resize-none"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelEditing}
                          >
                            Отмена
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEditComment(comment.id)}
                            disabled={!editContent.trim()}
                          >
                            Сохранить
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed">
                        {comment.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}