import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const ReceptionistIntake = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [recentShipments, setRecentShipments] = useState([]);

  const [formData, setFormData] = useState({
    senderName: '',
    senderPhone: '',
    receiverName: '',
    receiverPhone: '',
    weight_kg: '',
    dimensions: ''
  });

  useEffect(() => {
    fetchRecentShipments();
  }, []);

  const fetchRecentShipments = async () => {
    try {
      const response = await axios.get('/api/shipments');
      setRecentShipments(response.data.shipments || []);
    } catch (err) {
      console.error("Error fetching shipments", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...formData,
        receptionistId: user.id
      };
      
      const response = await axios.post('/api/shipments', payload);
      setSuccess(`Shipment successfully generated! Tracking ID: ${response.data.shipment.trackingNumber}`);
      setFormData({
        senderName: '',
        senderPhone: '',
        receiverName: '',
        receiverPhone: '',
        weight_kg: '',
        dimensions: ''
      });
      fetchRecentShipments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '24px' }}>
      {/* Intake Form */}
      <div className="glass-panel" style={{ flex: '1 1 400px', padding: '24px' }}>
        <h3 style={{ marginBottom: '24px', color: 'var(--accent-cyan)' }}>New Shipment Intake</h3>
        
        {error && <div style={{ background: 'rgba(255,50,50,0.1)', color: '#ff6b6b', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>{error}</div>}
        {success && <div style={{ background: 'rgba(50,255,100,0.1)', color: '#4ade80', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontWeight: 'bold' }}>{success}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label>Sender Name</label>
              <input type="text" name="senderName" value={formData.senderName} onChange={handleChange} required />
            </div>
            <div style={{ flex: 1 }}>
              <label>Sender Phone</label>
              <input type="text" name="senderPhone" value={formData.senderPhone} onChange={handleChange} required />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label>Receiver Name</label>
              <input type="text" name="receiverName" value={formData.receiverName} onChange={handleChange} required />
            </div>
            <div style={{ flex: 1 }}>
              <label>Receiver Phone</label>
              <input type="text" name="receiverPhone" value={formData.receiverPhone} onChange={handleChange} required />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label>Weight (kg)</label>
              <input type="number" name="weight_kg" step="0.1" value={formData.weight_kg} onChange={handleChange} required />
            </div>
            <div style={{ flex: 1 }}>
              <label>Dimensions (LxWxH)</label>
              <input type="text" name="dimensions" placeholder="e.g. 10x10x10" value={formData.dimensions} onChange={handleChange} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ background: 'var(--primary-gradient)', color: 'white', fontWeight: 'bold', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', marginTop: '8px' }}>
            {loading ? 'Processing...' : 'Create Shipment & Generate Tracking'}
          </button>
        </form>
      </div>

      {/* Recent Shipments List */}
      <div className="glass-panel" style={{ flex: '1 1 300px', padding: '24px' }}>
        <h3 style={{ marginBottom: '24px', color: 'var(--text-primary)' }}>Recent Intakes</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
          {recentShipments.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No shipments recorded yet.</p>
          ) : (
            recentShipments.map((shipment) => (
              <div key={shipment._id} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold', fontSize: '0.9rem' }}>{shipment.trackingNumber}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                    {shipment.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div><strong>From:</strong> {shipment.logistics?.sender?.name}</div>
                  <div><strong>To:</strong> {shipment.logistics?.receiver?.name}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceptionistIntake;
