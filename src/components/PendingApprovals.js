import React, { useState, useEffect } from 'react';
import './PendingApprovals.css';
import { usersAPI } from '../services/api';
import UserDetailModal from './UserDetailModal';

const PendingApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getPending();
      console.log('Fetched pending users:', response.data);
      console.log('Sample pending user profilePhoto:', response.data[0]?.profilePhoto);
      setPendingUsers(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending users');
      console.error('Error fetching pending users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, name) => {
    if (window.confirm(`Are you sure you want to approve ${name}?`)) {
      try {
        await usersAPI.approve(id);
        // Remove from pending list
        setPendingUsers(pendingUsers.filter(user => user._id !== id));
        alert(`${name} has been approved successfully!`);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to approve user');
      }
    }
  };

  const handleReject = async (id, name) => {
    if (window.confirm(`Are you sure you want to reject ${name}? This will delete their account.`)) {
      try {
        await usersAPI.delete(id);
        // Remove from pending list
        setPendingUsers(pendingUsers.filter(user => user._id !== id));
        alert(`${name} has been rejected and removed.`);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to reject user');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `Submitted ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
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

  if (loading) {
    return (
      <div className="pending-approvals-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading pending approvals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pending-approvals-container">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchPendingUsers} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pending-approvals-container">
      <div className="approvals-header">
        <h2>Pending Account Approvals</h2>
        <div className="pending-badge">{pendingUsers.length} pending</div>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="empty-state-approvals">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <h3>No pending approvals</h3>
          <p>All user registrations have been reviewed.</p>
        </div>
      ) : (
        <div className="approvals-grid">
          {pendingUsers.map(user => (
            <div key={user._id} className="approval-card">
            <div className="card-header">
              <div className="user-info">
                <div className={`user-avatar ${user.type === 'worker' ? 'blue' : 'purple'}`}>
                  {user.profilePhoto ? (
                    <>
                      <img 
                        src={getProfilePhotoUrl(user.profilePhoto)} 
                        alt={user.name}
                        onError={(e) => {
                          console.error('Image failed to load:', e.target.src);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <svg 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        style={{ display: 'none' }}
                      >
                        {user.type === 'worker' ? (
                          <>
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </>
                        ) : (
                          <>
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                          </>
                        )}
                      </svg>
                    </>
                  ) : (
                    <svg 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      {user.type === 'worker' ? (
                        <>
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </>
                      ) : (
                        <>
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </>
                      )}
                    </svg>
                  )}
                </div>
                <div className="user-details">
                  <h3>{user.name}</h3>
                  <span className={`user-type ${user.type}`}>{user.type}</span>
                </div>
              </div>
              <button className="view-btn" onClick={() => setSelectedUser(user)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>

            <div className="card-content">
              <div className="info-row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>{user.phone}</span>
              </div>

              <div className="info-row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
                <span>{user.email}</span>
              </div>

              <div className="info-row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{user.location}</span>
              </div>

              <div className="info-row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{formatDate(user.createdAt)}</span>
              </div>

              {user.skills && user.skills.length > 0 && (
                <div className="skills-row">
                  {user.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              )}

              {user.company && (
                <div className="company-row">
                  <span>Company: {user.company || 'Not specified'}</span>
                </div>
              )}
            </div>

            <div className="card-actions">
              <button 
                className="approve-btn"
                onClick={() => handleApprove(user._id, user.name)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Approve
              </button>
              <button 
                className="reject-btn"
                onClick={() => handleReject(user._id, user.name)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                Reject
              </button>
            </div>
          </div>
        ))}
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

export default PendingApprovals;
