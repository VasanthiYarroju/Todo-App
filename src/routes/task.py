from flask import Blueprint, request, jsonify
from datetime import datetime
from src.models.user import db
from src.models.task import Task

task_bp = Blueprint('task', __name__)

@task_bp.route('/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks with optional filtering"""
    try:
        # Get query parameters for filtering
        category = request.args.get('category')
        priority = request.args.get('priority')
        completed = request.args.get('completed')
        search = request.args.get('search')
        
        # Start with base query
        query = Task.query
        
        # Apply filters
        if category:
            query = query.filter(Task.category == category)
        if priority:
            query = query.filter(Task.priority == priority)
        if completed is not None:
            completed_bool = completed.lower() == 'true'
            query = query.filter(Task.completed == completed_bool)
        if search:
            query = query.filter(Task.title.contains(search) | Task.description.contains(search))
        
        # Order by created_at descending
        tasks = query.order_by(Task.created_at.desc()).all()
        
        return jsonify({
            'success': True,
            'tasks': [task.to_dict() for task in tasks],
            'count': len(tasks)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@task_bp.route('/tasks', methods=['POST'])
def create_task():
    """Create a new task"""
    try:
        data = request.get_json()
        
        if not data or not data.get('title'):
            return jsonify({
                'success': False,
                'error': 'Title is required'
            }), 400
        
        # Parse due_date if provided
        due_date = None
        if data.get('due_date'):
            try:
                due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid due_date format. Use ISO format.'
                }), 400
        
        # Validate priority
        valid_priorities = ['low', 'medium', 'high', 'urgent']
        priority = data.get('priority', 'medium')
        if priority not in valid_priorities:
            return jsonify({
                'success': False,
                'error': f'Priority must be one of: {", ".join(valid_priorities)}'
            }), 400
        
        # Create new task
        task = Task(
            title=data['title'],
            description=data.get('description', ''),
            priority=priority,
            category=data.get('category'),
            due_date=due_date
        )
        
        db.session.add(task)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'task': task.to_dict(),
            'message': 'Task created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@task_bp.route('/tasks/<int:task_id>', methods=['GET'])
def get_task(task_id):
    """Get a specific task by ID"""
    try:
        task = Task.query.get(task_id)
        
        if not task:
            return jsonify({
                'success': False,
                'error': 'Task not found'
            }), 404
        
        return jsonify({
            'success': True,
            'task': task.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@task_bp.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update a specific task"""
    try:
        task = Task.query.get(task_id)
        
        if not task:
            return jsonify({
                'success': False,
                'error': 'Task not found'
            }), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Update fields if provided
        if 'title' in data:
            if not data['title']:
                return jsonify({
                    'success': False,
                    'error': 'Title cannot be empty'
                }), 400
            task.title = data['title']
        
        if 'description' in data:
            task.description = data['description']
        
        if 'completed' in data:
            task.completed = bool(data['completed'])
        
        if 'priority' in data:
            valid_priorities = ['low', 'medium', 'high', 'urgent']
            if data['priority'] not in valid_priorities:
                return jsonify({
                    'success': False,
                    'error': f'Priority must be one of: {", ".join(valid_priorities)}'
                }), 400
            task.priority = data['priority']
        
        if 'category' in data:
            task.category = data['category']
        
        if 'due_date' in data:
            if data['due_date']:
                try:
                    task.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
                except ValueError:
                    return jsonify({
                        'success': False,
                        'error': 'Invalid due_date format. Use ISO format.'
                    }), 400
            else:
                task.due_date = None
        
        task.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'task': task.to_dict(),
            'message': 'Task updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@task_bp.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a specific task"""
    try:
        task = Task.query.get(task_id)
        
        if not task:
            return jsonify({
                'success': False,
                'error': 'Task not found'
            }), 404
        
        db.session.delete(task)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Task deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@task_bp.route('/tasks/stats', methods=['GET'])
def get_task_stats():
    """Get task statistics"""
    try:
        total_tasks = Task.query.count()
        completed_tasks = Task.query.filter(Task.completed == True).count()
        pending_tasks = total_tasks - completed_tasks
        
        # Get tasks by priority
        priority_stats = {}
        for priority in ['low', 'medium', 'high', 'urgent']:
            priority_stats[priority] = Task.query.filter(Task.priority == priority).count()
        
        # Get overdue tasks
        overdue_tasks = Task.query.filter(
            Task.due_date < datetime.utcnow(),
            Task.completed == False
        ).count()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'pending_tasks': pending_tasks,
                'overdue_tasks': overdue_tasks,
                'priority_breakdown': priority_stats
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@task_bp.route('/tasks/categories', methods=['GET'])
def get_categories():
    """Get all unique categories"""
    try:
        categories = db.session.query(Task.category).filter(Task.category.isnot(None)).distinct().all()
        category_list = [cat[0] for cat in categories if cat[0]]
        
        return jsonify({
            'success': True,
            'categories': category_list
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

