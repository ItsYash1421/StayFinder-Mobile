import express from 'express';
import Booking from '../../models/admin/Booking.js';
import Listing from '../../models/admin/Listing.js';
import AdminUser from '../../models/admin/User.js';

const router = express.Router();

router.get('/summary', async (req, res) => {
  try {
    const { timeRange = '6months' } = req.query;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const bookings = await Booking.find().lean();
    const listings = await Listing.find().lean();
    const users = await AdminUser.find().lean();

    // Calculate date range based on timeRange
    let startDate, endDate;
    switch (timeRange) {
      case '1month':
        startDate = new Date(currentYear, currentMonth - 1, 1);
        endDate = new Date(currentYear, currentMonth + 1, 1);
        break;
      case '3months':
        startDate = new Date(currentYear, currentMonth - 3, 1);
        endDate = new Date(currentYear, currentMonth + 1, 1);
        break;
      case '6months':
        startDate = new Date(currentYear, currentMonth - 6, 1);
        endDate = new Date(currentYear, currentMonth + 1, 1);
        break;
      case '1year':
        startDate = new Date(currentYear - 1, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth + 1, 1);
        break;
      default:
        startDate = new Date(currentYear, currentMonth - 6, 1);
        endDate = new Date(currentYear, currentMonth + 1, 1);
    }

    // Debug: Show all bookings and their statuses
    console.log('=== ALL BOOKINGS DEBUG ===');
    console.log('Total bookings found:', bookings.length);
    bookings.forEach((booking, index) => {
      console.log(`Booking ${index + 1}:`, {
        id: booking._id,
        status: booking.status,
        totalPrice: booking.totalPrice,
        startDate: booking.startDate,
        checkIn: booking.checkIn,
        listingId: booking.listingId,
        propertyId: booking.propertyId
      });
    });
    console.log('==========================');

    // Only valid bookings - include all bookings with valid data within the time range
    const validBookings = bookings.filter(b => {
      const hasValidPrice = b.totalPrice && b.totalPrice > 0;
      const hasValidDate = b.startDate || b.checkIn;
      const hasValidStatus = b.status === 'confirmed' || b.status === 'approved' || b.status === 'pending';
      
      // Check if booking is within the selected time range OR is in current month
      let isInTimeRange = true;
      if (hasValidDate) {
        const bookingDate = new Date(b.startDate || b.checkIn);
        const isCurrentMonth = bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
        const isInSelectedRange = bookingDate >= startDate && bookingDate <= endDate;
        isInTimeRange = isCurrentMonth || isInSelectedRange;
      }
      
      // Debug logging for first few bookings
      if (bookings.indexOf(b) < 5) {
        console.log('Booking filter check:', {
          id: b._id,
          status: b.status,
          totalPrice: b.totalPrice,
          startDate: b.startDate,
          checkIn: b.checkIn,
          hasValidPrice,
          hasValidDate,
          hasValidStatus,
          isInTimeRange,
          timeRange,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          included: hasValidPrice && hasValidDate && hasValidStatus && isInTimeRange
        });
      }
      
      return hasValidPrice && hasValidDate && hasValidStatus && isInTimeRange;
    });

    // Only approved/confirmed bookings for performance metrics
    const confirmedBookings = validBookings.filter(b => b.status === 'approved' || b.status === 'confirmed');

    // Views (real data from database)
    const totalViews = listings.reduce((sum, listing) => sum + (listing.views || 0), 0);

    // Conversion Rate
    const conversionRate = totalViews > 0 ? (confirmedBookings.length / totalViews) * 100 : 0;

    // Average Rating
    const ratings = listings.map(l => l.rating).filter(r => typeof r === 'number');
    const averageRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;

    // Revenue per Booking
    const revenuePerBooking = confirmedBookings.length ? (confirmedBookings.reduce((sum, b) => sum + b.totalPrice, 0) / confirmedBookings.length) : 0;

    // Monthly Performance for selected time range
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Calculate how many months to show based on time range (excluding current month)
    let monthsToShow;
    switch (timeRange) {
      case '1month':
        monthsToShow = 1;
        break;
      case '3months':
        monthsToShow = 3;
        break;
      case '6months':
        monthsToShow = 6;
        break;
      case '1year':
        monthsToShow = 12;
        break;
      default:
        monthsToShow = 6;
    }
    
    const monthlyPerformance = [];
    
    // Always include current month first with special formatting
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 1);
    const currentMonthBookings = confirmedBookings.filter(b => {
      const bookingDate = new Date(b.startDate || b.checkIn);
      return bookingDate >= currentMonthStart && bookingDate < currentMonthEnd;
    });
    const currentMonthRevenue = currentMonthBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const currentMonthViews = confirmedBookings.length > 0 
      ? Math.floor((currentMonthBookings.length / confirmedBookings.length) * totalViews)
      : Math.floor(totalViews / (monthsToShow + 1));
    
    monthlyPerformance.push({
      month: 'This Month',
      views: currentMonthViews,
      bookings: currentMonthBookings.length,
      revenue: currentMonthRevenue,
      isCurrent: true
    });
    
    // Then add historical months based on time range (excluding current month)
    for (let i = 0; i < monthsToShow; i++) {
      const monthDate = new Date(startDate);
      monthDate.setMonth(startDate.getMonth() + i);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
      
      const monthBookings = confirmedBookings.filter(b => {
        const bookingDate = new Date(b.startDate || b.checkIn);
        return bookingDate >= monthStart && bookingDate < monthEnd;
      });
      const monthRevenue = monthBookings.reduce((sum, b) => sum + b.totalPrice, 0);
      
      // Calculate monthly views (distribute based on booking activity)
      const monthViews = confirmedBookings.length > 0 
        ? Math.floor((monthBookings.length / confirmedBookings.length) * totalViews)
        : Math.floor(totalViews / (monthsToShow + 1));
      
      monthlyPerformance.push({
        month: monthNames[monthDate.getMonth()],
        views: monthViews,
        bookings: monthBookings.length,
        revenue: monthRevenue,
        isCurrent: false
      });
    }

    // Top Performing Locations
    const locationMap = {};
    
    // First, add all locations from listings (even those without bookings)
    listings.forEach(listing => {
      const loc = listing.location || 'Unknown';
      if (!locationMap[loc]) {
        locationMap[loc] = { 
          bookings: 0, 
          revenue: 0, 
          views: 0, 
          properties: 0,
          avgRating: 0,
          avgPrice: 0
        };
      }
      locationMap[loc].views += listing.views || 0;
      locationMap[loc].properties += 1;
      
      // Calculate average rating for this location
      if (listing.rating) {
        const currentTotal = locationMap[loc].avgRating * (locationMap[loc].properties - 1);
        locationMap[loc].avgRating = (currentTotal + listing.rating) / locationMap[loc].properties;
      }
      
      // Calculate average price for this location
      if (listing.price) {
        const currentTotal = locationMap[loc].avgPrice * (locationMap[loc].properties - 1);
        locationMap[loc].avgPrice = (currentTotal + listing.price) / locationMap[loc].properties;
      }
    });
    
    // Then add booking data (only approved or confirmed bookings)
    confirmedBookings.forEach(b => {
      // Find the listing using multiple possible field names
      const listing = listings.find(l => {
        const listingId = l._id.toString();
        const bookingListingId = (b.listingId || b.propertyId || b.listing)?.toString();
        const match = listingId === bookingListingId;
        
        // Debug logging for first few bookings
        if (confirmedBookings.indexOf(b) < 3) {
          console.log('Booking:', {
            id: b._id,
            listingId: b.listingId,
            propertyId: b.propertyId,
            listing: b.listing,
            bookingListingId,
            totalPrice: b.totalPrice,
            status: b.status
          });
          console.log('Looking for listing with ID:', listingId);
          console.log('Match found:', match);
        }
        
        return match;
      });
      
      if (listing) {
        const loc = listing.location || 'Unknown';
        if (locationMap[loc]) {
          locationMap[loc].bookings += 1;
          locationMap[loc].revenue += b.totalPrice;
        }
      } else {
        console.log('No listing found for booking:', b._id, 'with listingId:', b.listingId, 'propertyId:', b.propertyId, 'listing:', b.listing);
      }
    });
    
    // Convert to array and sort by performance (revenue first, then views)
    const topLocations = Object.entries(locationMap)
      .map(([location, data]) => ({ 
        location, 
        ...data
      }))
      .filter(location => location.properties > 0) // Only show locations with properties
      .sort((a, b) => {
        // First sort by revenue (descending)
        if (b.revenue !== a.revenue) {
          return b.revenue - a.revenue;
        }
        // If revenue is equal, sort by views (descending)
        return b.views - a.views;
      })
      .slice(0, 10);

    // Debug logging
    console.log('=== TOP LOCATIONS DEBUG ===');
    console.log('Total bookings:', confirmedBookings.length);
    console.log('Total listings:', listings.length);
    console.log('Location map:', locationMap);
    console.log('Top locations:', topLocations);
    console.log('Sample booking:', confirmedBookings[0]);
    console.log('Sample listing:', listings[0]);
    console.log('==========================');

    // Average Stay Duration
    const avgStayDuration = confirmedBookings.length
      ? confirmedBookings.reduce((sum, b) => {
          const startDate = new Date(b.startDate || b.checkIn);
          const endDate = new Date(b.endDate || b.checkOut);
          return sum + ((endDate - startDate) / (1000 * 60 * 60 * 24));
        }, 0) / confirmedBookings.length
      : 0;

    // Booking Lead Time
    const avgLeadTime = confirmedBookings.length
      ? confirmedBookings.reduce((sum, b) => {
          const bookingDate = new Date(b.createdAt);
          const startDate = new Date(b.startDate || b.checkIn);
          return sum + ((startDate - bookingDate) / (1000 * 60 * 60 * 24));
        }, 0) / confirmedBookings.length
      : 0;

    // Cancellation Rate
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
    const cancellationRate = bookings.length ? (cancelledBookings.length / bookings.length) * 100 : 0;

    // Repeat Guest Rate
    const userBookingCounts = {};
    confirmedBookings.forEach(b => {
      const uid = b.userId?.toString();
      if (uid) userBookingCounts[uid] = (userBookingCounts[uid] || 0) + 1;
    });
    const repeatGuests = Object.values(userBookingCounts).filter(count => count > 1).length;
    const repeatGuestRate = confirmedBookings.length ? (repeatGuests / Object.keys(userBookingCounts).length) * 100 : 0;

    // Average Price
    const avgPrice = listings.length ? (listings.reduce((sum, l) => sum + (l.price || 0), 0) / listings.length) : 0;

    // Occupancy Rate (approximate: total booked nights / (listings * days in year so far))
    const totalBookedNights = confirmedBookings.reduce((sum, b) => {
      const startDate = new Date(b.startDate || b.checkIn);
      const endDate = new Date(b.endDate || b.checkOut);
      const nights = (endDate - startDate) / (1000 * 60 * 60 * 24);
      return sum + nights;
    }, 0);
    const daysInYearSoFar = Math.ceil((now - new Date(currentYear, 0, 1)) / (1000 * 60 * 60 * 24));
    const totalAvailableNights = listings.length * daysInYearSoFar;
    const occupancyRate = totalAvailableNights ? (totalBookedNights / totalAvailableNights) * 100 : 0;

    // Market data (calculated from actual data)
    // For demo purposes, we'll use the average of all properties as "market average"
    const marketAvgPrice = avgPrice; // Using our own average as market average for demo
    const marketAvgOccupancy = occupancyRate; // Using our own occupancy as market average for demo

    res.json({
      totalViews,
      conversionRate,
      averageRating,
      revenuePerBooking,
      monthlyPerformance,
      topLocations,
      avgStayDuration,
      avgLeadTime,
      cancellationRate,
      repeatGuestRate,
      avgPrice,
      occupancyRate,
      marketAvgPrice,
      marketAvgOccupancy
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get property views analytics
router.get('/views', async (req, res) => {
  try {
    const listings = await Listing.find().lean();
    
    // Properties with most views
    const topViewedProperties = listings
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 10)
      .map(listing => ({
        id: listing._id,
        title: listing.title,
        location: listing.location,
        views: listing.views || 0,
        price: listing.price,
        rating: listing.rating,
        status: listing.status
      }));

    // Views by category
    const viewsByCategory = {};
    listings.forEach(listing => {
      const category = listing.category || 'Other';
      if (!viewsByCategory[category]) {
        viewsByCategory[category] = { totalViews: 0, propertyCount: 0 };
      }
      viewsByCategory[category].totalViews += listing.views || 0;
      viewsByCategory[category].propertyCount += 1;
    });

    // Views by location
    const viewsByLocation = {};
    listings.forEach(listing => {
      const location = listing.location || 'Unknown';
      if (!viewsByLocation[location]) {
        viewsByLocation[location] = { totalViews: 0, propertyCount: 0 };
      }
      viewsByLocation[location].totalViews += listing.views || 0;
      viewsByLocation[location].propertyCount += 1;
    });

    // Average views per property
    const totalViews = listings.reduce((sum, listing) => sum + (listing.views || 0), 0);
    const avgViewsPerProperty = listings.length ? totalViews / listings.length : 0;

    // Properties with no views
    const propertiesWithNoViews = listings.filter(listing => !listing.views || listing.views === 0).length;

    res.json({
      totalViews,
      avgViewsPerProperty,
      propertiesWithNoViews,
      topViewedProperties,
      viewsByCategory,
      viewsByLocation
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 