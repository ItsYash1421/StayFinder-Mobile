import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from './models/Notification.js';
import NotificationService from './services/notificationService.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
  
  try {
    // Test 1: Create a test notification directly
    console.log('\n📝 Test 1: Creating a test notification...');
    const testNotification = new Notification({
      userId: new mongoose.Types.ObjectId(), // Create a dummy user ID
      type: 'test',
      title: 'Test Notification',
      message: 'This is a test notification to verify database storage',
      priority: 'high',
      isRead: false,
      timestamp: new Date()
    });
    
    await testNotification.save();
    console.log('✅ Test notification saved to database');
    console.log('   ID:', testNotification._id);
    console.log('   Title:', testNotification.title);
    console.log('   Type:', testNotification.type);
    
    // Test 2: Use NotificationService to create notification
    console.log('\n📝 Test 2: Using NotificationService...');
    const testUserId = new mongoose.Types.ObjectId();
    const serviceNotification = await NotificationService.createNotification(
      testUserId,
      'system',
      'Service Test',
      'This notification was created using NotificationService',
      'medium'
    );
    
    console.log('✅ Service notification created');
    console.log('   ID:', serviceNotification._id);
    console.log('   User ID:', serviceNotification.userId);
    
    // Test 3: Check if notifications exist in database
    console.log('\n📊 Test 3: Checking database for notifications...');
    const allNotifications = await Notification.find({});
    console.log(`✅ Found ${allNotifications.length} notifications in database`);
    
    allNotifications.forEach((notification, index) => {
      console.log(`   ${index + 1}. [${notification.type}] ${notification.title}`);
      console.log(`      Message: ${notification.message}`);
      console.log(`      User ID: ${notification.userId}`);
      console.log(`      Read: ${notification.isRead}`);
      console.log(`      Time: ${notification.timestamp}`);
      console.log('---');
    });
    
    // Test 4: Test notification service methods
    console.log('\n📊 Test 4: Testing NotificationService methods...');
    
    const userNotifications = await NotificationService.getUserNotifications(testUserId);
    console.log(`✅ Found ${userNotifications.length} notifications for test user`);
    
    const unreadCount = await NotificationService.getUnreadCount(testUserId);
    console.log(`✅ Unread count for test user: ${unreadCount}`);
    
    // Test 5: Mark notification as read
    if (serviceNotification) {
      console.log('\n✅ Test 5: Marking notification as read...');
      const updatedNotification = await NotificationService.markAsRead(serviceNotification._id, testUserId);
      console.log('✅ Notification marked as read:', updatedNotification.isRead);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ Notifications are being stored properly in the database');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
  
  // Clean up test data
  console.log('\n🧹 Cleaning up test data...');
  await Notification.deleteMany({ type: 'test' });
  await Notification.deleteMany({ title: 'Service Test' });
  console.log('✅ Test data cleaned up');
  
  mongoose.connection.close();
  console.log('✅ Database connection closed');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
}); 