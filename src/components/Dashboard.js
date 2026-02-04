import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import Users from './Users';
import JobPosts from './JobPosts';
import Bookings from './Bookings';
import { usersAPI, jobsAPI, bookingsAPI } from '../services/api';

const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    pendingJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalBookings: 0,
    pendingBookings: 0
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchDashboardData();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const usersResponse = await usersAPI.getAll();
      const allUsers = usersResponse.data;
      
      // Fetch pending users separately
      const pendingResponse = await usersAPI.getPending();
      const pendingUsers = pendingResponse.data;
      
      // Calculate stats
      const activeUsers = allUsers.filter(u => u.type !== 'admin' && u.status === 'active');
      
      // Fetch jobs
      const jobsResponse = await jobsAPI.getAll();
      const allJobs = jobsResponse.data;
      const pendingJobsResponse = await jobsAPI.getPending();
      const pendingJobsData = pendingJobsResponse.data;
      const activeJobsCount = allJobs.filter(j => j.status === 'active').length;
      const completedJobsCount = allJobs.filter(j => j.status === 'completed').length;
      
      // Fetch bookings
      const bookingsResponse = await bookingsAPI.getAll();
      const allBookings = bookingsResponse.data;
      const pendingBookingsCount = allBookings.filter(b => b.bookingStatus === 'pending').length;
      
      setStats({
        totalUsers: activeUsers.length,
        pendingApprovals: pendingUsers.length,
        pendingJobs: pendingJobsData.length,
        activeJobs: activeJobsCount,
        completedJobs: completedJobsCount,
        totalBookings: allBookings.length,
        pendingBookings: pendingBookingsCount
      });

      // Get recent activities (last 5 users and jobs)
      const recentActivities = [];
      
      // Add recent user registrations (combine active and pending)
      const allUsersForActivity = [...allUsers, ...pendingUsers];
      const recentUsers = [...allUsersForActivity]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
      
      recentUsers.forEach(user => {
        recentActivities.push({
          id: `user-${user._id}`,
          type: `New ${user.type} registration`,
          name: user.name,
          time: getTimeAgo(user.createdAt),
          color: user.type === 'worker' ? 'green' : 'yellow'
        });
      });

      // Add recent job posts
      const recentJobs = [...allJobs]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 2);
      
      recentJobs.forEach(job => {
        recentActivities.push({
          id: `job-${job._id}`,
          type: 'Job posted',
          name: job.title,
          time: getTimeAgo(job.createdAt),
          color: 'blue'
        });
      });

      // Sort by time and take top 5
      setActivities(recentActivities.slice(0, 5));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const statsData = [
    {
      id: 1,
      label: 'Total Users',
      value: stats.totalUsers.toString(),
      description: 'Active members',
      badge: '',
      color: 'blue',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      id: 2,
      label: 'Pending Approvals',
      value: stats.pendingApprovals.toString(),
      description: 'User accounts',
      badge: stats.pendingApprovals > 0 ? stats.pendingApprovals.toString() : '',
      color: 'orange',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    {
      id: 3,
      label: 'Pending Jobs',
      value: stats.pendingJobs.toString(),
      description: 'Awaiting approval',
      badge: stats.pendingJobs > 0 ? stats.pendingJobs.toString() : '',
      color: 'yellow',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      )
    },
    {
      id: 4,
      label: 'Active Jobs',
      value: stats.activeJobs.toString(),
      description: 'Currently open',
      badge: '',
      color: 'green',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      )
    },
    {
      id: 5,
      label: 'Completed Jobs',
      value: stats.completedJobs.toString(),
      description: 'All-time total',
      badge: '',
      color: 'purple',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      )
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <Users />;
      case 'jobs':
        return <JobPosts />;
      case 'bookings':
        return <Bookings />;
      case 'overview':
      default:
        return (
          <>
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading dashboard data...</p>
              </div>
            ) : (
              <>
                <div className="stats-grid">
                  {statsData.map(stat => (
                    <div key={stat.id} className={`stat-card ${stat.color}`}>
                      <div className="stat-header">
                        <div className="stat-icon">{stat.icon}</div>
                        {stat.badge && <div className="stat-badge">{stat.badge}</div>}
                      </div>
                      <div className="stat-content">
                        <div className="stat-label">{stat.label}</div>
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-description">{stat.description}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="activity-section">
                  <div className="activity-header">
                    <div className="activity-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                    </div>
                    <h2>Recent Activity</h2>
                  </div>
                  <div className="activity-list">
                    {activities.length > 0 ? (
                      activities.map(activity => (
                        <div key={activity.id} className={`activity-item ${activity.color}`}>
                          <div className="activity-content">
                            <div className={`activity-dot ${activity.color}`}></div>
                            <div className="activity-text">
                              {activity.type}: <strong>{activity.name}</strong>
                            </div>
                          </div>
                          <div className="activity-time">{activity.time}</div>
                        </div>
                      ))
                    ) : (
                      <div className="no-activity">
                        <p>No recent activity</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        );
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <h2>HaatBazar</h2>
        </div>

        <button 
          className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span>Dashboard</span>
        </button>

        <button 
          className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Users</span>
          {stats.pendingApprovals > 0 && (
            <span className="sidebar-badge">{stats.pendingApprovals}</span>
          )}
        </button>

        <button 
          className={`sidebar-item ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <span>Job Posts</span>
        </button>

        <button 
          className={`sidebar-item ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>Bookings</span>
          {stats.pendingBookings > 0 && (
            <span className="sidebar-badge">{stats.pendingBookings}</span>
          )}
        </button>
      </aside>

      <div className="main-content">
        <header className="dashboard-header">
          <div className="header-left">
            <p className="header-greeting">Welcome back, Admin 👋</p>
            <div className="header-title">
              <h1>Dashboard</h1>
            </div>
          </div>
          <div className="header-right">
            <button className="header-search-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            <button className="header-notification-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <div className="header-user" onClick={onLogout}>
              <div className="header-user-avatar">A</div>
              <span className="header-user-name">Admin Pro</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="search-bar">
            <span className="search-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input type="text" placeholder="Search users, jobs, or accounts..." />
            <span className="filter-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </span>
          </div>

          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending Approvals
              {stats.pendingApprovals > 0 && <span className="badge">{stats.pendingApprovals}</span>}
            </button>
            <button 
              className={`tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              All Users
            </button>
            <button 
              className={`tab ${activeTab === 'jobs' ? 'active' : ''}`}
              onClick={() => setActiveTab('jobs')}
            >
              Job Posts
            </button>
          </div>

          {renderContent()}
        </div>
      </div>

      <button className="help-button">?</button>
    </div>
  );
};

export default Dashboard;
