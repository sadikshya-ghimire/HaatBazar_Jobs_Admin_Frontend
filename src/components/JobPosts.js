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
  const [filter, setFilter] = useState('all'); // all, active, closed, completed

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
    <>
      {selectedJob ? (
        <JobDetailModal 
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApprove={handleApprove}
          onDelete={handleDelete}
          onToggleStatus={toggleStatus}
        />
      ) : (
        <div className="job-posts-container">
          <div className="jobs-header">
            <h2>Job Posts Management</h2>
            <div className="jobs-stats">
              <span className="stat-item">Total: {jobs.length + pendingJobs.length}</span>
              <span className="stat-item pending">Pending: {pendingJobs.length}</span>
            </div>
          </div>

          <div className="jobs-filters-row">
            <div className="jobs-filters">
              <button 
                className={`filter-btn ${activeView === 'approved' ? 'active' : ''}`}
                onClick={() => setActiveView('approved')}
              >
                Approved Jobs ({jobs.length})
              </button>
              <button 
                className={`filter-btn ${activeView === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveView('pending')}
              >
                Pending ({pendingJobs.length})
              </button>
            </div>

            <div className="filter-divider"></div>

            <div className="filter-dropdown-container">
              <button className="filter-dropdown-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span>All Filters</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          </div>

          {displayJobs.length > 0 ? (
            <div className="jobs-table-container">
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Posted By</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Budget</th>
                    <th>Status</th>
                    <th>Posted Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayJobs.map(job => (
                    <tr key={job._id}>
                      <td>
                        <div className="job-title-cell">
                          <span className="job-title-text">{job.title}</span>
                          {job.urgent && (
                            <span className="urgent-badge-small">URGENT</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="posted-by-cell">
                          <span className="poster-name">{job.postedBy?.name || 'Unknown'}</span>
                          <span className="poster-type">({job.postedBy?.type || 'N/A'})</span>
                        </div>
                      </td>
                      <td>
                        <span className={`type-badge ${job.type}`}>
                          {job.type === 'worker' ? 'Job Seeker' : 'Employer'}
                        </span>
                      </td>
                      <td>{job.location || 'Not specified'}</td>
                      <td>NPR {job.budget || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${job.status}`}>
                          {job.status}
                        </span>
                      </td>
                      <td>{formatDate(job.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn view"
                            onClick={() => setSelectedJob(job)}
                            title="View Details"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          {activeView === 'pending' && (
                            <button 
                              className="action-btn approve"
                              onClick={() => handleApprove(job._id, job.title, job.collection)}
                              title="Approve"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </button>
                          )}
                          <button 
                            className="action-btn delete"
                            onClick={() => handleDelete(job._id, job.title, job.collection)}
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
                  ))}
                </tbody>
              </table>
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
        </div>
      )}
    </>
  );
};

export default JobPosts;
