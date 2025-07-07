# StayFinderMobile

A native iOS app for StayFinder, built with React Native and Expo.

## Features

- Consistent design and theme with the StayFinder web frontend
- Connects to the existing backend for authentication, listings, bookings, etc.
- Core screens: Explore, Login/Register, Profile, Wishlist, My Booking, Host Dashboard, etc.
- React Navigation for screen management
- Axios for API calls
- CSS-in-JS styling (no Tailwind, uses theme constants)
- Placeholders for Google login and push notifications

## Folder Structure

```
StayFinderMobile/
  assets/           # App icons, splash, image placeholders
  components/       # Reusable UI components (PostCard, ProfileAvatar, etc.)
  constants/        # Theme, API config
  screens/          # App screens (Home, Login, Explore, etc.)
  App.js            # App entry, navigation setup
  app.json          # Expo config
```

## Setup

1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the Expo app:
   ```sh
   npx expo start
   ```
3. Open in Expo Go on your iOS device.

## Backend Connection

- Update `constants/api.js` with your backend URL.
- All API calls use Axios.

## Theming

- Colors and fonts are defined in `constants/theme.js` for consistency with the web app.

## Placeholders

- Google login and push notifications are ready for integration (see components/).

---

Built with ❤️ for StayFinder.
