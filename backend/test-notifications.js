import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  console.log('\n🔄 Testing notification system...');
  
  try {
    // Replace these with actual tokens from your authentication system
    const userToken = 'YOUR_USER_JWT_TOKEN';
    const ownerToken = 'YOUR_PROPERTY_OWNER_JWT_TOKEN';
    
    // 1. Create a booking
    console.log('\n📋 1. Creating a new booking...');
    const bookingResponse = await axios.post('http://localhost:3000/api/bookings', {
      propertyId: '507f1f77bcf86cd799439012',
      propertyTitle: 'Luxury Beach Villa',
      checkIn: '2025-02-15',
      checkOut: '2025-02-18',
      amountPaid: 450,
      guestName: 'John Smith'
    }, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    
    console.log('✅ Booking created:', bookingResponse.data.booking._id);
    
    // 2. Check notifications
    console.log('\n📬 2. Checking notifications...');
    const notificationsResponse = await axios.get('http://localhost:3000/api/notifications', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    
    console.log('\n📬 User Notifications:');
    notificationsResponse.data.notifications.forEach((notification, index) => {
      console.log(`${index + 1}. [${notification.type.toUpperCase()}] ${notification.title}`);
      console.log(`   Message: ${notification.message}`);
      console.log(`   Status: ${notification.isRead ? 'READ' : 'UNREAD'}`);
      console.log(`   Priority: ${notification.priority}`);
      console.log(`   Time: ${new Date(notification.timestamp).toLocaleString()}`);
      console.log('---');
    });
    
    // 3. Check unread count
    console.log('\n📊 3. Checking unread count...');
    const unreadResponse = await axios.get('http://localhost:3000/api/notifications/unread-count', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    
    console.log(`Unread notifications: ${unreadResponse.data.count}`);
    
    // 4. Mark first notification as read
    if (notificationsResponse.data.notifications.length > 0) {
      console.log('\n✅ 4. Marking first notification as read...');
      const firstNotification = notificationsResponse.data.notifications[0];
      await axios.put(`http://localhost:3000/api/notifications/${firstNotification._id}/read`, {}, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      console.log('✅ Notification marked as read');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
  
  mongoose.connection.close();
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
}); 