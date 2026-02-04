import React, { useState, useEffect } from 'react';
import './Users.css';
import { usersAPI } from '../services/api';
import UserDetailModal from './UserDetailModal';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, active, suspended
  const [typeFilter, setTypeFilter] = useState('all'); // all, worker, employer
  const [ratingFilter, setRatingFilter] = useState('all'); // all, high, medium, low, unrated
  const [sortFilter, setSortFilter] = useState('newest'); // newest, oldest, name
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [allUsersResponse, pendingUsersResponse] = await Promise.all([
        usersAPI.getAll(),
        usersAPI.getPending()
      ]);
      
      // Combine all users and pending users, filter out admins
      const allUsers = [...allUsersResponse.data, ...pendingUsersResponse.data]
        .filter(user => user.type !== 'admin');
      
      setUsers(allUsers);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProfilePhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    const cleanPath = photoPath.startsWith('/') ? photoPath.substring(1) : photoPath;
    return `http://localhost:3001/${cleanPath}`;
  };

  const handleApprove = async (userId, userName) => {
    if (window.confirm(`Approve ${userName}?`)) {
      try {
        await usersAPI.approve(userId);
        fetchUsers();
        alert(`${userName} has been approved.`);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to approve user');
      }
    }
  };

  const handleSuspend = async (userId, userName) => {
    if (window.confirm(`Suspend ${userName}?`)) {
      try {
        await usersAPI.suspend(userId);
        fetchUsers();
        alert(`${userName} has been suspended.`);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to suspend user');
      }
    }
  };

  const handleActivate = async (userId, userName) => {
    if (window.confirm(`Activate ${userName}?`)) {
      try {
        await usersAPI.activate(userId);
        fetchUsers();
        alert(`${userName} has been activated.`);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to activate user');
      }
    }
  };

  const handleDelete = async (userId, userName) => {
    if (window.confirm(`Delete ${userName}? This action cannot be undone.`)) {
      try {
        await usersAPI.delete(userId);
        fetchUsers();
        alert(`${userName} has been deleted.`);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleView = (user) => {
    setSelectedUser(user);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredUsers = users.filter(user => {
    // Filter by status
    const statusMatch = filter === 'all' || user.status === filter;
    // Filter by type
    const typeMatch = typeFilter === 'all' || user.type === typeFilter;
    // Filter by rating
    let ratingMatch = true;
    if (ratingFilter === 'high') ratingMatch = user.rating >= 4;
    else if (ratingFilter === 'medium') ratingMatch = user.rating >= 2 && user.rating < 4;
    else if (ratingFilter === 'low') ratingMatch = user.rating > 0 && user.rating < 2;
    else if (ratingFilter === 'unrated') ratingMatch = !user.rating || user.rating === 0;
    
    return statusMatch && typeMatch && ratingMatch;
  }).sort((a, b) => {
    // Sort users
    if (sortFilter === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortFilter === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    } else if (sortFilter === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'active': return 'green';
      case 'suspended': return 'red';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="users-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-container">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchUsers} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  const pendingCount = users.filter(u => u.status === 'pending').length;
  const activeCount = users.filter(u => u.status === 'active').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;
  const workerCount = users.filter(u => u.type === 'worker').length;
  const employerCount = users.filter(u => u.type === 'employer').length;
  const highRatingCount = users.filter(u => u.rating >= 4).length;
  const mediumRatingCount = users.filter(u => u.rating >= 2 && u.rating < 4).length;
  const lowRatingCount = users.filter(u => u.rating > 0 && u.rating < 2).length;
  const unratedCount = users.filter(u => !u.rating || u.rating === 0).length;

  const getFilterLabel = () => {
    const parts = [];
    
    if (typeFilter !== 'all') {
      parts.push(typeFilter === 'worker' ? 'Workers' : 'Employers');
    }
    
    if (ratingFilter !== 'all') {
      if (ratingFilter === 'high') parts.push('High Rating');
      else if (ratingFilter === 'medium') parts.push('Medium Rating');
      else if (ratingFilter === 'low') parts.push('Low Rating');
      else if (ratingFilter === 'unrated') parts.push('Unrated');
    }
    
    if (sortFilter !== 'newest') {
      if (sortFilter === 'oldest') parts.push('Oldest First');
      else if (sortFilter === 'name') parts.push('A-Z');
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'All Filters';
  };

  return (
    <div className="users-container">
      <div className="users-header">
        <h2>User Management</h2>
        <div className="users-stats">
          <span className="stat-item">Total: {users.length}</span>
          <span className="stat-item pending">Pending: {pendingCount}</span>
        </div>
      </div>

      <div className="users-filters-row">
        <div className="users-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Users ({users.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({pendingCount})
          </button>
          <button 
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({activeCount})
          </button>
          <button 
            className={`filter-btn ${filter === 'suspended' ? 'active' : ''}`}
            onClick={() => setFilter('suspended')}
          >
            Suspended ({suspendedCount})
          </button>
        </div>

        <div className="filter-divider"></div>

        <div className="filter-dropdown-container">
          <button 
            className="filter-dropdown-btn"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span>{getFilterLabel()}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          
          {showFilterDropdown && (
            <div className="filter-dropdown-menu filter-dropdown-menu-wide">
              <div className="filter-section">
                <div className="filter-section-title">User Type</div>
                <button 
                  className={`filter-dropdown-item ${typeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setTypeFilter('all')}
                >
                  <span>All Types</span>
                  <span className="filter-count">{users.length}</span>
                </button>
                <button 
                  className={`filter-dropdown-item ${typeFilter === 'worker' ? 'active' : ''}`}
                  onClick={() => setTypeFilter('worker')}
                >
                  <span>Workers</span>
                  <span className="filter-count">{workerCount}</span>
                </button>
                <button 
                  className={`filter-dropdown-item ${typeFilter === 'employer' ? 'active' : ''}`}
                  onClick={() => setTypeFilter('employer')}
                >
                  <span>Employers</span>
                  <span className="filter-count">{employerCount}</span>
                </button>
              </div>

              <div className="filter-section-divider"></div>

              <div className="filter-section">
                <div className="filter-section-title">Rating</div>
                <button 
                  className={`filter-dropdown-item ${ratingFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setRatingFilter('all')}
                >
                  <span>All Ratings</span>
                  <span className="filter-count">{users.length}</span>
                </button>
                <button 
                  className={`filter-dropdown-item ${ratingFilter === 'high' ? 'active' : ''}`}
                  onClick={() => setRatingFilter('high')}
                >
                  <span>High (4+)</span>
                  <span className="filter-count">{highRatingCount}</span>
                </button>
                <button 
                  className={`filter-dropdown-item ${ratingFilter === 'medium' ? 'active' : ''}`}
                  onClick={() => setRatingFilter('medium')}
                >
                  <span>Medium (2-4)</span>
                  <span className="filter-count">{mediumRatingCount}</span>
                </button>
                <button 
                  className={`filter-dropdown-item ${ratingFilter === 'low' ? 'active' : ''}`}
                  onClick={() => setRatingFilter('low')}
                >
                  <span>Low (&lt;2)</span>
                  <span className="filter-count">{lowRatingCount}</span>
                </button>
                <button 
                  className={`filter-dropdown-item ${ratingFilter === 'unrated' ? 'active' : ''}`}
                  onClick={() => setRatingFilter('unrated')}
                >
                  <span>Unrated</span>
                  <span className="filter-count">{unratedCount}</span>
                </button>
              </div>

              <div className="filter-section-divider"></div>

              <div className="filter-section">
                <div className="filter-section-title">Sort By</div>
                <button 
                  className={`filter-dropdown-item ${sortFilter === 'newest' ? 'active' : ''}`}
                  onClick={() => setSortFilter('newest')}
                >
                  <span>Newest First</span>
                </button>
                <button 
                  className={`filter-dropdown-item ${sortFilter === 'oldest' ? 'active' : ''}`}
                  onClick={() => setSortFilter('oldest')}
                >
                  <span>Oldest First</span>
                </button>
                <button 
                  className={`filter-dropdown-item ${sortFilter === 'name' ? 'active' : ''}`}
                  onClick={() => setSortFilter('name')}
                >
                  <span>Name (A-Z)</span>
                </button>
              </div>

              <div className="filter-section-divider"></div>

              <div className="filter-actions">
                <button 
                  className="filter-reset-btn"
                  onClick={() => {
                    setTypeFilter('all');
                    setRatingFilter('all');
                    setSortFilter('newest');
                  }}
                >
                  Reset All
                </button>
                <button 
                  className="filter-apply-btn"
                  onClick={() => setShowFilterDropdown(false)}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-state-users">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <h3>No users found</h3>
          <p>There are no users matching your filter</p>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>USER</th>
                <th>TYPE</th>
                <th>STATUS</th>
                <th>JOIN DATE</th>
                <th>JOBS</th>
                <th>RATING</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-small">
                        {user.profilePhoto ? (
                          <>
                            <img 
                              src={getProfilePhotoUrl(user.profilePhoto)} 
                              alt={user.name}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <span style={{ display: 'none' }}>
                              {getInitials(user.name)}
                            </span>
                          </>
                        ) : (
                          <span>
                            {getInitials(user.name)}
                          </span>
                        )}
                      </div>
                      <span className="user-name">{user.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`type-badge ${user.type}`}>
                      {user.type}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>{user.jobsCompleted || 0}</td>
                  <td>
                    <div className="rating-cell">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {user.rating ? user.rating.toFixed(1) : '0.0'}
                    </div>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button 
                        className="action-btn view"
                        onClick={() => handleView(user)}
                      >
                        View
                      </button>
                      {user.status === 'pending' && (
                        <button 
                          className="action-btn approve"
                          onClick={() => handleApprove(user._id, user.name)}
                        >
                          Approve
                        </button>
                      )}
                      {user.status === 'active' && (
                        <button 
                          className="action-btn suspend"
                          onClick={() => handleSuspend(user._id, user.name)}
                        >
                          Suspend
                        </button>
                      )}
                      {user.status === 'suspended' && (
                        <button 
                          className="action-btn activate"
                          onClick={() => handleActivate(user._id, user.name)}
                        >
                          Activate
                        </button>
                      )}
                      {(user.status === 'pending' || user.status === 'suspended') && (
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDelete(user._id, user.name)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <UserDetailModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
        />
      )}
    </div>
  );
};

export default Users;
