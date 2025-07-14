import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Calendar } from '@/components/ui/calendar.jsx'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Calendar as CalendarIcon, 
  Tag, 
  CheckCircle2, 
  Circle,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'
import './App.css'

const CATEGORIES = [
  { id: 'work', name: 'Work', color: 'bg-blue-500' },
  { id: 'personal', name: 'Personal', color: 'bg-green-500' },
  { id: 'shopping', name: 'Shopping', color: 'bg-purple-500' },
  { id: 'health', name: 'Health', color: 'bg-red-500' },
  { id: 'education', name: 'Education', color: 'bg-yellow-500' },
  { id: 'other', name: 'Other', color: 'bg-gray-500' }
]

const PRIORITIES = [
  { id: 'low', name: 'Low', color: 'text-green-600' },
  { id: 'medium', name: 'Medium', color: 'text-yellow-600' },
  { id: 'high', name: 'High', color: 'text-red-600' }
]

function App() {
  const [todos, setTodos] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [sortBy, setSortBy] = useState('created')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState(null)

  // Form state for adding/editing todos
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    dueDate: null,
    completed: false
  })

  // Load todos from localStorage on component mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos')
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos))
    }
  }, [])

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'other',
      priority: 'medium',
      dueDate: null,
      completed: false
    })
  }

  const handleAddTodo = () => {
    if (!formData.title.trim()) return

    const newTodo = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setTodos(prev => [...prev, newTodo])
    resetForm()
    setIsAddDialogOpen(false)
  }

  const handleEditTodo = () => {
    if (!formData.title.trim()) return

    setTodos(prev => prev.map(todo => 
      todo.id === editingTodo.id 
        ? { ...todo, ...formData, updatedAt: new Date().toISOString() }
        : todo
    ))
    resetForm()
    setEditingTodo(null)
  }

  const handleDeleteTodo = (id) => {
    setTodos(prev => prev.filter(todo => todo.id !== id))
  }

  const handleToggleComplete = (id) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id 
        ? { ...todo, completed: !todo.completed, updatedAt: new Date().toISOString() }
        : todo
    ))
  }

  const openEditDialog = (todo) => {
    setFormData({
      title: todo.title,
      description: todo.description || '',
      category: todo.category,
      priority: todo.priority,
      dueDate: todo.dueDate ? new Date(todo.dueDate) : null,
      completed: todo.completed
    })
    setEditingTodo(todo)
  }

  // Filter and sort todos
  const filteredTodos = todos
    .filter(todo => {
      const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (todo.description && todo.description.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = filterCategory === 'all' || todo.category === filterCategory
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'completed' && todo.completed) ||
                           (filterStatus === 'active' && !todo.completed)
      const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority
      
      return matchesSearch && matchesCategory && matchesStatus && matchesPriority
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate) - new Date(b.dueDate)
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        case 'created':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt)
      }
    })

  const isOverdue = (dueDate) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  const isDueToday = (dueDate) => {
    if (!dueDate) return false
    return new Date(dueDate).toDateString() === new Date().toDateString()
  }

  const getCategoryInfo = (categoryId) => {
    return CATEGORIES.find(cat => cat.id === categoryId) || CATEGORIES[CATEGORIES.length - 1]
  }

  const getPriorityInfo = (priorityId) => {
    return PRIORITIES.find(pri => pri.id === priorityId) || PRIORITIES[1]
  }

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    active: todos.filter(t => !t.completed).length,
    overdue: todos.filter(t => !t.completed && isOverdue(t.dueDate)).length
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Advanced Todo List</h1>
          <p className="text-muted-foreground">Organize your tasks with categories, priorities, and due dates</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {PRIORITIES.map(pri => (
                      <SelectItem key={pri.id} value={pri.id}>{pri.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created">Created Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="dueDate">Due Date</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Add Button */}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                  </DialogHeader>
                  <TaskForm 
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleAddTodo}
                    onCancel={() => {
                      setIsAddDialogOpen(false)
                      resetForm()
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Todo List */}
        <div className="space-y-4">
          {filteredTodos.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-muted-foreground">
                  {todos.length === 0 ? 'No tasks yet. Add your first task!' : 'No tasks match your filters.'}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredTodos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggleComplete={handleToggleComplete}
                onEdit={openEditDialog}
                onDelete={handleDeleteTodo}
                isOverdue={isOverdue(todo.dueDate)}
                isDueToday={isDueToday(todo.dueDate)}
                getCategoryInfo={getCategoryInfo}
                getPriorityInfo={getPriorityInfo}
              />
            ))
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingTodo} onOpenChange={(open) => !open && setEditingTodo(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <TaskForm 
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleEditTodo}
              onCancel={() => {
                setEditingTodo(null)
                resetForm()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

// Task Form Component
function TaskForm({ formData, setFormData, onSubmit, onCancel }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Title *</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter task title..."
        />
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter task description..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Category</label>
          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Priority</label>
          <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map(pri => (
                <SelectItem key={pri.id} value={pri.id}>{pri.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Due Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.dueDate ? format(formData.dueDate, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.dueDate}
              onSelect={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={!formData.title.trim()}>
          Save Task
        </Button>
      </div>
    </div>
  )
}

// Todo Item Component
function TodoItem({ todo, onToggleComplete, onEdit, onDelete, isOverdue, isDueToday, getCategoryInfo, getPriorityInfo }) {
  const categoryInfo = getCategoryInfo(todo.category)
  const priorityInfo = getPriorityInfo(todo.priority)

  return (
    <Card className={`transition-all hover:shadow-md ${todo.completed ? 'opacity-75' : ''} ${isOverdue ? 'border-red-200 bg-red-50/50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={todo.completed}
            onCheckedChange={() => onToggleComplete(todo.id)}
            className="mt-1"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className={`font-medium ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {todo.title}
                </h3>
                {todo.description && (
                  <p className={`text-sm mt-1 ${todo.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                    {todo.description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit(todo)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(todo.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge variant="secondary" className={`${categoryInfo.color} text-white`}>
                <Tag className="h-3 w-3 mr-1" />
                {categoryInfo.name}
              </Badge>
              
              <Badge variant="outline" className={priorityInfo.color}>
                {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}
              </Badge>

              {todo.dueDate && (
                <Badge variant={isOverdue ? 'destructive' : isDueToday ? 'default' : 'outline'}>
                  {isOverdue && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {isDueToday && <Clock className="h-3 w-3 mr-1" />}
                  {!isOverdue && !isDueToday && <CalendarIcon className="h-3 w-3 mr-1" />}
                  {format(new Date(todo.dueDate), 'MMM d')}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default App

