import React, { useState, useEffect } from 'react';
import './Issues.css';
import { issuesAPI } from '../services/api';

const Issues = () => {
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    filterIssues();
  }, [filter, issues, searchTerm]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await issuesAPI.getAll();
      setIssues(response.data);
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterIssues = () => {
    let filtered = issues;

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(issue => issue.status === filter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(issue =>
        issue.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredIssues(filtered);
  };

  const handleViewIssue = (issue) => {
    setSelectedIssue(issue);
    setAdminNotes(issue.adminNotes || '');
    setShowModal(true);
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedIssue) return;

    try {
      await issuesAPI.updateStatus(
        selectedIssue._id,
        status,
        adminNotes,
        'admin@haatbazarjobs.com'
      );
      await fetchIssues();
      setShowModal(false);
      setSelectedIssue(null);
    } catch (error) {
      console.error('Error updating issue status:', error);
      alert('Failed to update issue status');
    }
  };

  const handleUpdatePriority = async (issueId, priority) => {
    try {
      await issuesAPI.updatePriority(issueId, priority);
      await fetchIssues();
    } catch (error) {
      console.error('Error updating priority:', error);
      alert('Failed to update priority');
    }
  };

  const handleDeleteIssue = async (issueId) => {
    if (!window.confirm('Are you sure you want to delete this issue?')) return;

    try {
      await issuesAPI.delete(issueId);
      await fetchIssues();
      if (selectedIssue?._id === issueId) {
        setShowModal(false);
        setSelectedIssue(null);
      }
    } catch (error) {
      console.error('Error deleting issue:', error);
      alert('Failed to delete issue');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { color: '#f59e0b', bg: '#fef3c7', label: 'Open' },
      'in-progress': { color: '#3b82f6', bg: '#dbeafe', label: 'In Progress' },
      resolved: { color: '#10b981', bg: '#d1fae5', label: 'Resolved' },
      closed: { color: '#6b7280', bg: '#f3f4f6', label: 'Closed' }
    };

    const config = statusConfig[status] || statusConfig.open;
    return (
      <span className="status-badge" style={{ background: config.bg, color: config.color }}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { color: '#6b7280', bg: '#f3f4f6', label: 'Low' },
      medium: { color: '#f59e0b', bg: '#fef3c7', label: 'Medium' },
      high: { color: '#ef4444', bg: '#fee2e2', label: 'High' },
      urgent: { color: '#dc2626', bg: '#fecaca', label: 'Urgent' }
    };

    const config = priorityConfig[priority] || priorityConfig.medium;
    return (
      <span className="priority-badge" style={{ background: config.bg, color: config.color }}>
        {config.label}
      </span>
    );
  };

  const getIssueTypeIcon = (type) => {
    const icons = {
      payment: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v12M15 9H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H9" />
        </svg>
      ),
      account: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      job: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
      booking: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      technical: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l-4.2-4.2" />
        </svg>
      ),
      other: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      )
    };

    return icons[type] || icons.other;
  };

  const stats = {
    total: issues.length,
    open: issues.filter(i => i.status === 'open').length,
    inProgress: issues.filter(i => i.status === 'in-progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length
  };

  if (loading) {
    return (
      <div className="issues-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading issues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="issues-container">
      {/* Stats Cards */}
      <div className="issues-stats">
        <div className="issue-stat-card">
          <div className="issue-stat-label">Total Issues</div>
          <div className="issue-stat-value">{stats.total}</div>
        </div>
        <div className="issue-stat-card">
          <div className="issue-stat-label">Open</div>
          <div className="issue-stat-value" style={{ color: '#f59e0b' }}>{stats.open}</div>
        </div>
        <div className="issue-stat-card">
          <div className="issue-stat-label">In Progress</div>
          <div className="issue-stat-value" style={{ color: '#3b82f6' }}>{stats.inProgress}</div>
        </div>
        <div className="issue-stat-card">
          <div className="issue-stat-label">Resolved</div>
          <div className="issue-stat-value" style={{ color: '#10b981' }}>{stats.resolved}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="issues-filters">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Issues ({issues.length})
          </button>
          <button
            className={`filter-btn ${filter === 'open' ? 'active' : ''}`}
            onClick={() => setFilter('open')}
          >
            Open ({stats.open})
          </button>
          <button
            className={`filter-btn ${filter === 'in-progress' ? 'active' : ''}`}
            onClick={() => setFilter('in-progress')}
          >
            In Progress ({stats.inProgress})
          </button>
          <button
            className={`filter-btn ${filter === 'resolved' ? 'active' : ''}`}
            onClick={() => setFilter('resolved')}
          >
            Resolved ({stats.resolved})
          </button>
          <button
            className={`filter-btn ${filter === 'closed' ? 'active' : ''}`}
            onClick={() => setFilter('closed')}
          >
            Closed
          </button>
        </div>

        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search issues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Issues Table */}
      <div className="issues-table-container">
        <table className="issues-table">
          <thead>
            <tr>
              <th>Issue ID</th>
              <th>User</th>
              <th>Type</th>
              <th>Subject</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIssues.length > 0 ? (
              filteredIssues.map((issue) => (
                <tr key={issue._id}>
                  <td>
                    <span className="issue-id">#{issue._id.slice(-6)}</span>
                  </td>
                  <td>
                    <div className="user-cell">
                      <div className="user-name">{issue.userName}</div>
                      <div className="user-email">{issue.userEmail}</div>
                    </div>
                  </td>
                  <td>
                    <div className="issue-type">
                      {getIssueTypeIcon(issue.issueType)}
                      <span>{issue.issueType}</span>
                    </div>
                  </td>
                  <td>
                    <div className="issue-subject">{issue.subject}</div>
                  </td>
                  <td>
                    <select
                      className="priority-select"
                      value={issue.priority}
                      onChange={(e) => handleUpdatePriority(issue._id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </td>
                  <td>{getStatusBadge(issue.status)}</td>
                  <td>
                    <div className="date-cell">
                      {new Date(issue.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn view"
                        onClick={() => handleViewIssue(issue)}
                        title="View Details"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDeleteIssue(issue._id)}
                        title="Delete"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-data">
                  No issues found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Issue Detail Modal */}
      {showModal && selectedIssue && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="issue-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Issue Details</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="issue-detail-header">
                <div className="issue-detail-id">Issue #{selectedIssue._id.slice(-6)}</div>
                <div className="issue-detail-badges">
                  {getPriorityBadge(selectedIssue.priority)}
                  {getStatusBadge(selectedIssue.status)}
                </div>
              </div>

              <div className="issue-detail-section">
                <h3>User Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedIssue.userName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedIssue.userEmail}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">User Type:</span>
                    <span className="detail-value">{selectedIssue.userType}</span>
                  </div>
                </div>
              </div>

              <div className="issue-detail-section">
                <h3>Issue Information</h3>
                <div className="detail-item">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{selectedIssue.issueType}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Subject:</span>
                  <span className="detail-value">{selectedIssue.subject}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Description:</span>
                  <div className="detail-description">{selectedIssue.description}</div>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Created:</span>
                  <span className="detail-value">
                    {new Date(selectedIssue.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              <div className="issue-detail-section">
                <h3>Admin Notes</h3>
                <textarea
                  className="admin-notes-input"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this issue..."
                  rows="4"
                />
              </div>

              {selectedIssue.resolvedAt && (
                <div className="issue-detail-section">
                  <h3>Resolution Information</h3>
                  <div className="detail-item">
                    <span className="detail-label">Resolved By:</span>
                    <span className="detail-value">{selectedIssue.resolvedBy || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Resolved At:</span>
                    <span className="detail-value">
                      {new Date(selectedIssue.resolvedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              {selectedIssue.status === 'open' && (
                <button
                  className="modal-btn primary"
                  onClick={() => handleUpdateStatus('in-progress')}
                >
                  Mark In Progress
                </button>
              )}
              {selectedIssue.status === 'in-progress' && (
                <button
                  className="modal-btn success"
                  onClick={() => handleUpdateStatus('resolved')}
                >
                  Mark Resolved
                </button>
              )}
              {(selectedIssue.status === 'resolved' || selectedIssue.status === 'in-progress') && (
                <button
                  className="modal-btn"
                  onClick={() => handleUpdateStatus('closed')}
                >
                  Close Issue
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Issues;
