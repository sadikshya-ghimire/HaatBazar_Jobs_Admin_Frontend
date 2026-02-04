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

  const handlePaymentUpdate = async (id, status) => {
    try {
      await bookingsAPI.updatePayment(id, status);
      fetchBookings();
    } catch (err) {
      console.error('Error updating payment:', err);
      alert('Failed to update payment status');
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

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'green';
      case 'pending': return 'orange';
      case 'failed': return 'red';
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

      <div className="bookings-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Bookings
        </button>
        <button 
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          Approved
        </button>
        <button 
          className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rejected
        </button>
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
        <div className="bookings-grid">
          {filteredBookings.map(booking => (
            <div key={booking._id} className="booking-card">
              <div className="booking-card-header">
                <div className="booking-title">
                  <h3>{booking.jobTitle || 'No Title'}</h3>
                  <div className="booking-status-badges">
                    <span className={`status-badge-booking ${getStatusColor(booking.bookingStatus || booking.status)}`}>
                      {booking.bookingStatus || booking.status}
                    </span>
                    {booking.adminApproval && !booking.workerApproval && (
                      <span className="status-badge-booking orange">
                        Awaiting Worker
                      </span>
                    )}
                    {booking.adminApproval && booking.workerApproval && (
                      <span className="status-badge-booking green">
                        Fully Approved
                      </span>
                    )}
                  </div>
                </div>
                <div className="booking-actions-top">
                  <button 
                    className="view-details-btn-booking"
                    onClick={() => openModal(booking)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Details
                  </button>
                </div>
              </div>

              <div className="booking-info">
                <div className="info-row-booking">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span><strong>Worker:</strong> {booking.workerName || 'N/A'}</span>
                </div>
                <div className="info-row-booking">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span><strong>Employer:</strong> {booking.employerName || 'N/A'}</span>
                </div>
                <div className="info-row-booking">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{booking.area || booking.location?.area || 'N/A'}, {booking.district || booking.location?.district || 'N/A'}</span>
                </div>
                <div className="info-row-booking">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  <span><strong>Amount:</strong> {booking.totalAmount || booking.agreedRate || booking.budget || 'N/A'}</span>
                </div>
                <div className="info-row-booking">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span><strong>Duration:</strong> {booking.workDuration || booking.duration || 'N/A'}</span>
                </div>
              </div>

              <div className="payment-section">
                <div className="payment-status">
                  <span>Payment Status:</span>
                  <span className={`payment-badge ${getPaymentStatusColor(booking.paymentStatus)}`}>
                    {booking.paymentStatus}
                  </span>
                </div>
                {(booking.bookingStatus === 'pending' || booking.status === 'pending' || booking.status === 'accepted') && 
                 !(booking.bookingStatus === 'approved' || booking.status === 'approved') && 
                 !(booking.bookingStatus === 'rejected' || booking.status === 'rejected') && (
                  <div className="payment-actions">
                    <button 
                      className="payment-btn paid"
                      onClick={() => handlePaymentUpdate(booking._id, 'paid')}
                      disabled={booking.paymentStatus === 'paid'}
                    >
                      Mark Paid
                    </button>
                    <button 
                      className="payment-btn failed"
                      onClick={() => handlePaymentUpdate(booking._id, 'failed')}
                      disabled={booking.paymentStatus === 'failed'}
                    >
                      Mark Failed
                    </button>
                  </div>
                )}
              </div>

              {(booking.bookingStatus === 'pending' || booking.status === 'pending' || booking.status === 'accepted') && 
               !(booking.bookingStatus === 'approved' || booking.status === 'approved') && 
               !(booking.bookingStatus === 'rejected' || booking.status === 'rejected') && (
                <div className="booking-actions">
                  <button 
                    className="approve-btn-booking"
                    onClick={() => handleApprove(booking._id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Approve
                  </button>
                  <button 
                    className="reject-btn-booking"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowModal(true);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Reject
                  </button>
                  <button 
                    className="delete-btn-booking"
                    onClick={() => handleDelete(booking._id)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && selectedBooking && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content-booking" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-booking">
              <h2>Booking Details</h2>
              <button className="close-modal-btn" onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body-booking">
              <div className="detail-section">
                <h3>Job Information</h3>
                <p><strong>Title:</strong> {selectedBooking.jobTitle}</p>
                <p><strong>Description:</strong> {selectedBooking.jobDescription}</p>
                <p><strong>Budget:</strong> {selectedBooking.budget}</p>
                <p><strong>Duration:</strong> {selectedBooking.duration}</p>
                <p><strong>Location:</strong> {selectedBooking.area}, {selectedBooking.district}</p>
              </div>

              <div className="detail-section">
                <h3>Worker Information</h3>
                <p><strong>Name:</strong> {selectedBooking.workerName}</p>
                <p><strong>Phone:</strong> {selectedBooking.workerPhone}</p>
              </div>

              <div className="detail-section">
                <h3>Employer Information</h3>
                <p><strong>Name:</strong> {selectedBooking.employerName}</p>
                <p><strong>Phone:</strong> {selectedBooking.employerPhone}</p>
              </div>

              <div className="detail-section">
                <h3>Status Information</h3>
                <p><strong>Booking Status:</strong> <span className={`status-badge-booking ${getStatusColor(selectedBooking.bookingStatus)}`}>{selectedBooking.bookingStatus}</span></p>
                <p><strong>Payment Status:</strong> <span className={`payment-badge ${getPaymentStatusColor(selectedBooking.paymentStatus)}`}>{selectedBooking.paymentStatus}</span></p>
                <p><strong>Created:</strong> {new Date(selectedBooking.createdAt).toLocaleString()}</p>
              </div>

              {selectedBooking.bookingStatus === 'pending' && (
                <div className="detail-section">
                  <h3>Admin Actions</h3>
                  <div className="admin-action-form">
                    <textarea
                      placeholder="Add notes (optional)"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows="3"
                    />
                    <button 
                      className="approve-btn-booking"
                      onClick={() => handleApprove(selectedBooking._id)}
                    >
                      Approve Booking
                    </button>
                  </div>

                  <div className="admin-action-form">
                    <textarea
                      placeholder="Rejection reason (required)"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows="3"
                    />
                    <button 
                      className="reject-btn-booking"
                      onClick={() => handleReject(selectedBooking._id)}
                    >
                      Reject Booking
                    </button>
                  </div>
                </div>
              )}

              {selectedBooking.adminNotes && (
                <div className="detail-section">
                  <h3>Admin Notes</h3>
                  <p>{selectedBooking.adminNotes}</p>
                </div>
              )}

              {selectedBooking.rejectionReason && (
                <div className="detail-section">
                  <h3>Rejection Reason</h3>
                  <p>{selectedBooking.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
