import { useState, useMemo, useEffect, useRef } from 'react';
import type { TaskEntry } from '../types/task';
import TaskItem from './TaskItem';

interface Props {
  tasks: TaskEntry[];
  onUpdate: (task: TaskEntry) => void;
  onDelete: (taskId: string) => void;
}

interface Filters {
  number: string;
  title: string;
  status: string;
  createdDate: string;
  completionDate: string;
  notes: string;
  action: string;
  rawCreatedDate: string;
  rawCompletionDate: string;
}

// removed unused helper

const matchesDateFilter = (taskDate: string, filterDate: string) => {
  if (!filterDate) return true;
  if (!taskDate) return false;
  
  // Convert task date to local date string for comparison
  const taskLocalDate = new Date(taskDate).toLocaleDateString('en-CA'); // YYYY-MM-DD format
  return taskLocalDate === filterDate;
};

export default function TaskList({ tasks, onUpdate, onDelete }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [filters, setFilters] = useState<Filters>({
    number: '',
    title: '',
    status: '',
    createdDate: '',
    completionDate: '',
    notes: '',
    action: '',
    rawCreatedDate: '',
    rawCompletionDate: ''
  });

  const clearAllFilters = () => {
    setFilters({
      number: '',
      title: '',
      status: '',
      createdDate: '',
      completionDate: '',
      notes: '',
      action: '',
      rawCreatedDate: '',
      rawCompletionDate: ''
    });
  };

  // Filter, sort, and paginate tasks
  const filteredAndSortedTasks = useMemo(() => {
    // First sort the tasks by timestamp
    const sortedTasks = [...tasks].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Then filter the sorted tasks
    return sortedTasks.filter((task, idx) => {
        const taskNumber = idx + 1; // Calculate the row number based on sorted position
        const matchNumber = !filters.number || taskNumber.toString().includes(filters.number);
        const matchTitle = task.title.toLowerCase().includes(filters.title.toLowerCase());
        const matchStatus = task.status.toLowerCase().includes(filters.status.toLowerCase());
        const matchCreatedDate = !filters.createdDate || matchesDateFilter(task.timestamp, filters.createdDate);
        const matchCompletionDate = !filters.completionDate || (task.doneDate && matchesDateFilter(task.doneDate, filters.completionDate));
        const matchNotes = task.notes ? task.notes.toLowerCase().includes(filters.notes.toLowerCase()) : !filters.notes;
        const matchAction = !filters.action || filters.action === 'Delete';

        return matchNumber && matchTitle && matchStatus && matchCreatedDate && matchCompletionDate && matchNotes && matchAction;
      });
  }, [tasks, filters]);

  // Calculate pagination
  const totalItems = filteredAndSortedTasks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredAndSortedTasks.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  return (
    <div className="task-list-container">
      <div className="filters-header">
        {Object.values(filters).some(f => f !== '') && (
          <button onClick={clearAllFilters} className="clear-all-filters">
            Clear All Filters
          </button>
        )}
      </div>
      <table className="task-table">
        <thead>
          <tr className="filter-row">
            <th style={{ width: '50px' }}>
              <div className="filter-container">
                <input
                  type="text"
                  placeholder="No."
                  value={filters.number}
                  onChange={(e) => setFilters(prev => ({ ...prev, number: e.target.value }))}
                  className="column-filter"
                />
                {filters.number && (
                  <button 
                    className="clear-filter" 
                    onClick={() => setFilters(prev => ({ ...prev, number: '' }))}
                    title="Clear filter"
                  >×</button>
                )}
              </div>
            </th>
            <th>
              <div className="filter-container">
                <input
                  type="text"
                  placeholder="Filter title..."
                  value={filters.title}
                  onChange={(e) => setFilters(prev => ({ ...prev, title: e.target.value }))}
                  className="column-filter"
                />
                {filters.title && (
                  <button 
                    className="clear-filter" 
                    onClick={() => setFilters(prev => ({ ...prev, title: '' }))}
                    title="Clear filter"
                  >×</button>
                )}
              </div>
            </th>
            <th>
              <div className="filter-container">
                <div className="status-filter-wrapper">
                  <input
                    type="text"
                    placeholder="Filter status..."
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="column-filter"
                    onFocus={() => setShowStatusDropdown(true)}
                  />
                  {showStatusDropdown && (
                    <div className="status-dropdown">
                      {['Not Started', 'In Progress', 'Blocked', 'Pending Clarification', 'Completed'].map((status) => (
                        <div
                          key={status}
                          className={`status-option status-${status.toLowerCase().replace(' ', '-')}`}
                          onClick={() => {
                            setFilters(prev => ({ ...prev, status }));
                            setShowStatusDropdown(false);
                          }}
                        >
                          {status}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {filters.status && (
                  <button 
                    className="clear-filter" 
                    onClick={() => setFilters(prev => ({ ...prev, status: '' }))}
                    title="Clear filter"
                  >×</button>
                )}
              </div>
            </th>
            <th>
              <div className="filter-container">
                <input
                  type="date"
                  value={filters.createdDate}
                  onChange={(e) => {
                    const input = e.currentTarget;
                    setFilters(prev => ({
                      ...prev,
                      createdDate: input.value,
                      rawCreatedDate: input.value || input.value.length > 0 ? 'pending' : ''
                    }));
                  }}
                  className="column-filter date-filter"
                  onKeyDown={() => {
                    setFilters(prev => ({
                      ...prev,
                      rawCreatedDate: 'pending'
                    }));
                  }}
                />
                {(filters.createdDate || filters.rawCreatedDate) && (
                  <button 
                    className="clear-filter" 
                    onClick={() => setFilters(prev => ({ 
                      ...prev, 
                      createdDate: '',
                      rawCreatedDate: ''
                    }))}
                    title="Clear filter"
                  >×</button>
                )}
              </div>
            </th>
            <th>
              <div className="filter-container">
                <input
                  type="date"
                  value={filters.completionDate}
                  onChange={(e) => {
                    const input = e.currentTarget;
                    setFilters(prev => ({
                      ...prev,
                      completionDate: input.value,
                      rawCompletionDate: input.value || input.value.length > 0 ? 'pending' : ''
                    }));
                  }}
                  className="column-filter date-filter"
                  onKeyDown={() => {
                    setFilters(prev => ({
                      ...prev,
                      rawCompletionDate: 'pending'
                    }));
                  }}
                />
                {(filters.completionDate || filters.rawCompletionDate) && (
                  <button 
                    className="clear-filter" 
                    onClick={() => setFilters(prev => ({ 
                      ...prev, 
                      completionDate: '',
                      rawCompletionDate: ''
                    }))}
                    title="Clear filter"
                  >×</button>
                )}
              </div>
            </th>
            <th>
              <div className="filter-container">
                <input
                  type="text"
                  placeholder="Filter notes..."
                  value={filters.notes}
                  onChange={(e) => setFilters(prev => ({ ...prev, notes: e.target.value }))}
                  className="column-filter"
                />
                {filters.notes && (
                  <button 
                    className="clear-filter" 
                    onClick={() => setFilters(prev => ({ ...prev, notes: '' }))}
                    title="Clear filter"
                  >×</button>
                )}
              </div>
            </th>
            <th>
              <div className="filter-container">
                <select
                  className="column-filter"
                  value={filters.action}
                  onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                >
                  <option value=""></option>
                  <option value="Delete">Delete</option>
                </select>
                {filters.action === '' && (
                  <span className="select-overlay-placeholder">Filter action...</span>
                )}
              </div>
            </th>
          </tr>
          <tr>
            <th style={{ width: '50px' }}>No</th>
            <th>Title</th>
            <th>Status</th>
            <th>Created Date</th>
            <th>Completion Date</th>
            <th>Notes</th>
            <th style={{ width: '80px' }}>Action</th>
          </tr>
        </thead>
      <tbody>
        {currentItems.map((task, index) => (
          <TaskItem 
            key={task.id} 
            task={task} 
            index={startIndex + index + 1}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </tbody>
    </table>
    <div className="pagination">
      <div className="pagination-info">
        Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} items
      </div>
      <div className="pagination-controls">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="pagination-button"
        >
          Previous
        </button>
        <div className="page-numbers">
          {/* First page */}
          <button
            onClick={() => setCurrentPage(1)}
            className={`page-number ${currentPage === 1 ? 'active' : ''}`}
            disabled={currentPage === 1}
          >
            1
          </button>

          {/* Show dots after first page */}
          {currentPage > 3 && <span className="page-ellipsis">...</span>}

          {/* Pages around current page */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => {
              if (page === 1 || page === totalPages) return false;
              return Math.abs(currentPage - page) <= 1;
            })
            .map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`page-number ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}

          {/* Show dots before last page */}
          {currentPage < totalPages - 2 && <span className="page-ellipsis">...</span>}

          {/* Last page */}
          {totalPages > 1 && (
            <button
              onClick={() => setCurrentPage(totalPages)}
              className={`page-number ${currentPage === totalPages ? 'active' : ''}`}
              disabled={currentPage === totalPages}
            >
              {totalPages}
            </button>
          )}
        </div>
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="pagination-button"
        >
          Next
        </button>
      </div>
      <div className="items-per-page">
        <label>
          Items per page:
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="items-per-page-select"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>
      </div>
    </div>
    </div>
  );
}