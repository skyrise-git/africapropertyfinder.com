# Glassmorphism Search Feature Documentation

## Overview

The new glassmorphism search feature provides an advanced, visually appealing search interface on the home page that allows users to search for properties with multiple criteria and seamlessly navigate to filtered results.

## Features

### 🎨 Visual Design
- **Glassmorphism UI**: Semi-transparent backgrounds with backdrop blur effects
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Smooth Animations**: Framer Motion animations for enhanced user experience
- **Dark Mode Support**: Full compatibility with light and dark themes

### 🔍 Search Capabilities
- **Location Search**: Google Places autocomplete integration
- **Property Types**: Apartment, House, Condo, Townhouse, Studio, Room, Other
- **Listing Types**: Buy (Sale), Rent, Student Housing
- **Keyword Search**: Free-text search across property details
- **Real-time Filtering**: Instant results with live property count

### 📱 Responsive Behavior
- **Mobile**: Single column layout with stacked inputs
- **Tablet**: Two-column grid for better space utilization
- **Desktop**: Full multi-column layout with optimized spacing

## Component Architecture

### Core Components

#### `HeroSection`
- **Location**: `/components/home/hero-section.tsx`
- **Purpose**: Main landing section with search interface
- **Features**: 
  - Animated background elements
  - Glassmorphism search card
  - Listing type tabs
  - Search form with validation

#### `PropertyLocationSearch`
- **Location**: `/components/home/property-location-search.tsx`
- **Purpose**: Google Places autocomplete for location search
- **Features**:
  - Debounced search (300ms)
  - Geocoding integration
  - Error handling
  - Clear functionality

#### `FilterChips`
- **Location**: `/components/ui/filter-chips.tsx`
- **Purpose**: Display and manage active search filters
- **Features**:
  - Individual filter removal
  - Clear all functionality
  - Responsive chip layout

## Search Flow

### 1. User Interaction
```
User selects criteria → Hero Search Form
├── Listing Type: sale | rent | student-housing
├── Location: Google Places Autocomplete
├── Property Type: apartment | house | condo | etc.
└── Keywords: Free text search
```

### 2. Data Processing
```
Search Parameters Generation
├── listingType: ListingType
├── propertyType: PropertyType
├── search: string
├── lat: string (coordinates)
├── lng: string (coordinates)
└── loc: string (location label)
```

### 3. Navigation & Filtering
```
Router Navigation → /properties?[parameters]
├── URL Parameters Applied
├── Real-time Filtering
├── Results Display
└── Filter Chips Shown
```

## Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `listingType` | string | Type of listing | `rent`, `sale`, `student-housing` |
| `propertyType` | string | Property category | `apartment`, `house`, `condo` |
| `search` | string | Keyword search | `luxury modern downtown` |
| `lat` | string | Latitude coordinate | `40.7128` |
| `lng` | string | Longitude coordinate | `-74.0060` |
| `loc` | string | Location label | `New York, NY, USA` |

## Integration Points

### Properties Page Updates
- Enhanced filtering logic to handle new parameters
- Filter chips display for active filters
- Clear all filters functionality
- Improved mobile responsiveness

### State Management
- Uses `nuqs` for URL state synchronization
- Automatic page reset on filter changes
- Persistent search state across navigation

## Performance Optimizations

### Search Optimizations
- **Debounced Input**: 300ms delay for autocomplete
- **Memoized Filtering**: useMemo for expensive operations
- **Lazy Loading**: Components load on demand
- **Efficient Re-renders**: Optimized dependency arrays

### UI Optimizations
- **CSS Animations**: Hardware-accelerated transforms
- **Backdrop Filters**: Optimized blur effects
- **Image Optimization**: Responsive images with Next.js

## Browser Support

- **Modern Browsers**: Full support for glassmorphism effects
- **Fallback Support**: Graceful degradation for older browsers
- **Mobile Safari**: Optimized for iOS viewport units (100dvh)

## Environment Requirements

### Required Environment Variables
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Google Maps API Requirements
- **Places API**: For location autocomplete
- **Geocoding API**: For coordinate conversion
- **Maps JavaScript API**: For map integration

## Usage Examples

### Basic Search
```typescript
// User selects "Rent" + "Apartment" + "New York"
// Results in: /properties?listingType=rent&propertyType=apartment&lat=40.7128&lng=-74.0060&loc=New York, NY, USA
```

### Keyword Search
```typescript
// User searches for "luxury downtown parking"
// Results in: /properties?search=luxury downtown parking&listingType=rent
```

### Combined Filters
```typescript
// Full search with all parameters
// Results in: /properties?listingType=sale&propertyType=house&search=modern&lat=40.7128&lng=-74.0060&loc=New York, NY, USA
```

## Customization Options

### Theme Customization
```css
/* Glassmorphism variables */
--glass-bg: rgba(255, 255, 255, 0.2);
--glass-border: rgba(255, 255, 255, 0.3);
--glass-backdrop: blur(16px);
```

### Animation Customization
```typescript
// Framer Motion variants can be customized
const customVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};
```

## Future Enhancements

### Planned Features
- [ ] Price range slider integration
- [ ] Advanced filters (bedrooms, bathrooms)
- [ ] Saved searches functionality
- [ ] Recent searches history
- [ ] Voice search capability
- [ ] Map view integration in hero

### Performance Improvements
- [ ] Service worker caching for search results
- [ ] Infinite scroll for large result sets
- [ ] Search suggestions based on user behavior
- [ ] Predictive search with AI

## Troubleshooting

### Common Issues

#### Google Maps API Errors
```
Error: Google Maps API key missing or invalid
Solution: Check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local
```

#### Search Not Working
```
Error: Search parameters not being applied
Solution: Check nuqs configuration and URL state management
```

#### Mobile Layout Issues
```
Error: Search form not responsive on mobile
Solution: Verify Tailwind CSS breakpoints and grid configurations
```

## Contributing

When contributing to the search feature:

1. **Test Responsiveness**: Verify on mobile, tablet, and desktop
2. **Check Accessibility**: Ensure keyboard navigation works
3. **Validate Search Logic**: Test all filter combinations
4. **Performance**: Monitor Core Web Vitals impact
5. **Browser Testing**: Test on major browsers

## Dependencies

### Core Dependencies
- `framer-motion`: Animations
- `nuqs`: URL state management
- `use-places-autocomplete`: Google Places integration
- `@react-google-maps/api`: Google Maps wrapper
- `lucide-react`: Icons

### UI Dependencies
- `@radix-ui/react-select`: Dropdown components
- `@radix-ui/react-button`: Button components
- `tailwindcss`: Styling framework

---

*This documentation is maintained as part of the SkyRise Real Estate project. Last updated: January 2024*