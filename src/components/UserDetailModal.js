import React, { useEffect } from 'react';
import './UserDetailModal.css';

const UserDetailModal = ({ user, onClose }) => {
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>User Details</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Profile Section */}
          <div className="profile-section">
            <div className="profile-photo-container">
              {user.profilePhoto && !user.profilePhoto.startsWith('blob:') ? (
                <img 
                  src={getImageUrl(user.profilePhoto)} 
                  alt={user.name} 
                  className="profile-photo"
                  onClick={() => handleImageClick(getImageUrl(user.profilePhoto))}
                  onError={(e) => {
                    console.error('Failed to load profile photo:', user.profilePhoto);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="profile-photo-placeholder" style={{ display: (user.profilePhoto && !user.profilePhoto.startsWith('blob:')) ? 'none' : 'flex' }}>
                {user.profilePhoto && user.profilePhoto.startsWith('blob:') ? '📷' : getInitials(user.name)}
              </div>
            </div>
            <div className="profile-info">
              <h3 className="profile-name">{user.name}</h3>
              <div className="profile-badges">
                <span className={`badge ${user.type}`}>{user.type}</span>
                <span className={`badge ${user.status === 'active' ? 'verified' : 'pending'}`}>
                  {user.status === 'active' ? 'Verified' : 'Pending Approval'}
                </span>
              </div>
              {user.rating > 0 && (
                <div className="profile-rating">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  {user.rating.toFixed(1)} Rating
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
                Email
              </div>
              <div className="info-value">{user.email || 'Not provided'}</div>
            </div>

            <div className="info-item">
              <div className="info-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Phone
              </div>
              <div className="info-value">{user.phone || user.phoneNumber || 'Not provided'}</div>
            </div>

            <div className="info-item">
              <div className="info-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Location
              </div>
              <div className="info-value">{user.location || 'Not provided'}</div>
            </div>

            <div className="info-item">
              <div className="info-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Joined
              </div>
              <div className="info-value">{formatDate(user.createdAt)}</div>
            </div>

            {/* Worker-specific fields */}
            {user.type === 'worker' && (
              <>
                <div className="info-item">
                  <div className="info-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Total Jobs
                  </div>
                  <div className="info-value">{user.totalJobs || 0}</div>
                </div>

                <div className="info-item">
                  <div className="info-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Completed Jobs
                  </div>
                  <div className="info-value">{user.completedJobs || 0}</div>
                </div>

                {user.availability && user.availability.length > 0 && (
                  <div className="info-item">
                    <div className="info-label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      Availability
                    </div>
                    <div className="info-value">{user.availability.join(', ')}</div>
                  </div>
                )}
              </>
            )}

            {/* Employer-specific fields */}
            {user.type === 'employer' && (
              <>
                {user.fullName && (
                  <div className="info-item">
                    <div className="info-label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Full Name
                    </div>
                    <div className="info-value">{user.fullName}</div>
                  </div>
                )}

                {user.company && (
                  <div className="info-item">
                    <div className="info-label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                      Company Name
                    </div>
                    <div className="info-value">{user.company}</div>
                  </div>
                )}

                {user.address && (
                  <div className="info-item">
                    <div className="info-label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      Address
                    </div>
                    <div className="info-value">{user.address}</div>
                  </div>
                )}

                {user.city && (
                  <div className="info-item">
                    <div className="info-label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      City
                    </div>
                    <div className="info-value">{user.city}</div>
                  </div>
                )}

                {user.district && (
                  <div className="info-item">
                    <div className="info-label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      District
                    </div>
                    <div className="info-value">{user.district}</div>
                  </div>
                )}

                <div className="info-item">
                  <div className="info-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    Total Jobs Posted
                  </div>
                  <div className="info-value">{user.totalJobsPosted || 0}</div>
                </div>

                <div className="info-item">
                  <div className="info-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Active Jobs
                  </div>
                  <div className="info-value">{user.activeJobs || 0}</div>
                </div>
              </>
            )}

            {user.firebaseUid && (
              <div className="info-item">
                <div className="info-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Firebase UID
                </div>
                <div className="info-value" style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                  {user.firebaseUid}
                </div>
              </div>
            )}
          </div>

          {/* Skills Section (for workers) */}
          {user.type === 'worker' && user.skills && user.skills.length > 0 && (
            <div className="skills-section">
              <h3 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                Skills
              </h3>
              <div className="skills-list">
                {user.skills.map((skill, index) => (
                  <span key={index} className="skill-item">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Documents Section */}
          <div className="documents-section">
            <h3 className="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Identity Documents
            </h3>
            <div className="documents-grid">
              <div className="document-card">
                <div className="document-label">NID Front</div>
                {user.nidFront && !user.nidFront.startsWith('blob:') ? (
                  <>
                    <img 
                      src={getImageUrl(user.nidFront)} 
                      alt="NID Front" 
                      className="document-image"
                      onClick={() => handleImageClick(getImageUrl(user.nidFront))}
                      onError={(e) => {
                        console.error('Failed to load NID front:', user.nidFront);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="document-placeholder" style={{ display: 'none' }}>
                      Failed to load image
                    </div>
                    <button 
                      className="view-full-btn"
                      onClick={() => handleImageClick(getImageUrl(user.nidFront))}
                    >
                      View Full Size
                    </button>
                  </>
                ) : (
                  <div className="document-placeholder">
                    {user.nidFront && user.nidFront.startsWith('blob:') 
                      ? '⚠️ Image not properly uploaded (blob URL)' 
                      : 'Not uploaded'}
                  </div>
                )}
              </div>

              <div className="document-card">
                <div className="document-label">NID Back</div>
                {user.nidBack && !user.nidBack.startsWith('blob:') ? (
                  <>
                    <img 
                      src={getImageUrl(user.nidBack)} 
                      alt="NID Back" 
                      className="document-image"
                      onClick={() => handleImageClick(getImageUrl(user.nidBack))}
                      onError={(e) => {
                        console.error('Failed to load NID back:', user.nidBack);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="document-placeholder" style={{ display: 'none' }}>
                      Failed to load image
                    </div>
                    <button 
                      className="view-full-btn"
                      onClick={() => handleImageClick(getImageUrl(user.nidBack))}
                    >
                      View Full Size
                    </button>
                  </>
                ) : (
                  <div className="document-placeholder">
                    {user.nidBack && user.nidBack.startsWith('blob:') 
                      ? '⚠️ Image not properly uploaded (blob URL)' 
                      : 'Not uploaded'}
                  </div>
                )}
              </div>

              {user.nidNumber && (
                <div className="document-card">
                  <div className="document-label">NID Number</div>
                  <div className="info-value" style={{ padding: '20px', fontSize: '18px', fontWeight: '600' }}>
                    {user.nidNumber}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
