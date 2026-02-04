import React, { useState, useEffect } from 'react';
import './JobPosts.css';
import { jobsAPI } from '../services/api';
import JobDetailModal from './JobDetailModal';

const JobPosts = () => {
  const [jobs, setJobs] = useState([]);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [activeView, setActiveView] = useState('approved'); // 'approved' or 'pending'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const [approvedResponse, pendingResponse] = await Promise.all([
        jobsAPI.getAll(),
        jobsAPI.getPending()
      ]);
      setJobs(approvedResponse.data);
      setPendingJobs(pendingResponse.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch jobs');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (jobId, jobTitle, collection) => {
    if (window.confirm(`Are you sure you want to approve "${jobTitle}"?`)) {
      try {
        await jobsAPI.approve(jobId, collection);
        // Move job from pending to approved
        const approvedJob = pendingJobs.find(j => j._id === jobId);
        setPendingJobs(pendingJobs.filter(job => job._id !== jobId));
        setJobs([{ ...approvedJob, isApproved: true }, ...jobs]);
        alert('Job approved successfully!');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to approve job');
      }
    }
  };

  const handleDelete = async (jobId, jobTitle, collection) => {
    if (window.confirm(`Are you sure you want to delete "${jobTitle}"?`)) {
      try {
        await jobsAPI.delete(jobId, collection);
        setJobs(jobs.filter(job => job._id !== jobId));
        setPendingJobs(pendingJobs.filter(job => job._id !== jobId));
        alert('Job deleted successfully!');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete job');
      }
    }
  };

  const toggleStatus = async (jobId) => {
    const job = jobs.find(j => j._id === jobId);
    const newStatus = job.status === 'active' ? 'closed' : 'active';
    
    try {
      await jobsAPI.updateStatus(jobId, newStatus);
      setJobs(jobs.map(j => 
        j._id === jobId ? { ...j, status: newStatus } : j
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update job status');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const displayJobs = activeView === 'approved' ? jobs : pendingJobs;

  if (loading) {
    return (
      <div className="job-posts-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="job-posts-container">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchJobs} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="job-posts-container">
      <div className="jobs-header">
        <h2>Job Posts Management</h2>
        <div className="jobs-tabs">
          <button 
            className={`tab-btn ${activeView === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveView('approved')}
          >
            Approved Jobs
            <span className="tab-count">{jobs.length}</span>
          </button>
          <button 
            className={`tab-btn ${activeView === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveView('pending')}
          >
            Pending Approval
            {pendingJobs.length > 0 && <span className="tab-count pending">{pendingJobs.length}</span>}
          </button>
        </div>
      </div>

      {displayJobs.length > 0 ? (
        <div className="jobs-list">
          {displayJobs.map(job => (
            <div key={job._id} className="job-card">
              <div className="job-card-header">
                <div className="job-title-section">
                  <div className="job-title-row">
                    <h3>{job.title}</h3>
                    {job.urgent && (
                      <div className="urgent-badge">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 6v6l4 2" stroke="white" strokeWidth="2" fill="none" />
                        </svg>
                        URGENT
                      </div>
                    )}
                  </div>
                  <p className="posted-by">
                    Posted by: <span>{job.postedBy?.name || 'Unknown'}</span> ({job.postedBy?.type || 'N/A'})
                  </p>
                </div>
                <div className="job-actions">
                  <button 
                    className="view-details-btn"
                    onClick={() => setSelectedJob(job)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    View Details
                  </button>
                  {activeView === 'pending' ? (
                    <button 
                      className="approve-btn-job"
                      onClick={() => handleApprove(job._id, job.title, job.collection)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Approve
                    </button>
                  ) : (
                    <button 
                      className={`status-badge-job ${job.status}`}
                      onClick={() => toggleStatus(job._id)}
                    >
                      {job.status}
                    </button>
                  )}
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(job._id, job.title, job.collection)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="job-description">{job.description}</p>

              <div className="job-meta">
                <div className={`meta-item type ${job.type}`}>
                  {job.type === 'worker' ? 'Job Seeker' : 'Employer'}
                </div>
                {job.location && (
                  <div className="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{job.location}</span>
                  </div>
                )}
                {job.budget && (
                  <div className="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    <span>NPR {job.budget}</span>
                  </div>
                )}
                <div className="meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>{formatDate(job.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state-jobs">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <h3>No {activeView} job posts found</h3>
          <p>
            {activeView === 'pending' 
              ? 'There are no jobs waiting for approval. Jobs posted by users will appear here.'
              : 'There are no approved job posts yet. Approve pending jobs to see them here.'}
          </p>
        </div>
      )}

      {selectedJob && (
        <JobDetailModal 
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApprove={handleApprove}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default JobPosts;
