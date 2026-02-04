import React, { useState, useEffect } from 'react';
import './AllUsers.css';
import { usersAPI } from '../services/api';
import UserDetailModal from './UserDetailModal';

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      // Filter out admin users and pending users
      const filteredUsers = response.data.filter(user => user.type !== 'admin' && user.status !== 'pending');
      console.log('Fetched users:', filteredUsers);
      console.log('Sample user profilePhoto:', filteredUsers[0]?.profilePhoto);
      setUsers(filteredUsers);
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
    console.log('Original photoPath:', photoPath);
    // If it's already a full URL, return it
    if (photoPath.startsWith('http')) return photoPath;
    // Remove leading slash if present
    const cleanPath = photoPath.startsWith('/') ? photoPath.substring(1) : photoPath;
    // Construct the backend URL
    const url = `http://localhost:3001/${cleanPath}`;
    console.log('Constructed URL:', url);
    return url;
  };

  const handleSuspend = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to suspend ${userName}?`)) {
      try {
        await usersAPI.suspend(userId);
        setUsers(users.map(user => 
          user._id === userId ? { ...user, status: 'suspended' } : user
        ));
        alert(`${userName} has been suspended.`);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to suspend user');
      }
    }
  };

  const handleActivate = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to activate ${userName}?`)) {
      try {
        await usersAPI.activate(userId);
        setUsers(users.map(user => 
          user._id === userId ? { ...user, status: 'active' } : user
        ));
        alert(`${userName} has been activated.`);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to activate user');
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

  if (loading) {
    return (
      <div className="all-users-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="all-users-container">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchUsers} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="all-users-container">
      <div className="users-header">
        <h2>All Users</h2>
        <div className="total-users-badge">{users.length} total users</div>
      </div>

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
            {users.length > 0 ? (
              users.map(user => (
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
                                console.error('Image failed to load:', e.target.src);
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
                    <span className={`status-badge ${user.status}`}>
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
                      {user.status === 'active' ? (
                        <button 
                          className="action-btn suspend"
                          onClick={() => handleSuspend(user._id, user.name)}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button 
                          className="action-btn activate"
                          onClick={() => handleActivate(user._id, user.name)}
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">
                  <div className="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <h3>No users found</h3>
                    <p>There are no users in the system yet.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <UserDetailModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
        />
      )}
    </div>
  );
};

export default AllUsers;
