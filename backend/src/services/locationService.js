/**
 * Location Service
 * GPS location validation and geolocation utilities
 */
class LocationService {
  constructor() {
    // Earth's radius in kilometers
    this.earthRadius = 6371;
  }

  /**
   * Calculate distance between two GPS coordinates using Haversine formula
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number} Distance in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    try {
      // Convert to radians
      const lat1Rad = this.toRadians(lat1);
      const lat2Rad = this.toRadians(lat2);
      const lon1Rad = this.toRadians(lon1);
      const lon2Rad = this.toRadians(lon2);

      // Haversine formula
      const dLat = lat2Rad - lat1Rad;
      const dLon = lon2Rad - lon1Rad;

      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      // Distance in meters
      const distance = this.earthRadius * c * 1000;

      return Math.round(distance * 100) / 100; // Round to 2 decimal places

    } catch (error) {
      console.error('Calculate distance error:', error);
      return null;
    }
  }

  /**
   * Validate GPS location against session location
   * @param {number} userLat - User's latitude
   * @param {number} userLon - User's longitude
   * @param {number} sessionLat - Session latitude
   * @param {number} sessionLon - Session longitude
   * @param {number} maxDistance - Maximum allowed distance in meters
   * @param {number} accuracy - GPS accuracy in meters (optional)
   * @returns {Object} Validation result
   */
  validateLocation(userLat, userLon, sessionLat, sessionLon, maxDistance = 100, accuracy = null) {
    try {
      // Validate coordinates
      if (!this.isValidCoordinate(userLat, userLon) || !this.isValidCoordinate(sessionLat, sessionLon)) {
        return {
          valid: false,
          message: 'Invalid GPS coordinates',
          distance: null
        };
      }

      // Calculate distance
      const distance = this.calculateDistance(userLat, userLon, sessionLat, sessionLon);

      if (distance === null) {
        return {
          valid: false,
          message: 'Failed to calculate distance',
          distance: null
        };
      }

      // Check accuracy if provided
      if (accuracy !== null && accuracy > maxDistance) {
        return {
          valid: false,
          message: `GPS accuracy (${Math.round(accuracy)}m) is too low`,
          distance
        };
      }

      // Check distance
      if (distance <= maxDistance) {
        return {
          valid: true,
          message: 'Location is within allowed range',
          distance,
          withinRange: true
        };
      } else {
        return {
          valid: false,
          message: `Location is ${Math.round(distance)}m away (max allowed: ${maxDistance}m)`,
          distance,
          withinRange: false
        };
      }

    } catch (error) {
      console.error('Validate location error:', error);
      return {
        valid: false,
        message: `Location validation failed: ${error.message}`,
        distance: null
      };
    }
  }

  /**
   * Check if coordinates are valid
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {boolean} True if valid
   */
  isValidCoordinate(lat, lon) {
    return (
      typeof lat === 'number' &&
      typeof lon === 'number' &&
      lat >= -90 && lat <= 90 &&
      lon >= -180 && lon <= 180 &&
      !isNaN(lat) && !isNaN(lon) &&
      isFinite(lat) && isFinite(lon)
    );
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees - Degrees
   * @returns {number} Radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Parse GPS coordinates from string format
   * @param {string} coordStr - Coordinate string (e.g., "10.762622,106.660172")
   * @returns {Object} Parsed coordinates {lat, lon}
   */
  parseCoordinates(coordStr) {
    try {
      if (typeof coordStr !== 'string') {
        return null;
      }

      // Remove spaces and split by comma
      const parts = coordStr.replace(/\s/g, '').split(',');

      if (parts.length !== 2) {
        return null;
      }

      const lat = parseFloat(parts[0]);
      const lon = parseFloat(parts[1]);

      if (!this.isValidCoordinate(lat, lon)) {
        return null;
      }

      return { lat, lon };
    } catch (error) {
      console.error('Parse coordinates error:', error);
      return null;
    }
  }

  /**
   * Format coordinates as string
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {number} precision - Decimal precision (default: 6)
   * @returns {string} Formatted coordinates
   */
  formatCoordinates(lat, lon, precision = 6) {
    try {
      if (!this.isValidCoordinate(lat, lon)) {
        return null;
      }

      return `${lat.toFixed(precision)},${lon.toFixed(precision)}`;
    } catch (error) {
      console.error('Format coordinates error:', error);
      return null;
    }
  }

  /**
   * Get location info from coordinates (mock implementation)
   * In production, you would use a geocoding service like Google Maps or OpenStreetMap
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Object} Location info
   */
  async reverseGeocode(lat, lon) {
    try {
      if (!this.isValidCoordinate(lat, lon)) {
        return {
          success: false,
          message: 'Invalid coordinates'
        };
      }

      // Mock geocoding for demo purposes
      // In production, integrate with a real geocoding service
      const mockLocations = [
        { lat: 10.762622, lon: 106.660172, address: '227 Đ. Nguyễn Văn Cừ, Phường 4, Quận 5, Hồ Chí Minh, Việt Nam' },
        { lat: 10.823099, lon: 106.629664, address: '1 Đ. Đại học Quốc gia, Linh Trung, Thủ Đức, Hồ Chí Minh, Việt Nam' },
        { lat: 10.759016, lon: 106.662435, address: '268 Lý Thường Kiệt, Phường 14, Quận 10, Hồ Chí Minh, Việt Nam' }
      ];

      // Find closest mock location
      let closestLocation = null;
      let minDistance = Infinity;

      for (const location of mockLocations) {
        const distance = this.calculateDistance(lat, lon, location.lat, location.lon);
        if (distance < minDistance) {
          minDistance = distance;
          closestLocation = location;
        }
      }

      if (closestLocation && minDistance <= 1000) { // Within 1km
        return {
          success: true,
          address: closestLocation.address,
          coordinates: { lat, lon },
          distance: minDistance
        };
      }

      return {
        success: true,
        address: `Location at ${this.formatCoordinates(lat, lon)}`,
        coordinates: { lat, lon }
      };

    } catch (error) {
      console.error('Reverse geocode error:', error);
      return {
        success: false,
        message: `Geocoding failed: ${error.message}`
      };
    }
  }

  /**
   * Validate GPS accuracy
   * @param {number} accuracy - GPS accuracy in meters
   * @param {number} maxAccuracy - Maximum allowed accuracy
   * @returns {Object} Validation result
   */
  validateAccuracy(accuracy, maxAccuracy = 50) {
    try {
      if (typeof accuracy !== 'number' || accuracy < 0) {
        return {
          valid: false,
          message: 'Invalid accuracy value'
        };
      }

      if (accuracy <= maxAccuracy) {
        return {
          valid: true,
          message: `Accuracy is good (${Math.round(accuracy)}m)`
        };
      } else {
        return {
          valid: false,
          message: `GPS accuracy too low (${Math.round(accuracy)}m, max: ${maxAccuracy}m)`
        };
      }

    } catch (error) {
      console.error('Validate accuracy error:', error);
      return {
        valid: false,
        message: `Accuracy validation failed: ${error.message}`
      };
    }
  }

  /**
   * Check if location is within a geofence (circular area)
   * @param {number} userLat - User's latitude
   * @param {number} userLon - User's longitude
   * @param {number} centerLat - Geofence center latitude
   * @param {number} centerLon - Geofence center longitude
   * @param {number} radius - Geofence radius in meters
   * @returns {Object} Geofence check result
   */
  isWithinGeofence(userLat, userLon, centerLat, centerLon, radius) {
    try {
      const distance = this.calculateDistance(userLat, userLon, centerLat, centerLon);

      return {
        withinFence: distance <= radius,
        distance,
        radius,
        center: { lat: centerLat, lon: centerLon }
      };

    } catch (error) {
      console.error('Geofence check error:', error);
      return {
        withinFence: false,
        distance: null,
        error: error.message
      };
    }
  }

  /**
   * Calculate bearing between two points
   * @param {number} lat1 - Start latitude
   * @param {number} lon1 - Start longitude
   * @param {number} lat2 - End latitude
   * @param {number} lon2 - End longitude
   * @returns {number} Bearing in degrees (0-360)
   */
  calculateBearing(lat1, lon1, lat2, lon2) {
    try {
      const lat1Rad = this.toRadians(lat1);
      const lat2Rad = this.toRadians(lat2);
      const lon1Rad = this.toRadians(lon1);
      const lon2Rad = this.toRadians(lon2);

      const dLon = lon2Rad - lon1Rad;

      const y = Math.sin(dLon) * Math.cos(lat2Rad);
      const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
                Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

      const bearing = Math.atan2(y, x);
      const bearingDegrees = (this.toDegrees(bearing) + 360) % 360;

      return Math.round(bearingDegrees * 100) / 100;

    } catch (error) {
      console.error('Calculate bearing error:', error);
      return null;
    }
  }

  /**
   * Convert radians to degrees
   * @param {number} radians - Radians
   * @returns {number} Degrees
   */
  toDegrees(radians) {
    return radians * (180 / Math.PI);
  }

  /**
   * Get location quality score
   * @param {number} accuracy - GPS accuracy
   * @param {number} distance - Distance from target
   * @param {number} maxDistance - Maximum allowed distance
   * @returns {number} Quality score (0-100)
   */
  getLocationQuality(accuracy, distance, maxDistance) {
    try {
      if (accuracy == null || distance == null || maxDistance == null) {
        return 0;
      }

      // Accuracy factor (0-50 points)
      const accuracyScore = Math.max(0, Math.min(50, 50 - (accuracy / 10)));

      // Distance factor (0-50 points)
      const distanceScore = distance <= maxDistance ?
        50 - (distance / maxDistance) * 50 : 0;

      const totalScore = accuracyScore + distanceScore;

      return Math.round(Math.max(0, Math.min(100, totalScore)));

    } catch (error) {
      console.error('Get location quality error:', error);
      return 0;
    }
  }

  /**
   * Format distance for display
   * @param {number} distance - Distance in meters
   * @returns {string} Formatted distance
   */
  formatDistance(distance) {
    try {
      if (typeof distance !== 'number' || isNaN(distance)) {
        return 'N/A';
      }

      if (distance < 1000) {
        return `${Math.round(distance)}m`;
      } else {
        return `${(distance / 1000).toFixed(1)}km`;
      }

    } catch (error) {
      console.error('Format distance error:', error);
      return 'N/A';
    }
  }

  /**
   * Mock GPS data generator for testing
   * @param {number} centerLat - Center latitude
   * @param {number} centerLon - Center longitude
   * @param {number} radius - Radius in meters
   * @returns {Object} Random GPS coordinates within radius
   */
  generateMockLocation(centerLat, centerLon, radius = 100) {
    try {
      // Generate random angle and distance
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radius;

      // Convert to meters, then back to degrees (approximate)
      const latOffset = (distance / 111320) * Math.cos(angle); // ~111km per degree latitude
      const lonOffset = (distance / (111320 * Math.cos(this.toRadians(centerLat)))) * Math.sin(angle);

      const lat = centerLat + latOffset;
      const lon = centerLon + lonOffset;

      return {
        lat: Math.round(lat * 1000000) / 1000000,
        lon: Math.round(lon * 1000000) / 1000000,
        accuracy: Math.round(Math.random() * 20) + 5, // 5-25m accuracy
        distance: Math.round(distance)
      };

    } catch (error) {
      console.error('Generate mock location error:', error);
      return null;
    }
  }
}

// Export singleton instance
module.exports = new LocationService();