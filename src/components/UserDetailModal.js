import React, { useEffect, useState } from 'react';
import './UserDetailModal.css';
import { jobsAPI, bookingsAPI } from '../services/api';

const UserDetailModal = ({ user, onClose }) => {
  const [userJobs, setUserJobs] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserActivity();
    }
  }, [user]);

  const fetchUserActivity = async () => {
    try {
      setLoadingActivity(true);
      const [jobsRes, bookingsRes] = await Promise.all([
        jobsAPI.getAll(),
        bookingsAPI.getAll()
      ]);

      console.log('User data:', user);
      console.log('All jobs:', jobsRes.data);
      console.log('All bookings:', bookingsRes.data);

      // Filter jobs posted by this user
      // Jobs can have postedBy as an object with _id or just the _id string
      const relatedJobs = jobsRes.data.filter(job => {
        const postedById = job.postedBy?._id || job.postedBy;
        const userId = user._id;
        
        // Check if user posted this job
        const isPostedByUser = postedById === userId;
        
        // Check if user is in applicants array
        const isApplicant = job.applicants && job.applicants.some(applicant => {
          const applicantId = applicant?._id || applicant;
          return applicantId === userId;
        });
        
        return isPostedByUser || isApplicant;
      });

      // Filter bookings related to this user using Firebase UID
      const relatedBookings = bookingsRes.data.filter(booking => {
        const userFirebaseUid = user.firebaseUid;
        return (
          booking.employerFirebaseUid === userFirebaseUid || 
          booking.workerFirebaseUid === userFirebaseUid ||
          booking.employerUid === userFirebaseUid ||
          booking.workerUid === userFirebaseUid
        );
      });

      console.log('Filtered jobs for user:', relatedJobs);
      console.log('Filtered bookings for user:', relatedBookings);

      setUserJobs(relatedJobs);
      setUserBookings(relatedBookings);
    } catch (error) {
      console.error('Error fetching user activity:', error);
    } finally {
      setLoadingActivity(false);
    }
  };

  if (!user) return null;

  const BACKEND_URL = 'http://localhost:3001'; // Admin backend for images

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) return imagePath;
    // If it's a blob URL, return as is
    if (imagePath.startsWith('blob:')) return imagePath;
    // Otherwise, prepend backend URL
    return `${BACKEND_URL}${imagePath}`;
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleImageClick = (imageUrl) => {
    window.open(imageUrl, '_blank');
  };

  return (
    <div className="user-detail-page">
      <div className="user-detail-container">
        {/* Back Button */}
        <button className="back-to-users-btn" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Users
        </button>

        <div className="modal-body-new">
          {/* Profile Header Card */}
          <div className="profile-header-card">
            <div className="profile-photo-container">
              {user.profilePhoto && !user.profilePhoto.startsWith('blob:') ? (
                <img 
                  src={getImageUrl(user.profilePhoto)} 
                  alt={user.name} 
                  className="profile-photo-new"
                  onClick={() => handleImageClick(getImageUrl(user.profilePhoto))}
                  onError={(e) => {
                    console.error('Failed to load profile photo:', user.profilePhoto);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="profile-photo-placeholder-new" style={{ display: (user.profilePhoto && !user.profilePhoto.startsWith('blob:')) ? 'none' : 'flex' }}>
                {user.profilePhoto && user.profilePhoto.startsWith('blob:') ? '📷' : getInitials(user.name)}
              </div>
            </div>
            <div className="profile-header-info">
              <h2 className="profile-name-new">{user.name}</h2>
              <p className="profile-email-new">{user.email || 'Not provided'}</p>
              <div className="profile-badges-new">
                <span className={`badge-new ${user.type}`}>{user.type}</span>
                <span className={`badge-new ${user.status === 'active' ? 'approved' : 'pending'}`}>
                  {user.status === 'active' ? 'Approved' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* User Information Card */}
          <div className="info-card-new">
            <h3 className="card-title-new">User Information</h3>
            <div className="info-grid-new">
              <div className="info-field-new">
                <div className="field-icon-new">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="field-content-new">
                  <div className="field-label-new">Full Name</div>
                  <div className="field-value-new">{user.name}</div>
                </div>
              </div>

              <div className="info-field-new">
                <div className="field-icon-new">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                </div>
                <div className="field-content-new">
                  <div className="field-label-new">Email</div>
                  <div className="field-value-new">{user.email || 'Not provided'}</div>
                </div>
              </div>

              <div className="info-field-new">
                <div className="field-icon-new">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div className="field-content-new">
                  <div className="field-label-new">Phone Number</div>
                  <div className="field-value-new">{user.phone || user.phoneNumber || 'Not provided'}</div>
                </div>
              </div>

              <div className="info-field-new">
                <div className="field-icon-new">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="field-content-new">
                  <div className="field-label-new">Address</div>
                  <div className="field-value-new">{user.location || user.address || 'Not provided'}</div>
                </div>
              </div>

              <div className="info-field-new">
                <div className="field-icon-new">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <div className="field-content-new">
                  <div className="field-label-new">Role</div>
                  <div className="field-value-new">{user.type}</div>
                </div>
              </div>

              <div className="info-field-new">
                <div className="field-icon-new">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div className="field-content-new">
                  <div className="field-label-new">Joined Date</div>
                  <div className="field-value-new">{formatDate(user.createdAt)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Documents Card */}
          <div className="info-card-new">
            <h3 className="card-title-new">Verification Documents</h3>
            <div className="documents-grid-new">
              <div className="document-card-new">
                <div className="document-header-new">
                  <h4>ID Verification</h4>
                  <span className="document-type-new">Identity</span>
                </div>
                {user.nidFront && !user.nidFront.startsWith('blob:') ? (
                  <>
                    <div className="document-image-container-new">
                      <img 
                        src={getImageUrl(user.nidFront)} 
                        alt="NID Front" 
                        className="document-image-new"
                        onClick={() => handleImageClick(getImageUrl(user.nidFront))}
                        onError={(e) => {
                          console.error('Failed to load NID front:', user.nidFront);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="document-placeholder-new" style={{ display: 'none' }}>
                        Failed to load
                      </div>
                    </div>
                    <div className="document-footer-new">
                      Uploaded: {formatDate(user.createdAt)}
                    </div>
                  </>
                ) : (
                  <div className="document-image-container-new">
                    <div className="document-placeholder-new">
                      {user.nidFront && user.nidFront.startsWith('blob:') 
                        ? 'Image not uploaded' 
                        : 'Not uploaded'}
                    </div>
                  </div>
                )}
              </div>

              <div className="document-card-new">
                <div className="document-header-new">
                  <h4>Business License</h4>
                  <span className="document-type-new">License</span>
                </div>
                {user.nidBack && !user.nidBack.startsWith('blob:') ? (
                  <>
                    <div className="document-image-container-new">
                      <img 
                        src={getImageUrl(user.nidBack)} 
                        alt="NID Back" 
                        className="document-image-new"
                        onClick={() => handleImageClick(getImageUrl(user.nidBack))}
                        onError={(e) => {
                          console.error('Failed to load NID back:', user.nidBack);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="document-placeholder-new" style={{ display: 'none' }}>
                        Failed to load
                      </div>
                    </div>
                    <div className="document-footer-new">
                      Uploaded: {formatDate(user.createdAt)}
                    </div>
                  </>
                ) : (
                  <div className="document-image-container-new">
                    <div className="document-placeholder-new">
                      {user.nidBack && user.nidBack.startsWith('blob:') 
                        ? 'Image not uploaded' 
                        : 'Not uploaded'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Admin Actions Card */}
          <div className="info-card-new">
            <h3 className="card-title-new">Admin Actions</h3>
            <div className="admin-actions-section">
              <div className="current-status-section">
                <div className="status-label-new">Current Status</div>
                <span className={`status-badge-new ${user.status === 'active' ? 'approved' : 'pending'}`}>
                  {user.status === 'active' ? 'Approved' : 'Pending'}
                </span>
              </div>
              
              <div className="actions-buttons-section">
                <div className="actions-label-new">Actions</div>
                <div className="action-buttons-new">
                  <button className="action-btn-new approve">Approve</button>
                  <button className="action-btn-new reject">Reject</button>
                  <button className="action-btn-new ban">Ban User</button>
                </div>
              </div>

              <div className="admin-notes-section">
                <div className="notes-label-new">Admin Notes</div>
                <textarea 
                  className="admin-notes-textarea"
                  placeholder="Add notes about this verification..."
                  rows="4"
                ></textarea>
                <button className="save-notes-btn">Save Notes</button>
              </div>
            </div>
          </div>

          {/* Activity Cards - Jobs and Bookings */}
          <div className="activity-cards-grid">
            {/* Jobs Posted/Applied */}
            <div className="activity-card">
              <div className="activity-card-header">
                <h3 className="activity-card-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  {user.type === 'employer' ? 'Jobs Posted' : 'Jobs Applied'}
                </h3>
                <span className="activity-count">{userJobs.length}</span>
              </div>
              <div className="activity-list">
                {loadingActivity ? (
                  <div className="empty-activity">Loading...</div>
                ) : userJobs.length > 0 ? (
                  userJobs.slice(0, 5).map(job => (
                    <div key={job._id} className="activity-item">
                      <div className="activity-item-header">
                        <div className="activity-item-title">{job.title}</div>
                        <span className={`activity-item-status ${job.status || 'pending'}`}>
                          {job.status || 'pending'}
                        </span>
                      </div>
                      <div className="activity-item-meta">
                        <span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {job.location || 'Not specified'}
                        </span>
                        <span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-activity">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    <p>No jobs found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bookings */}
            <div className="activity-card">
              <div className="activity-card-header">
                <h3 className="activity-card-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Bookings
                </h3>
                <span className="activity-count">{userBookings.length}</span>
              </div>
              <div className="activity-list">
                {loadingActivity ? (
                  <div className="empty-activity">Loading...</div>
                ) : userBookings.length > 0 ? (
                  userBookings.slice(0, 5).map(booking => (
                    <div key={booking._id} className="activity-item">
                      <div className="activity-item-header">
                        <div className="activity-item-title">{booking.jobTitle || 'Booking'}</div>
                        <span className={`activity-item-status ${booking.bookingStatus || 'pending'}`}>
                          {booking.bookingStatus || 'pending'}
                        </span>
                      </div>
                      <div className="activity-item-meta">
                        <span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                          Rs. {booking.totalAmount || 'N/A'}
                        </span>
                        <span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-activity">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <p>No bookings found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
