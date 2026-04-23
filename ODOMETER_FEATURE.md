# Odometer Reading Feature

## Overview
The Odometer Reading feature allows users to track their bike's mileage by entering odometer readings instead of manually inputting kilometers. The system automatically calculates the distance traveled between readings and adds it to the total km.

## How It Works

### Components
1. **OdometerInput.js** - New component for odometer reading input
2. **Dashboard Integration** - Added to the dashboard page alongside existing ride input

### Features

#### Data Storage
- **Last Odometer Reading**: Stored in `userData.lastOdometerReading`
- **Odometer Entries**: Saved in Firestore `odometer_readings` collection with:
  - `userId` - User ID
  - `reading` - Current odometer reading
  - `kmCalculated` - Calculated km ridden (difference from last reading)
  - `date` - Timestamp of entry

#### Automatic Calculations
When a user enters a new odometer reading:
1. System calculates: `Km Ridden = New Reading - Last Reading`
2. Adds this to the user's `totalKm`
3. Updates `lastOdometerReading` for next calculation
4. Creates a ride entry linked to the odometer reading

#### Validation
- New reading must be greater than the last reading (no backward odometer)
- Maximum 5000 km per entry to catch input errors
- Cannot add same reading twice

### User Interface

#### Expandable Card
- Shows as a collapsed card by default
- Title: "Odometer Reading"
- Displays last recorded reading or "Set your first reading"
- Click to expand/collapse

#### Input Form
- Field for entering current odometer reading
- Real-time calculation preview showing:
  - Last reading
  - New reading
  - Calculated km difference (highlighted in green)
- Submit button displays calculated km value
- Success notification with before → after values

### Integration with Dashboard

**Location**: Right column of dashboard (alongside Daily Ride Input)

**Layout**:
```
Left Column          | Right Column
                     | - Odometer Reading (expanded)
Oil Change Progress  | - Add Today's Ride
                     | - Add Expense
                     | - Smart Predictor
```

### Database Schema

#### New Collection: `odometer_readings`
```javascript
{
  userId: string,
  reading: number,
  kmCalculated: number,
  date: timestamp
}
```

#### Updated User Document
```javascript
{
  // ... existing fields
  lastOdometerReading: number,  // Latest odometer reading
  totalKm: number               // Updated when odometer entry added
}
```

### Example Flow

1. **First Entry**
   - User enters: 10,000 km
   - System stores this as `lastOdometerReading = 10000`
   - No km is added (first reading)

2. **Second Entry**
   - User enters: 10,150 km
   - Calculation: 10,150 - 10,000 = 150 km
   - Adds 150 km to `totalKm`
   - Updates `lastOdometerReading = 10150`
   - Shows success: "Added 150 km (10000 → 10150)"

### Benefits

✅ **Accuracy**: Direct odometer readings eliminate manual entry errors
✅ **Simplicity**: Users just read the meter and enter the number
✅ **Automation**: Calculations are automatic and instant
✅ **Audit Trail**: All odometer readings are stored for reference
✅ **Dual Input**: Users can choose between daily km entry or odometer readings
✅ **Integration**: Seamlessly works with existing oil change tracking

### Technical Details

- **State Management**: React hooks (useState, useEffect)
- **Animations**: Framer Motion for smooth transitions
- **Database**: Firestore atomic operations
- **UI Framework**: Tailwind CSS with custom glass-morphism design
- **Sound Feedback**: Success sound plays on completion
- **Toast Notifications**: User feedback for all actions

### Future Enhancements

- OCR for automatic odometer reading from photos (like existing ride meter feature)
- Odometer history timeline view
- Duplicate detection (if same reading entered twice)
- Odometer malfunction alerts (if huge jump detected)
- Export odometer readings history
