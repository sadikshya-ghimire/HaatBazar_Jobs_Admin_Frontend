import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import Users from './Users';
import JobPosts from './JobPosts';
import Bookings from './Bookings';
import { usersAPI, jobsAPI, bookingsAPI } from '../services/api';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    pendingJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalBookings: 0,
    pendingBookings: 0,
    newUsersThisWeek: 0,
    totalRevenue: 0,
    revenueGrowth: 0,
    userGrowth: 0
  });
  const [insights, setInsights] = useState({
    mostPopularSkill: '',
    mostActiveUser: '',
    jobsPostedToday: 0,
    pendingDisputes: 0,
    reportedUsers: 0,
    failedPayments: 0
  });
  const [growthData, setGrowthData] = useState({
    userGrowth: [],
    revenueGrowth: []
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = React.useRef(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [timePeriod, setTimePeriod] = useState('6months'); // 7days, 30days, 6months, 12months

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchDashboardData();
    }
  }, [activeTab, timePeriod]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const fetchNotifications = async () => {
    try {
      // Fetch all data for notifications
      const [usersRes, pendingUsersRes, jobsRes, pendingJobsRes, bookingsRes] = await Promise.all([
        usersAPI.getAll(),
        usersAPI.getPending(),
        jobsAPI.getAll(),
        jobsAPI.getPending(),
        bookingsAPI.getAll()
      ]);

      const allNotifications = [];

      // Pending user approvals
      pendingUsersRes.data.forEach(user => {
        allNotifications.push({
          id: `user-pending-${user._id}`,
          type: 'user_approval',
          title: 'New User Registration',
          message: `${user.name} (${user.type}) is waiting for approval`,
          time: new Date(user.createdAt),
          icon: 'user',
          color: 'orange',
          unread: true,
          action: () => setActiveTab('users')
        });
      });

      // Pending job approvals
      pendingJobsRes.data.forEach(job => {
        allNotifications.push({
          id: `job-pending-${job._id}`,
          type: 'job_approval',
          title: 'New Job Post',
          message: `"${job.title}" needs approval`,
          time: new Date(job.createdAt),
          icon: 'briefcase',
          color: 'yellow',
          unread: true,
          action: () => setActiveTab('jobs')
        });
      });

      // Pending bookings
      const pendingBookings = bookingsRes.data.filter(b => 
        b.bookingStatus === 'pending' || (b.adminApproval === true && !b.workerApproval)
      );
      
      pendingBookings.forEach(booking => {
        allNotifications.push({
          id: `booking-pending-${booking._id}`,
          type: 'booking_approval',
          title: 'New Booking Request',
          message: `Booking for ${booking.jobTitle || 'a job'} needs review`,
          time: new Date(booking.createdAt),
          icon: 'calendar',
          color: 'blue',
          unread: true,
          action: () => setActiveTab('bookings')
        });
      });

      // Recent completed jobs (last 24 hours)
      const recentCompleted = jobsRes.data.filter(job => {
        if (job.status === 'completed' && job.updatedAt) {
          const hoursSince = (new Date() - new Date(job.updatedAt)) / (1000 * 60 * 60);
          return hoursSince < 24;
        }
        return false;
      });

      recentCompleted.forEach(job => {
        allNotifications.push({
          id: `job-completed-${job._id}`,
          type: 'job_completed',
          title: 'Job Completed',
          message: `"${job.title}" has been marked as completed`,
          time: new Date(job.updatedAt),
          icon: 'check',
          color: 'green',
          unread: false,
          action: () => setActiveTab('jobs')
        });
      });

      // Sort by time (newest first)
      allNotifications.sort((a, b) => b.time - a.time);

      // Get read notifications from localStorage
      const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
      
      // Mark notifications as read if they're in localStorage
      allNotifications.forEach(notification => {
        if (readNotifications.includes(notification.id)) {
          notification.unread = false;
        }
      });

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => n.unread).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

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
      
      // Calculate new users this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const newUsersThisWeek = allUsers.filter(u => new Date(u.createdAt) > oneWeekAgo).length;
      
      // Calculate user growth percentage
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const usersLastWeek = allUsers.filter(u => {
        const createdDate = new Date(u.createdAt);
        return createdDate > twoWeeksAgo && createdDate <= oneWeekAgo;
      }).length;
      const userGrowth = usersLastWeek > 0 ? ((newUsersThisWeek - usersLastWeek) / usersLastWeek * 100).toFixed(1) : 0;
      
      // Fetch jobs
      const jobsResponse = await jobsAPI.getAll();
      const allJobs = jobsResponse.data;
      const pendingJobsResponse = await jobsAPI.getPending();
      const pendingJobsData = pendingJobsResponse.data;
      const activeJobsCount = allJobs.filter(j => j.status === 'active').length;
      const completedJobsCount = allJobs.filter(j => j.status === 'completed').length;
      
      // Jobs posted today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const jobsPostedToday = allJobs.filter(j => new Date(j.createdAt) >= today).length;
      
      // Fetch bookings
      const bookingsResponse = await bookingsAPI.getAll();
      const allBookings = bookingsResponse.data;
      const pendingBookingsCount = allBookings.filter(b => b.bookingStatus === 'pending').length;
      
      // Calculate revenue (sum of completed bookings with payment)
      const totalRevenue = allBookings
        .filter(b => b.paymentCompleted && b.totalAmount)
        .reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0);
      
      // Calculate revenue growth
      const revenueLastMonth = allBookings
        .filter(b => {
          const bookingDate = new Date(b.createdAt);
          const lastMonth = new Date();
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          return b.paymentCompleted && bookingDate <= lastMonth;
        })
        .reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0);
      const revenueGrowth = revenueLastMonth > 0 ? ((totalRevenue - revenueLastMonth) / revenueLastMonth * 100).toFixed(1) : 0;
      
      // Find most popular skill
      const skillCounts = {};
      allUsers.forEach(user => {
        if (user.skills && Array.isArray(user.skills)) {
          user.skills.forEach(skill => {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          });
        }
      });
      const mostPopularSkill = Object.keys(skillCounts).length > 0
        ? Object.entries(skillCounts).sort((a, b) => b[1] - a[1])[0][0]
        : 'N/A';
      
      // Find most active user (most jobs completed)
      const mostActiveUser = allUsers.length > 0
        ? allUsers.sort((a, b) => (b.jobsCompleted || 0) - (a.jobsCompleted || 0))[0]?.name || 'N/A'
        : 'N/A';
      
      // Failed payments
      const failedPayments = allBookings.filter(b => b.paymentStatus === 'failed').length;
      
      setStats({
        totalUsers: activeUsers.length,
        pendingApprovals: pendingUsers.length,
        pendingJobs: pendingJobsData.length,
        activeJobs: activeJobsCount,
        completedJobs: completedJobsCount,
        totalBookings: allBookings.length,
        pendingBookings: pendingBookingsCount,
        newUsersThisWeek,
        totalRevenue,
        revenueGrowth,
        userGrowth
      });
      
      setInsights({
        mostPopularSkill,
        mostActiveUser,
        jobsPostedToday,
        pendingDisputes: 0, // Would need dispute collection
        reportedUsers: 0, // Would need reports collection
        failedPayments
      });

      // Calculate growth data for charts based on selected time period
      const growthDataArray = [];
      let periods, periodCount, formatLabel;

      switch (timePeriod) {
        case '7days':
          periods = 7;
          periodCount = 7;
          formatLabel = (date) => date.toLocaleDateString('en-US', { weekday: 'short' });
          break;
        case '30days':
          periods = 30;
          periodCount = 30;
          formatLabel = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          break;
        case '6months':
          periods = 6;
          periodCount = 6;
          formatLabel = (date) => date.toLocaleDateString('en-US', { month: 'short' });
          break;
        case '12months':
          periods = 12;
          periodCount = 12;
          formatLabel = (date) => date.toLocaleDateString('en-US', { month: 'short' });
          break;
        default:
          periods = 6;
          periodCount = 6;
          formatLabel = (date) => date.toLocaleDateString('en-US', { month: 'short' });
      }

      const monthlyUserGrowth = [];
      const monthlyRevenue = [];
      
      if (timePeriod === '7days' || timePeriod === '30days') {
        // Daily data
        for (let i = periodCount - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
          const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
          
          // Count users registered on this day
          const usersInDay = allUsers.filter(u => {
            const createdDate = new Date(u.createdAt);
            return createdDate >= dayStart && createdDate <= dayEnd;
          }).length;
          
          // Calculate revenue for this day
          const revenueInDay = allBookings
            .filter(b => {
              if (!b.paymentCompleted || !b.createdAt) return false;
              const bookingDate = new Date(b.createdAt);
              return bookingDate >= dayStart && bookingDate <= dayEnd;
            })
            .reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0);
          
          monthlyUserGrowth.push({
            month: formatLabel(date),
            value: usersInDay
          });
          
          monthlyRevenue.push({
            month: formatLabel(date),
            value: revenueInDay
          });
        }
      } else {
        // Monthly data
        for (let i = periodCount - 1; i >= 0; i--) {
          const monthDate = new Date();
          monthDate.setMonth(monthDate.getMonth() - i);
          const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
          const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
          
          // Count users registered in this month
          const usersInMonth = allUsers.filter(u => {
            const createdDate = new Date(u.createdAt);
            return createdDate >= monthStart && createdDate <= monthEnd;
          }).length;
          
          // Calculate revenue for this month
          const revenueInMonth = allBookings
            .filter(b => {
              if (!b.paymentCompleted || !b.createdAt) return false;
              const bookingDate = new Date(b.createdAt);
              return bookingDate >= monthStart && bookingDate <= monthEnd;
            })
            .reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0);
          
          monthlyUserGrowth.push({
            month: formatLabel(monthDate),
            value: usersInMonth
          });
          
          monthlyRevenue.push({
            month: formatLabel(monthDate),
            value: revenueInMonth
          });
        }
      }
      
      setGrowthData({
        userGrowth: monthlyUserGrowth,
        revenueGrowth: monthlyRevenue
      });

      // Get recent activities (last 10 users and jobs)
      const recentActivities = [];
      
      // Add recent user registrations (combine active and pending)
      const allUsersForActivity = [...allUsers, ...pendingUsers];
      const recentUsers = [...allUsersForActivity]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      
      recentUsers.forEach(user => {
        recentActivities.push({
          id: `user-${user._id}`,
          type: `New ${user.type} registration`,
          name: user.name,
          time: getTimeAgo(user.createdAt),
          color: user.type === 'worker' ? 'green' : 'yellow',
          icon: 'user'
        });
      });

      // Add recent job posts
      const recentJobs = [...allJobs]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
      
      recentJobs.forEach(job => {
        recentActivities.push({
          id: `job-${job._id}`,
          type: 'Job posted',
          name: job.title,
          time: getTimeAgo(job.createdAt),
          color: 'blue',
          icon: 'briefcase'
        });
      });
      
      // Add recent completed bookings
      const recentBookings = [...allBookings]
        .filter(b => b.paymentCompleted)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 2);
      
      recentBookings.forEach(booking => {
        recentActivities.push({
          id: `booking-${booking._id}`,
          type: 'Payment completed',
          name: `Rs. ${booking.totalAmount || 'N/A'}`,
          time: getTimeAgo(booking.updatedAt),
          color: 'green',
          icon: 'dollar'
        });
      });

      // Sort by time and take top 10
      setActivities(recentActivities.slice(0, 10));
      
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

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    
    setIsTransitioning(true);
    
    // Faster transition - change content almost immediately
    setTimeout(() => {
      setActiveTab(newTab);
    }, 80);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 120);
  };

  const handleNotificationClick = (notification) => {
    if (notification.action) {
      notification.action();
    }
    setShowNotifications(false);
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, unread: false }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);
    
    // Save read notification IDs to localStorage
    const readNotificationIds = notifications.map(n => n.id);
    localStorage.setItem('readNotifications', JSON.stringify(readNotificationIds));
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'users':
        return 'User Management';
      case 'jobs':
        return 'Job Posts Management';
      case 'bookings':
        return 'Booking Management';
      case 'overview':
      default:
        return 'Dashboard';
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value" style={{ color: payload[0].color }}>
            {payload[0].name}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  const getActivityIcon = (iconType) => {
    switch (iconType) {
      case 'user':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case 'briefcase':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        );
      case 'dollar':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getNotificationIcon = (iconType) => {
    switch (iconType) {
      case 'user':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case 'briefcase':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        );
      case 'calendar':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case 'check':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const statsData = [
    {
      id: 1,
      label: 'Total Users',
      value: stats.totalUsers.toString(),
      description: 'vs last month',
      growth: `${stats.userGrowth}%`,
      growthPositive: stats.userGrowth >= 0,
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
      label: 'Active Jobs',
      value: stats.activeJobs.toString(),
      description: 'vs last month',
      growth: '',
      badge: '',
      color: 'purple',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      )
    },
    {
      id: 3,
      label: 'Total Revenue',
      value: `Rs. ${stats.totalRevenue.toLocaleString()}`,
      description: 'vs last month',
      growth: `${stats.revenueGrowth}%`,
      growthPositive: stats.revenueGrowth >= 0,
      badge: '',
      color: 'green',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    },
    {
      id: 4,
      label: 'New Users (Week)',
      value: stats.newUsersThisWeek.toString(),
      description: 'vs last week',
      growth: `${stats.userGrowth}%`,
      growthPositive: stats.userGrowth >= 0,
      badge: '',
      color: 'pink',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
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
                      <div className="stat-body">
                        <div className="stat-info">
                          <div className="stat-label">{stat.label}</div>
                          <div className="stat-value">{stat.value}</div>
                          {stat.growth && (
                            <div className={`stat-growth-inline ${stat.growthPositive ? 'positive' : 'negative'}`}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points={stat.growthPositive ? "18 15 12 9 6 15" : "18 9 12 15 6 9"} />
                              </svg>
                              {stat.growth} {stat.description}
                            </div>
                          )}
                        </div>
                        <div className="stat-icon-wrapper">
                          <div className="stat-icon">{stat.icon}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Growth Charts */}
                <div className="charts-section">
                  {/* Time Period Filter */}
                  <div className="time-period-filter">
                    <button 
                      className={`period-btn ${timePeriod === '7days' ? 'active' : ''}`}
                      onClick={() => setTimePeriod('7days')}
                    >
                      7 Days
                    </button>
                    <button 
                      className={`period-btn ${timePeriod === '30days' ? 'active' : ''}`}
                      onClick={() => setTimePeriod('30days')}
                    >
                      30 Days
                    </button>
                    <button 
                      className={`period-btn ${timePeriod === '6months' ? 'active' : ''}`}
                      onClick={() => setTimePeriod('6months')}
                    >
                      6 Months
                    </button>
                    <button 
                      className={`period-btn ${timePeriod === '12months' ? 'active' : ''}`}
                      onClick={() => setTimePeriod('12months')}
                    >
                      12 Months
                    </button>
                  </div>

                  {/* User Growth Chart */}
                  <div className="chart-card">
                    <div className="chart-header">
                      <h3>User Growth</h3>
                      <div className="chart-legend">
                        <span className="legend-dot" style={{ background: '#4facb8' }}></span>
                        <span>
                          {timePeriod === '7days' ? 'Last 7 days' : 
                           timePeriod === '30days' ? 'Last 30 days' : 
                           timePeriod === '6months' ? 'Last 6 months' : 
                           'Last 12 months'}
                        </span>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={growthData.userGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4facb8" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#4facb8" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#9ca3af" 
                          style={{ fontSize: '12px' }}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="#9ca3af" 
                          style={{ fontSize: '12px' }}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#4facb8" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorUsers)"
                          name="New Users"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="chart-stats">
                      <div className="chart-stat">
                        <span className="stat-label-small">Current Month</span>
                        <span className="stat-value-small">
                          {growthData.userGrowth[growthData.userGrowth.length - 1]?.value || 0}
                        </span>
                      </div>
                      <div className="chart-stat">
                        <span className="stat-label-small">6-Month Avg</span>
                        <span className="stat-value-small">
                          {Math.round(growthData.userGrowth.reduce((sum, d) => sum + d.value, 0) / growthData.userGrowth.length) || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Trend Chart */}
                  <div className="chart-card">
                    <div className="chart-header">
                      <h3>Revenue Trend</h3>
                      <div className="chart-legend">
                        <span className="legend-dot" style={{ background: '#10b981' }}></span>
                        <span>
                          {timePeriod === '7days' ? 'Last 7 days' : 
                           timePeriod === '30days' ? 'Last 30 days' : 
                           timePeriod === '6months' ? 'Last 6 months' : 
                           'Last 12 months'}
                        </span>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={growthData.revenueGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis 
                          dataKey="month" 
                          stroke="#9ca3af" 
                          style={{ fontSize: '12px' }}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="#9ca3af" 
                          style={{ fontSize: '12px' }}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorRevenue)"
                          name="Revenue (Rs.)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="chart-stats">
                      <div className="chart-stat">
                        <span className="stat-label-small">Current Month</span>
                        <span className="stat-value-small">
                          Rs. {growthData.revenueGrowth[growthData.revenueGrowth.length - 1]?.value.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="chart-stat">
                        <span className="stat-label-small">6-Month Avg</span>
                        <span className="stat-value-small">
                          Rs. {Math.round(growthData.revenueGrowth.reduce((sum, d) => sum + d.value, 0) / growthData.revenueGrowth.length).toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="dashboard-bottom-grid">
                  <div className="activity-section">
                    <div className="activity-header">
                      <h2>Recent Activity</h2>
                      <span className="live-indicator">
                        <span className="live-dot"></span>
                        Live
                      </span>
                    </div>
                    <div className="activity-list">
                      {activities.length > 0 ? (
                        activities.map(activity => (
                          <div key={activity.id} className="activity-item-new">
                            <div className={`activity-avatar ${activity.color}`}>
                              {activity.icon === 'user' && (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                  <circle cx="12" cy="7" r="4" />
                                </svg>
                              )}
                              {activity.icon === 'briefcase' && (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                </svg>
                              )}
                              {activity.icon === 'dollar' && (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <path d="M12 6v12M15 9H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H9" />
                                </svg>
                              )}
                            </div>
                            <div className="activity-details">
                              <div className="activity-title">{activity.name}</div>
                              <div className="activity-subtitle">{activity.type}</div>
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

                  {/* Alerts Panel */}
                  <div className="alerts-section">
                    <div className="alerts-header">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <h2>Alerts & Issues</h2>
                    </div>
                    <div className="alerts-list-new">
                      <div className="alert-item-new red">
                        <div className="alert-bar"></div>
                        <div className="alert-content-new">
                          <div className="alert-title">Pending Approvals</div>
                          <div className="alert-time">{stats.pendingApprovals} users waiting</div>
                        </div>
                      </div>
                      <div className="alert-item-new yellow">
                        <div className="alert-bar"></div>
                        <div className="alert-content-new">
                          <div className="alert-title">Failed Payments</div>
                          <div className="alert-time">{insights.failedPayments} transactions</div>
                        </div>
                      </div>
                      <div className="alert-item-new red">
                        <div className="alert-bar"></div>
                        <div className="alert-content-new">
                          <div className="alert-title">Pending Jobs</div>
                          <div className="alert-time">{stats.pendingJobs} posts</div>
                        </div>
                      </div>
                      <div className="alert-item-new blue">
                        <div className="alert-bar"></div>
                        <div className="alert-content-new">
                          <div className="alert-title">Pending Bookings</div>
                          <div className="alert-time">{stats.pendingBookings} bookings</div>
                        </div>
                      </div>
                    </div>
                    <button className="view-all-btn">
                      View All Issues →
                    </button>
                  </div>
                </div>

                {/* Quick Insights - Purple Gradient */}
                <div className="insights-gradient-section">
                  <div className="insights-gradient-header">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    <h2>Quick Insights</h2>
                  </div>
                  <div className="insights-gradient-grid">
                    <div className="insight-gradient-card">
                      <div className="insight-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="16 18 22 12 16 6" />
                          <polyline points="8 6 2 12 8 18" />
                        </svg>
                      </div>
                      <div className="insight-content">
                        <div className="insight-label-gradient">Most Popular Skill</div>
                        <div className="insight-value-gradient">{insights.mostPopularSkill}</div>
                        <div className="insight-meta">{stats.totalUsers} active projects</div>
                      </div>
                    </div>
                    <div className="insight-gradient-card">
                      <div className="insight-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                      <div className="insight-content">
                        <div className="insight-label-gradient">Most Active User</div>
                        <div className="insight-value-gradient">{insights.mostActiveUser}</div>
                        <div className="insight-meta">{stats.completedJobs} completed projects</div>
                      </div>
                    </div>
                    <div className="insight-gradient-card">
                      <div className="insight-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                      </div>
                      <div className="insight-content">
                        <div className="insight-label-gradient">Jobs Posted Today</div>
                        <div className="insight-value-gradient">{insights.jobsPostedToday}</div>
                        <div className="insight-meta">↑ 15% from yesterday</div>
                      </div>
                    </div>
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
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
        <div className="sidebar-logo">
          <img src="/Logo.png" alt="HaatBazar Logo" className="sidebar-logo-image" />
          <h2>HaatBazar Jobs</h2>
          <p>admin@haatbazarjobs.com</p>
        </div>

        <button 
          className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
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
          onClick={() => handleTabChange('users')}
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
          onClick={() => handleTabChange('jobs')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <span>Job Posts</span>
        </button>

        <button 
          className={`sidebar-item ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => handleTabChange('bookings')}
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
              <h1>{getPageTitle()}</h1>
            </div>
          </div>
          <div className="header-right">
            <div className="notification-wrapper" ref={notificationRef}>
              <button 
                className="header-notification-icon"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>

              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h3>Notifications</h3>
                    {unreadCount > 0 && (
                      <button className="mark-read-btn" onClick={markAllAsRead}>
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="notifications-list">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`notification-item ${notification.color} ${notification.unread ? 'unread' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className={`notification-icon ${notification.color}`}>
                            {getNotificationIcon(notification.icon)}
                          </div>
                          <div className="notification-content">
                            <div className="notification-title">{notification.title}</div>
                            <div className="notification-message">{notification.message}</div>
                            <div className="notification-time">{getTimeAgo(notification.time)}</div>
                          </div>
                          {notification.unread && <div className="unread-dot"></div>}
                        </div>
                      ))
                    ) : (
                      <div className="no-notifications">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <p>No notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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

          <div className={`tabs-content ${isTransitioning ? 'transitioning' : ''}`}>
            {renderContent()}
          </div>
        </div>
      </div>

      <button className="help-button">?</button>
    </div>
  );
};

export default Dashboard;
