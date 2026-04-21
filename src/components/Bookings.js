import React, { useState, useEffect } from 'react';
import './Bookings.css';
import { bookingsAPI } from '../services/api';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('Fetching bookings from API...');
      const response = await bookingsAPI.getAll();
      console.log('Bookings response:', response);
      console.log('Bookings data:', response.data);
      setBookings(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await bookingsAPI.approve(id, adminNotes);
      fetchBookings();
      setShowModal(false);
      setAdminNotes('');
    } catch (err) {
      console.error('Error approving booking:', err);
      alert('Failed to approve booking');
    }
  };

  const handleReject = async (id) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      await bookingsAPI.reject(id, rejectionReason);
      fetchBookings();
      setShowModal(false);
      setRejectionReason('');
    } catch (err) {
      console.error('Error rejecting booking:', err);
      alert('Failed to reject booking');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await bookingsAPI.delete(id);
        fetchBookings();
      } catch (err) {
        console.error('Error deleting booking:', err);
        alert('Failed to delete booking');
      }
    }
  };

  useEffect(() => {
    if (showModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showModal]);

  const openModal = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
    setAdminNotes('');
    setRejectionReason('');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
    setAdminNotes('');
    setRejectionReason('');
  };

  const filteredBookings = bookings.filter(booking => {
    // Only show bookings where paymentCompleted is true
    if (!booking.paymentCompleted) return false;
    
    if (filter === 'all') return true;
    // Check both bookingStatus and status fields
    return booking.bookingStatus === filter || booking.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'accepted': return 'orange';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'completed': return 'blue';
      case 'cancelled': return 'gray';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button className="retry-btn" onClick={fetchBookings}>Retry</button>
      </div>
    );
  }

  return (
    <div className="bookings-container">
      <div className="bookings-header">
        <h2>Booking Management</h2>
        <div className="bookings-stats">
          <span className="stat-item">Total: {bookings.length}</span>
          <span className="stat-item pending">Pending: {bookings.filter(b => (b.bookingStatus === 'pending' || b.status === 'pending' || b.status === 'accepted')).length}</span>
        </div>
      </div>

      <div className="bookings-filters-row">
        <div className="bookings-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Bookings ({bookings.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({bookings.filter(b => b.bookingStatus === 'pending' || b.status === 'pending').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved ({bookings.filter(b => b.bookingStatus === 'approved' || b.status === 'approved').length})
          </button>
          <button 
            className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected ({bookings.filter(b => b.bookingStatus === 'rejected' || b.status === 'rejected').length})
          </button>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="empty-state-bookings">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h3>No bookings found</h3>
          <p>There are no bookings matching your filter</p>
        </div>
      ) : (
        <div className="bookings-table-container">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>JOB TITLE</th>
                <th>WORKER</th>
                <th>EMPLOYER</th>
                <th>LOCATION</th>
                <th>AMOUNT</th>
                <th>PAYMENT</th>
                <th>STATUS</th>
                <th>DATE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(booking => (
                <tr key={booking._id}>
                  <td>
                    <div className="job-title-cell">
                      <span className="job-title-text">{booking.jobTitle || 'No Title'}</span>
                    </div>
                  </td>
                  <td>{booking.workerName || 'N/A'}</td>
                  <td>{booking.employerName || 'N/A'}</td>
                  <td>{booking.area || booking.location?.area || 'N/A'}</td>
                  <td>Rs. {booking.totalAmount || 'N/A'}</td>
                  <td>
                    <span className="payment-badge paid">
                      {booking.paymentMethod || 'Paid'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      booking.adminApproval && booking.workerApproval 
                        ? 'green' 
                        : booking.adminApproval && !booking.workerApproval 
                        ? 'orange' 
                        : getStatusColor(booking.bookingStatus || booking.status)
                    }`}>
                      {booking.adminApproval && booking.workerApproval 
                        ? 'Fully Approved' 
                        : booking.adminApproval && !booking.workerApproval 
                        ? 'Awaiting Worker' 
                        : booking.bookingStatus || booking.status}
                    </span>
                  </td>
                  <td>{new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn view"
                        onClick={() => openModal(booking)}
                        title="View Details"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      {!booking.adminApproval && (
                        <button 
                          className="action-btn approve"
                          onClick={() => handleApprove(booking._id)}
                          title="Approve"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                      )}
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDelete(booking._id)}
                        title="Delete"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      )}

      {/* Modal for booking details */}
      {showModal && selectedBooking && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button className="close-modal-btn" onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="booking-detail-section">
                <h3>Job Information</h3>
                <div className="booking-detail-row">
                  <span className="booking-detail-label">Title:</span>
                  <span className="booking-detail-value">{selectedBooking.jobTitle || 'N/A'}</span>
                </div>
                <div className="booking-detail-row">
                  <span className="booking-detail-label">Location:</span>
                  <span className="booking-detail-value">{selectedBooking.area}, {selectedBooking.district}</span>
                </div>
                <div className="booking-detail-row">
                  <span className="booking-detail-label">Amount:</span>
                  <span className="booking-detail-value">Rs. {selectedBooking.totalAmount}</span>
                </div>
              </div>

              <div className="booking-detail-section">
                <h3>Worker Information</h3>
                <div className="booking-detail-row">
                  <span className="booking-detail-label">Name:</span>
                  <span className="booking-detail-value">{selectedBooking.workerName || 'N/A'}</span>
                </div>
                <div className="booking-detail-row">
                  <span className="booking-detail-label">Phone:</span>
                  <span className="booking-detail-value">{selectedBooking.workerPhone || 'N/A'}</span>
                </div>
              </div>

              <div className="booking-detail-section">
                <h3>Employer Information</h3>
                <div className="booking-detail-row">
                  <span className="booking-detail-label">Name:</span>
                  <span className="booking-detail-value">{selectedBooking.employerName || 'N/A'}</span>
                </div>
                <div className="booking-detail-row">
                  <span className="booking-detail-label">Phone:</span>
                  <span className="booking-detail-value">{selectedBooking.employerPhone || 'N/A'}</span>
                </div>
              </div>

              <div className="booking-detail-section">
                <h3>Status</h3>
                <div className="booking-detail-row">
                  <span className="booking-detail-label">Booking Status:</span>
                  <span className={`status-badge ${getStatusColor(selectedBooking.bookingStatus || selectedBooking.status)}`}>
                    {selectedBooking.bookingStatus || selectedBooking.status}
                  </span>
                </div>
                <div className="booking-detail-row">
                  <span className="booking-detail-label">Payment:</span>
                  <span className="payment-badge paid">{selectedBooking.paymentMethod || 'Paid'}</span>
                </div>
                <div className="booking-detail-row">
                  <span className="booking-detail-label">Created:</span>
                  <span className="booking-detail-value">{new Date(selectedBooking.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={closeModal}>Close</button>
              {!selectedBooking.adminApproval && (
                <button className="modal-btn approve" onClick={() => handleApprove(selectedBooking._id)}>
                  Approve
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
