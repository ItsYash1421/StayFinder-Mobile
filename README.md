# StayFinder 🏡

**StayFinder** is a full-stack accommodation booking platform where users can explore listings, book stays, and interact with hosts. Hosts can manage properties, approve guest bookings, and track listing status in real-time.

## 🚀 Features

- 🔍 **Browse Listings**
  - Search stays based on location, category, and price filters.
  - Filter properties by type (apartments, villas, hotels, etc.).

- 🏡 **View Property Details**
  - Access listing pages with full details:
    - Image gallery (stored via Cloudinary)
    - Description and amenities
    - Price per night
    - Host details and reviews (future scope)

- 📅 **Book a Stay**
  - Request bookings with check-in/check-out dates and guest count.
  - Supports auto-confirm or host-approved bookings.

- 📦 **Track Booking Status**
  - See live updates of your booking states:
    - `Pending`
    - `Confirmed`
    - `Cancelled`
    - `Rejected`

- 💖 **Wishlist Feature**
  - Add or remove properties to/from wishlist for later booking.

- 🔄 **Real-Time Updates**
  - Get instant UI feedback when booking status changes via **Socket.IO**.

- 🏗️ **Create and Manage Listings**
  - Add new properties with image upload and custom details.
  - Edit or delete listings anytime.

- 👥 **Manage Bookings**
  - Approve or reject booking requests.
  - See guest details and booking messages.

- ⚡ **Real-Time Notifications**
  - Instantly see new bookings and actions via **WebSocket** events.

- 📊 **Host Dashboard**
  - Visualize all listings and their booking statuses.
  - Control availability, pricing, and approval settings.

### 🌐 System-Wide Capabilities

- 🔐 **Authentication & Authorization**
  - Secure login/register with JWT tokens.
  - Role-based access for users and hosts.

- ☁️ **Media Uploads**
  - Upload property images to **Cloudinary** directly from frontend.

- 🔌 **Socket.IO Integration**
  - Real-time updates for bookings, confirmations, and cancellations.

- 📁 **Modular Architecture**
  - Clean codebase with separated contexts, routes, and API logic.

## 🛠️ Tech Stack

### Frontend

- **React.js** (with Context API & Hooks)
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time sync
- **Axios** for API calls

### Backend

- **Node.js + Express**
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Socket.IO** for real-time communication
- **Cloudinary** for image uploads

## 🧩 How to Initialize Everything

```bash
git clone https://github.com/your-username/stayfinder.git
cd stayfinder

cd backend
npm install
npm run server


cd frontend
npm install
npm run dev


PORT=3000
MONGO_URI=your_mongodb_url
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
