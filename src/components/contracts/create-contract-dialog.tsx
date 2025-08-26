'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarIcon, Upload, Send, Save } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { ContractStatus } from '@/types/contract'
import { useToast } from '@/hooks/use-toast'

const formSchema = z.object({
  number: z.string().min(1, 'Номер договора обязателен'),
  counterparty: z.string().min(1, 'Контрагент обязателен'),
  amount: z.string().min(1, 'Сумма обязательна'),
  startDate: z.date({
    required_error: 'Дата начала обязательна',
  }),
  endDate: z.date({
    required_error: 'Дата окончания обязательна',
  }),
  description: z.string().optional(),
  workflowId: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Workflow {
  id: string
  name: string
  description?: string
  status: string
  isDefault: boolean
}

interface CreateContractDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateContractDialog({ open, onOpenChange, onSuccess }: CreateContractDialogProps) {
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loadingWorkflows, setLoadingWorkflows] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      number: '',
      counterparty: '',
      amount: '',
      description: '',
      workflowId: '',
    },
  })

  // Загрузка активных workflow при открытии диалога
  useEffect(() => {
    if (open) {
      fetchWorkflows()
    }
  }, [open])

  const fetchWorkflows = async () => {
    setLoadingWorkflows(true)
    try {
      const response = await fetch('/api/workflows?status=ACTIVE')
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data)
        
        // Автоматически выбрать workflow по умолчанию
        const defaultWorkflow = data.find((w: Workflow) => w.isDefault)
        if (defaultWorkflow) {
          form.setValue('workflowId', defaultWorkflow.id)
        }
      }
    } catch (error) {
      console.error('Error fetching workflows:', error)
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить маршруты согласования',
        variant: 'destructive',
      })
    } finally {
      setLoadingWorkflows(false)
    }
  }

  const onSubmit = async (values: FormValues, action: 'draft' | 'submit') => {
    setLoading(true)
    try {
      // Для демо используем фиксированный ID пользователя
      const initiatorId = 'demo-user-id'

      const contractData = {
        ...values,
        initiatorId,
        amount: parseFloat(values.amount),
        status: action === 'draft' ? 'DRAFT' : 'IN_REVIEW',
        workflowId: values.workflowId || null,
      }

      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      })

      if (response.ok) {
        const contract = await response.json()
        
        // Если отправляем на согласование и есть workflow, запускаем процесс
        if (action === 'submit' && values.workflowId) {
          await startApprovalProcess(contract.id, values.workflowId)
        }

        form.reset()
        setFiles([])
        onOpenChange(false)
        onSuccess?.()
        
        toast({
          title: 'Успешно',
          description: action === 'draft' 
            ? 'Договор сохранен в черновики' 
            : 'Договор создан и отправлен на согласование',
        })
      } else {
        throw new Error('Failed to create contract')
      }
    } catch (error) {
      console.error('Error creating contract:', error)
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать договор',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const startApprovalProcess = async (contractId: string, workflowId: string) => {
    try {
      const response = await fetch('/api/contracts/start-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId,
          workflowId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start approval process')
      }
    } catch (error) {
      console.error('Error starting approval process:', error)
      throw error
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="adaptive-dialog max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle>Создание нового договора</DialogTitle>
          <DialogDescription>
            Заполните обязательные поля для создания договора. При сумме более 300 тыс. ₽ требуется загрузка тендерного листа.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Номер договора *</FormLabel>
                    <FormControl>
                      <Input placeholder="Д-2024-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="counterparty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Контрагент *</FormLabel>
                    <FormControl>
                      <Input placeholder="ООО 'Ромашка'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Сумма договора (₽) *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="150000" 
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          field.onChange(value)
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Дата начала *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd.MM.yyyy")
                            ) : (
                              <span>Выберите дату</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Дата окончания *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd.MM.yyyy")
                            ) : (
                              <span>Выберите дату</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Дополнительная информация о договоре..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workflowId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Маршрут согласования</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите маршрут согласования" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingWorkflows ? (
                        <SelectItem value="loading" disabled>
                          Загрузка...
                        </SelectItem>
                      ) : workflows.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Нет активных маршрутов
                        </SelectItem>
                      ) : (
                        workflows.map((workflow) => (
                          <SelectItem key={workflow.id} value={workflow.id}>
                            {workflow.name} {workflow.isDefault && '(по умолчанию)'}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Документы</FormLabel>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Нажмите для загрузки или перетащите файлы
                  </span>
                  <span className="text-xs text-gray-400">
                    PDF, DOC, DOCX (макс. 10MB)
                  </span>
                </label>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Загруженные файлы:</p>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {parseFloat(form.watch('amount')) > 300000 && files.length === 0 && (
                <p className="text-sm text-orange-600">
                  При сумме более 300 тыс. ₽ требуется загрузка тендерного листа или коммерческого предложения
                </p>
              )}
            </div>
            </form>
          </Form>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="order-1 sm:order-1"
          >
            Отмена
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => form.handleSubmit((values) => onSubmit(values, 'draft'))()}
            disabled={loading}
            className="order-3 sm:order-2"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Сохранение...' : 'Сохранить в черновики'}
          </Button>
          <Button
            type="button"
            onClick={() => form.handleSubmit((values) => onSubmit(values, 'submit'))()}
            disabled={loading || !form.watch('workflowId')}
            className="order-2 sm:order-3"
          >
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Отправка...' : 'Отправить на согласование'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}