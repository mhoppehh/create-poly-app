# Native Device Features

## Overview

Integration with native device capabilities including camera, location services, push notifications, biometrics, and file system access for enhanced mobile functionality.

## Priority

**MEDIUM** - Enhances mobile user experience with native capabilities

## Dependencies

- React Native application setup
- Expo or React Native CLI environment
- Platform-specific permissions

## Components

### Camera Integration

- **Photo Capture**: High-quality photo capture with camera controls
- **Video Recording**: Video recording with duration and quality controls
- **Barcode/QR Scanning**: Built-in barcode and QR code recognition
- **Image Processing**: Basic image editing and filtering capabilities
- **Gallery Access**: Pick images from device photo library

### Location Services

- **GPS Positioning**: Real-time location tracking with accuracy settings
- **Background Location**: Location tracking when app is backgrounded
- **Geofencing**: Monitor entry/exit of geographic regions
- **Maps Integration**: Display location on maps with markers
- **Location History**: Store and retrieve location history

### Push Notifications

- **Local Notifications**: Schedule notifications within the app
- **Remote Notifications**: Server-triggered push notifications
- **Rich Notifications**: Images, actions, and interactive content
- **Notification Categories**: Organize notifications by type
- **Badge Management**: App icon badge count management

### Biometric Authentication

- **Fingerprint Recognition**: Touch ID and fingerprint authentication
- **Face Recognition**: Face ID and facial recognition
- **Biometric Availability**: Check device biometric capabilities
- **Fallback Authentication**: PIN/password fallback options
- **Secure Storage**: Store sensitive data with biometric protection

### File System Access

- **Local File Storage**: Read/write files to device storage
- **Document Picker**: Select documents from device storage
- **File Sharing**: Share files with other apps
- **Cache Management**: Manage app cache and temporary files
- **Secure File Storage**: Encrypted file storage

### Additional Features

- **Contacts Access**: Read/write device contacts
- **Calendar Integration**: Create and manage calendar events
- **Device Info**: Retrieve device hardware and software information
- **Haptic Feedback**: Provide tactile feedback for user interactions
- **Screen Brightness**: Control device screen brightness

## Configuration

```typescript
interface DeviceFeaturesConfig {
  camera: {
    enabled: boolean
    features: ('photo' | 'video' | 'barcode')[]
  }
  location: {
    enabled: boolean
    precision: 'coarse' | 'fine'
    background: boolean
  }
  notifications: {
    local: boolean
    remote: boolean
    provider: 'expo' | 'firebase'
  }
  biometrics: boolean
  fileSystem: boolean
}
```

## Generated Files

```
mobile/src/services/
├── camera/
│   ├── CameraService.ts          # Camera functionality
│   ├── ImagePicker.ts            # Image selection
│   └── BarcodeScanner.ts         # QR/Barcode scanning
├── location/
│   ├── LocationService.ts        # Location tracking
│   ├── Geofencing.ts            # Geographic monitoring
│   └── LocationHistory.ts        # Location data storage
├── notifications/
│   ├── NotificationService.ts    # Push notification handling
│   ├── LocalNotifications.ts     # Local notification scheduling
│   └── NotificationCategories.ts # Notification organization
├── biometrics/
│   ├── BiometricAuth.ts         # Biometric authentication
│   └── SecureStorage.ts         # Secure data storage
├── filesystem/
│   ├── FileService.ts           # File system operations
│   ├── DocumentPicker.ts        # Document selection
│   └── FileSharing.ts           # File sharing capabilities
└── device/
    ├── DeviceInfo.ts            # Device information
    ├── ContactsService.ts       # Contacts management
    └── CalendarService.ts       # Calendar integration
```

## Camera Service Implementation

```typescript
// services/camera/CameraService.ts
import * as ImagePicker from 'expo-image-picker'
import * as MediaLibrary from 'expo-media-library'
import { Camera, CameraType } from 'expo-camera'

export interface CameraOptions {
  quality: number // 0-1
  allowsEditing: boolean
  aspect: [number, number]
  base64: boolean
}

export interface VideoOptions {
  quality: 'low' | 'medium' | 'high'
  maxDuration: number // seconds
}

export class CameraService {
  static async requestPermissions(): Promise<boolean> {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync()
    const { status: mediaLibraryStatus } = await MediaLibrary.requestPermissionsAsync()

    return cameraStatus === 'granted' && mediaLibraryStatus === 'granted'
  }

  static async takePhoto(options: Partial<CameraOptions> = {}): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions()
      if (!hasPermission) {
        throw new Error('Camera permission denied')
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: options.quality ?? 0.8,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [4, 3],
        base64: options.base64 ?? false,
      })

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri
      }

      return null
    } catch (error) {
      console.error('Camera error:', error)
      throw error
    }
  }

  static async recordVideo(options: Partial<VideoOptions> = {}): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions()
      if (!hasPermission) {
        throw new Error('Camera permission denied')
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        videoQuality: this.getVideoQuality(options.quality ?? 'medium'),
        videoMaxDuration: options.maxDuration ?? 60,
      })

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri
      }

      return null
    } catch (error) {
      console.error('Video recording error:', error)
      throw error
    }
  }

  static async pickImageFromLibrary(options: Partial<CameraOptions> = {}): Promise<string | null> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== 'granted') {
        throw new Error('Media library permission denied')
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: options.quality ?? 0.8,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [4, 3],
        base64: options.base64 ?? false,
      })

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri
      }

      return null
    } catch (error) {
      console.error('Image picker error:', error)
      throw error
    }
  }

  private static getVideoQuality(quality: string): number {
    switch (quality) {
      case 'low':
        return 0
      case 'medium':
        return 1
      case 'high':
        return 2
      default:
        return 1
    }
  }
}
```

## Location Service Implementation

```typescript
// services/location/LocationService.ts
import * as Location from 'expo-location'

export interface LocationOptions {
  accuracy: Location.Accuracy
  enableHighAccuracy: boolean
  timeout: number
  maximumAge: number
}

export interface GeofenceRegion {
  identifier: string
  latitude: number
  longitude: number
  radius: number
}

export class LocationService {
  private static watchId: Location.LocationSubscription | null = null

  static async requestPermissions(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync()
    return status === 'granted'
  }

  static async requestBackgroundPermissions(): Promise<boolean> {
    const { status } = await Location.requestBackgroundPermissionsAsync()
    return status === 'granted'
  }

  static async getCurrentLocation(options: Partial<LocationOptions> = {}): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.requestPermissions()
      if (!hasPermission) {
        throw new Error('Location permission denied')
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: options.accuracy ?? Location.Accuracy.Balanced,
        maximumAge: options.maximumAge ?? 10000,
      })

      return location
    } catch (error) {
      console.error('Location error:', error)
      return null
    }
  }

  static async startLocationTracking(
    callback: (location: Location.LocationObject) => void,
    options: Partial<LocationOptions> = {},
  ): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions()
      if (!hasPermission) {
        return false
      }

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: options.accuracy ?? Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        callback,
      )

      return true
    } catch (error) {
      console.error('Location tracking error:', error)
      return false
    }
  }

  static stopLocationTracking(): void {
    if (this.watchId) {
      this.watchId.remove()
      this.watchId = null
    }
  }

  static async startGeofencing(
    regions: GeofenceRegion[],
    callback: (event: Location.LocationGeofencingEventType) => void,
  ): Promise<boolean> {
    try {
      const hasPermission = await this.requestBackgroundPermissions()
      if (!hasPermission) {
        return false
      }

      await Location.startGeofencingAsync(
        'geofence-task',
        regions.map(region => ({
          identifier: region.identifier,
          latitude: region.latitude,
          longitude: region.longitude,
          radius: region.radius,
        })),
      )

      return true
    } catch (error) {
      console.error('Geofencing error:', error)
      return false
    }
  }

  static async reverseGeocode(latitude: number, longitude: number): Promise<Location.LocationGeocodedAddress[]> {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      })
      return result
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return []
    }
  }
}
```

## Push Notification Service

```typescript
// services/notifications/NotificationService.ts
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'

export interface NotificationContent {
  title: string
  body: string
  data?: any
}

export interface LocalNotificationOptions {
  content: NotificationContent
  trigger: Notifications.NotificationTriggerInput | null
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export class NotificationService {
  static async requestPermissions(): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn('Must use physical device for Push Notifications')
      return null
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!')
      return null
    }

    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })
    ).data

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      })
    }

    return token
  }

  static async scheduleLocalNotification(options: LocalNotificationOptions): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync(options)
      return notificationId
    } catch (error) {
      console.error('Local notification error:', error)
      throw error
    }
  }

  static async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId)
  }

  static async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync()
  }

  static async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count)
  }

  static async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync()
  }

  static addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void,
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener)
  }

  static addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void,
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener)
  }
}
```

## Biometric Authentication Service

```typescript
// services/biometrics/BiometricAuth.ts
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'

export interface BiometricAuthOptions {
  promptMessage: string
  cancelLabel: string
  fallbackLabel: string
  disableDeviceFallback: boolean
}

export class BiometricAuth {
  static async isAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    const isEnrolled = await LocalAuthentication.isEnrolledAsync()
    return hasHardware && isEnrolled
  }

  static async getSupportedAuthenticationTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    return await LocalAuthentication.supportedAuthenticationTypesAsync()
  }

  static async authenticate(options: Partial<BiometricAuthOptions> = {}): Promise<boolean> {
    try {
      const isAvailable = await this.isAvailable()
      if (!isAvailable) {
        throw new Error('Biometric authentication not available')
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options.promptMessage ?? 'Authenticate',
        cancelLabel: options.cancelLabel ?? 'Cancel',
        fallbackLabel: options.fallbackLabel ?? 'Use Passcode',
        disableDeviceFallback: options.disableDeviceFallback ?? false,
      })

      return result.success
    } catch (error) {
      console.error('Biometric authentication error:', error)
      return false
    }
  }

  static async storeSecureData(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value, {
      requireAuthentication: true,
      authenticationPrompt: 'Authenticate to access secure data',
    })
  }

  static async getSecureData(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key, {
        requireAuthentication: true,
        authenticationPrompt: 'Authenticate to access secure data',
      })
    } catch (error) {
      console.error('Secure data retrieval error:', error)
      return null
    }
  }

  static async deleteSecureData(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key)
  }
}
```

## Device Information Service

```typescript
// services/device/DeviceInfo.ts
import * as Device from 'expo-device'
import * as Application from 'expo-application'
import Constants from 'expo-constants'

export interface DeviceInformation {
  deviceName: string | null
  modelName: string | null
  brand: string | null
  manufacturer: string | null
  osName: string | null
  osVersion: string | null
  platformApiLevel: number | null
  deviceYearClass: number | null
  totalMemory: number | null
  isDevice: boolean
  isRooted?: boolean
}

export interface AppInformation {
  applicationName: string | null
  applicationId: string | null
  applicationVersion: string | null
  buildVersion: string | null
  nativeApplicationVersion: string | null
  nativeBuildVersion: string | null
}

export class DeviceInfoService {
  static async getDeviceInfo(): Promise<DeviceInformation> {
    return {
      deviceName: Device.deviceName,
      modelName: Device.modelName,
      brand: Device.brand,
      manufacturer: Device.manufacturer,
      osName: Device.osName,
      osVersion: Device.osVersion,
      platformApiLevel: Device.platformApiLevel,
      deviceYearClass: Device.deviceYearClass,
      totalMemory: Device.totalMemory,
      isDevice: Device.isDevice,
      isRooted: await Device.isRootedExperimentalAsync(),
    }
  }

  static async getAppInfo(): Promise<AppInformation> {
    return {
      applicationName: Application.applicationName,
      applicationId: Application.applicationId,
      applicationVersion: Application.nativeApplicationVersion,
      buildVersion: Application.nativeBuildVersion,
      nativeApplicationVersion: Application.nativeApplicationVersion,
      nativeBuildVersion: Application.nativeBuildVersion,
    }
  }

  static getExpoInfo() {
    return {
      expoVersion: Constants.expoVersion,
      sdkVersion: Constants.expoConfig?.sdkVersion,
      appOwnership: Constants.appOwnership,
      isDetached: Constants.isDetached,
      experienceUrl: Constants.experienceUrl,
    }
  }

  static async getSystemInfo() {
    const deviceInfo = await this.getDeviceInfo()
    const appInfo = await this.getAppInfo()
    const expoInfo = this.getExpoInfo()

    return {
      device: deviceInfo,
      app: appInfo,
      expo: expoInfo,
      timestamp: new Date().toISOString(),
    }
  }
}
```

## Custom Hooks for Device Features

```typescript
// hooks/useCamera.ts
import { useState, useCallback } from 'react'
import { CameraService, CameraOptions } from '../services/camera/CameraService'

export function useCamera() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const takePhoto = useCallback(async (options?: Partial<CameraOptions>) => {
    try {
      setLoading(true)
      setError(null)
      const uri = await CameraService.takePhoto(options)
      return uri
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Camera error'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const pickImage = useCallback(async (options?: Partial<CameraOptions>) => {
    try {
      setLoading(true)
      setError(null)
      const uri = await CameraService.pickImageFromLibrary(options)
      return uri
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Image picker error'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    takePhoto,
    pickImage,
    loading,
    error,
  }
}
```

```typescript
// hooks/useLocation.ts
import { useState, useEffect, useCallback } from 'react'
import { LocationService } from '../services/location/LocationService'
import * as Location from 'expo-location'

export function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getCurrentLocation = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const loc = await LocationService.getCurrentLocation()
      setLocation(loc)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Location error'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const startTracking = useCallback(async () => {
    try {
      setError(null)
      const success = await LocationService.startLocationTracking(setLocation)
      if (!success) {
        setError('Failed to start location tracking')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Tracking error'
      setError(errorMessage)
    }
  }, [])

  const stopTracking = useCallback(() => {
    LocationService.stopLocationTracking()
  }, [])

  useEffect(() => {
    return () => {
      stopTracking()
    }
  }, [stopTracking])

  return {
    location,
    loading,
    error,
    getCurrentLocation,
    startTracking,
    stopTracking,
  }
}
```
