import React, { useState, useEffect } from 'react';
import './JobDetailModal.css';
import { bookingsAPI } from '../services/api';

const JobDetailModal = ({ job, onClose, onApprove, onDelete, onToggleStatus }) => {
  const [jobBookings, setJobBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    if (job) {
      fetchJobBookings();
    }
  }, [job]);

  const fetchJobBookings = async () => {
    try {
      setLoadingBookings(true);
      const bookingsRes = await bookingsAPI.getAll();
      
      // Filter bookings related to this job
      const relatedBookings = bookingsRes.data.filter(booking =>
        booking.jobId === job._id || booking.workerJobOfferId === job._id
      );

      setJobBookings(relatedBookings);
    } catch (error) {
      console.error('Error fetching job bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  if (!job) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="job-detail-page">
      <div className="job-detail-container">
        {/* Back Button */}
        <button className="back-to-jobs-btn" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Jobs
        </button>

        {/* Job Header Card */}
        <div className="job-header-card">
          <div className="job-header-info">
            <h2 className="job-title-new">{job.title}</h2>
            <p className="job-posted-by">Posted by: {job.postedBy?.name || 'Unknown'}</p>
            <div className="job-badges-new">
              <span className={`badge-new ${job.type}`}>
                {job.type === 'worker' ? 'Worker' : 'Employer'}
              </span>
              <span className={`badge-new ${job.isApproved ? 'approved' : 'pending'}`}>
                {job.isApproved ? 'Approved' : 'Pending'}
              </span>
              {job.urgent && <span className="badge-new urgent">Urgent</span>}
              <span className={`badge-new ${job.status}`}>{job.status}</span>
            </div>
          </div>
        </div>

        {/* Job Information Card */}
        <div className="info-card-new">
          <h3 className="card-title-new">Job Information</h3>
          <div className="info-grid-new">
            <div className="info-field-new">
              <div className="field-icon-new">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="field-content-new">
                <div className="field-label-new">Location</div>
                <div className="field-value-new">{job.location || 'Not specified'}</div>
              </div>
            </div>

            <div className="info-field-new">
              <div className="field-icon-new">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="field-content-new">
                <div className="field-label-new">Budget</div>
                <div className="field-value-new">NPR {job.budget || 'Not specified'}</div>
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
                <div className="field-label-new">Posted Date</div>
                <div className="field-value-new">{formatDate(job.createdAt)}</div>
              </div>
            </div>

            <div className="info-field-new">
              <div className="field-icon-new">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div className="field-content-new">
                <div className="field-label-new">Status</div>
                <div className="field-value-new">{job.status}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Description Card */}
        <div className="info-card-new">
          <h3 className="card-title-new">Description</h3>
          <p className="job-description-full">{job.description}</p>
        </div>

        {/* Skills Card (if available) */}
        {job.skills && job.skills.length > 0 && (
          <div className="info-card-new">
            <h3 className="card-title-new">Required Skills</h3>
            <div className="skills-list-job">
              {job.skills.map((skill, index) => (
                <span key={index} className="skill-tag">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* Bookings Card */}
        <div className="info-card-new">
          <div className="activity-card-header">
            <h3 className="card-title-new">Bookings for this Job</h3>
            <span className="activity-count">{jobBookings.length}</span>
          </div>
          <div className="activity-list">
            {loadingBookings ? (
              <div className="empty-activity">Loading...</div>
            ) : jobBookings.length > 0 ? (
              jobBookings.map(booking => (
                <div key={booking._id} className="activity-item">
                  <div className="activity-item-header">
                    <div className="activity-item-title">
                      {booking.workerName || booking.employerName || 'Booking'}
                    </div>
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
                      {formatDate(booking.createdAt)}
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

        {/* Admin Actions Card */}
        <div className="info-card-new">
          <h3 className="card-title-new">Admin Actions</h3>
          <div className="admin-actions-section">
            <div className="current-status-section">
              <div className="status-label-new">Current Status</div>
              <span className={`status-badge-new ${job.isApproved ? 'approved' : 'pending'}`}>
                {job.isApproved ? 'Approved' : 'Pending Approval'}
              </span>
            </div>
            
            <div className="actions-buttons-section">
              <div className="actions-label-new">Actions</div>
              <div className="action-buttons-new">
                {!job.isApproved && onApprove && (
                  <button 
                    className="action-btn-new approve"
                    onClick={() => {
                      onApprove(job._id, job.title, job.collection);
                      onClose();
                    }}
                  >
                    Approve Job
                  </button>
                )}
                {onToggleStatus && (
                  <button 
                    className="action-btn-new"
                    onClick={() => {
                      onToggleStatus(job._id);
                      onClose();
                    }}
                  >
                    Toggle Status
                  </button>
                )}
                {onDelete && (
                  <button 
                    className="action-btn-new reject"
                    onClick={() => {
                      onDelete(job._id, job.title, job.collection);
                      onClose();
                    }}
                  >
                    Delete Job
                  </button>
                )}
              </div>
            </div>

            <div className="admin-notes-section">
              <div className="notes-label-new">Admin Notes</div>
              <textarea 
                className="admin-notes-textarea"
                placeholder="Add notes about this job post..."
                rows="4"
              ></textarea>
              <button className="save-notes-btn">Save Notes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailModal;
