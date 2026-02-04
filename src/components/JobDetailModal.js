import React, { useEffect } from 'react';
import './JobDetailModal.css';

const JobDetailModal = ({ job, onClose, onApprove, onDelete }) => {
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  if (!job) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="job-modal-overlay" onClick={onClose}>
      <div className="job-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="job-modal-header">
          <h2>Job Details</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="job-modal-body">
          {/* Job Header */}
          <div className="job-header-section">
            <div className="job-title-area">
              <h3>{job.title}</h3>
              <div className="job-badges">
                <span className={`badge ${job.type}`}>
                  {job.type === 'worker' ? 'Job Seeker' : 'Employer'}
                </span>
                <span className={`badge ${job.isApproved ? 'approved' : 'pending'}`}>
                  {job.isApproved ? 'Approved' : 'Pending Approval'}
                </span>
                {job.urgent && (
                  <span className="badge urgent">Urgent</span>
                )}
              </div>
            </div>
          </div>

          {/* Posted By */}
          {job.postedBy && (
            <div className="posted-by-section">
              <h4>Posted By</h4>
              <div className="posted-by-info">
                <div className="poster-avatar">
                  {job.postedBy.profilePhoto ? (
                    <img 
                      src={`http://localhost:3001/${job.postedBy.profilePhoto}`}
                      alt={job.postedBy.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span style={{ display: job.postedBy.profilePhoto ? 'none' : 'flex' }}>
                    {job.postedBy.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="poster-name">{job.postedBy.name}</p>
                  <p className="poster-type">{job.postedBy.type}</p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="job-section">
            <h4>Description</h4>
            <p className="job-description-text">{job.description}</p>
          </div>

          {/* Job Details Grid */}
          <div className="job-details-grid">
            <div className="detail-item">
              <div className="detail-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Location
              </div>
              <div className="detail-value">{job.location || 'Not specified'}</div>
            </div>

            {job.budget && (
              <div className="detail-item">
                <div className="detail-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  {job.type === 'worker' ? 'Expected Salary' : 'Budget'}
                </div>
                <div className="detail-value">NPR {job.budget}</div>
              </div>
            )}

            <div className="detail-item">
              <div className="detail-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Status
              </div>
              <div className="detail-value">
                <span className={`status-indicator ${job.status}`}>{job.status}</span>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Posted Date
              </div>
              <div className="detail-value">{formatDate(job.createdAt)}</div>
            </div>

            {job.availability && (
              <div className="detail-item">
                <div className="detail-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Availability
                </div>
                <div className="detail-value">{job.availability}</div>
              </div>
            )}

            {job.experience && (
              <div className="detail-item">
                <div className="detail-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                  Experience
                </div>
                <div className="detail-value">{job.experience}</div>
              </div>
            )}

            {job.duration && (
              <div className="detail-item">
                <div className="detail-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Duration
                </div>
                <div className="detail-value">{job.duration}</div>
              </div>
            )}

            {job.rateType && (
              <div className="detail-item">
                <div className="detail-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  Rate Type
                </div>
                <div className="detail-value">{job.rateType}</div>
              </div>
            )}

            {job.paymentType && (
              <div className="detail-item">
                <div className="detail-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  Payment Type
                </div>
                <div className="detail-value">{job.paymentType}</div>
              </div>
            )}
          </div>

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="job-section">
              <h4>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                {job.type === 'worker' ? 'Skills' : 'Required Skills'}
              </h4>
              <div className="skills-list-modal">
                {job.skills.map((skill, index) => (
                  <span key={index} className="skill-tag-modal">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Applicants (for employer jobs) */}
          {job.type === 'employer' && job.applicants && (
            <div className="job-section">
              <h4>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Applicants
              </h4>
              <p className="applicants-count">{job.applicants.length} applicant(s)</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="job-modal-actions">
            {!job.isApproved && onApprove && (
              <button 
                className="modal-approve-btn"
                onClick={() => {
                  onApprove(job._id, job.title, job.collection);
                  onClose();
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Approve Job
              </button>
            )}
            {onDelete && (
              <button 
                className="modal-delete-btn"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete "${job.title}"?`)) {
                    onDelete(job._id, job.title, job.collection);
                    onClose();
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Delete Job
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailModal;
