# Jeevan Saathi Mobile App Testing Strategy

## 🎯 Testing & Error Reporting Setup

### 1. Development Testing Commands

```bash
# Navigate to mobile app
cd C:\JeevanSaathi

# Clean and build (when issues arise)
cd android
./gradlew clean
./gradlew assembleDebug
cd ..

# Run the app with logging
npx react-native run-android --verbose

# Start Metro bundler separately (for better error visibility)
npx react-native start --reset-cache
```

### 2. Error Identification & Reporting

#### A. Console Logging Setup
```javascript
// Add to App.tsx or any component for debugging
import { YellowBox } from 'react-native';

// Ignore specific warnings during development
YellowBox.ignoreWarnings([
  'VirtualizedLists should never be nested',
  'Setting a timer for a long period of time',
]);

// Enhanced error logging
const logError = (error, context) => {
  console.error(`[${context}] Error:`, error);
  console.error('Stack trace:', error.stack);
};
```

#### B. Firebase Error Handling
```javascript
// Enhanced Firebase error handling in dataService.ts
const handleFirebaseError = (error, operation) => {
  console.error(`Firebase ${operation} Error:`, {
    code: error.code,
    message: error.message,
    stack: error.stack
  });
  
  // User-friendly error messages
  const userMessage = getFirebaseErrorMessage(error.code);
  Alert.alert('Error', userMessage);
};

const getFirebaseErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet.';
    case 'auth/user-not-found':
      return 'User not found. Please check your credentials.';
    case 'firestore/permission-denied':
      return 'Permission denied. Please try signing in again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};
```

### 3. Common Error Scenarios & Solutions

#### A. Build Errors
- **Metro bundler cache issues**: `npx react-native start --reset-cache`
- **Android build failures**: Clean gradle cache
- **Node modules corruption**: `npm install` or `rm -rf node_modules && npm install`

#### B. Firebase Errors
- **Network issues**: Check internet connection and Firebase configuration
- **Authentication errors**: Verify google-services.json is properly configured
- **Firestore permission errors**: Check Firebase security rules

#### C. Navigation Errors
- **Screen navigation issues**: Check if all screens are properly imported and configured
- **Drawer navigation problems**: Verify navigation state management

### 4. Error Reporting Checklist

When reporting errors, include:

1. **Environment Details**:
   - React Native version: 0.80.2
   - Android target SDK: 35
   - Device/Emulator info
   - Internet connectivity status

2. **Error Context**:
   - Which screen/action triggered the error
   - User authentication state
   - Steps to reproduce

3. **Console Logs**:
   - Metro bundler output
   - Android logcat (adb logcat)
   - JavaScript console errors

4. **Code Changes**:
   - Recent modifications made
   - Git commit hash (if using version control)

### 5. Testing Workflow

#### A. Pre-deployment Testing
1. **Authentication Flow**:
   - Sign up with new email
   - Sign in with existing credentials
   - Sign out functionality

2. **Core Features**:
   - Task creation/editing (Kary module)
   - Habit tracking (Abhyasa module)
   - Daily logging (Dainandini module)
   - Navigation between screens

3. **Data Persistence**:
   - Verify Firebase data synchronization
   - Test offline/online scenarios
   - Check data consistency across app restarts

#### B. Error Recovery Testing
1. **Network Interruption**:
   - Disable wifi/mobile data during operations
   - Verify graceful error handling

2. **App Backgrounding**:
   - Test app behavior when backgrounded/foregrounded
   - Verify authentication state persistence

3. **Memory Management**:
   - Test with large datasets
   - Monitor for memory leaks during extended usage

### 6. Automated Testing Commands

```bash
# Run unit tests
npm test

# Run linting
npm run lint

# Type checking
npx tsc --noEmit

# Bundle analysis
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android-bundle.js --sourcemap-output android-bundle.map
```

### 7. Debugging Tools

1. **React Native Debugger**: For state inspection
2. **Flipper**: For network requests and Firebase debugging
3. **Android Studio Logcat**: For native Android logs
4. **Chrome DevTools**: For JavaScript debugging

### 8. Performance Monitoring

```javascript
// Add performance monitoring
const startTime = Date.now();
const operation = async () => {
  try {
    await someOperation();
    console.log(`Operation completed in ${Date.now() - startTime}ms`);
  } catch (error) {
    console.error(`Operation failed after ${Date.now() - startTime}ms`, error);
  }
};
```

### 9. Emergency Recovery Procedures

If the app crashes or becomes unresponsive:

1. **Clean build**:
   ```bash
   cd C:\JeevanSaathi
   cd android
   ./gradlew clean
   cd ..
   rm -rf node_modules
   npm install
   cd android
   ./gradlew assembleDebug
   ```

2. **Reset Metro cache**:
   ```bash
   npx react-native start --reset-cache
   ```

3. **Check Firebase configuration**:
   - Verify google-services.json is present and valid
   - Ensure Firebase project is active
   - Check internet connectivity

### 10. Version Control Best Practices

- Commit working states frequently
- Tag stable releases
- Maintain separate branches for experimental features
- Document breaking changes in commit messages

---

## 📱 Quick Testing Commands Reference

```bash
# Essential commands for quick testing
cd C:\JeevanSaathi

# 1. Quick run (if everything is working)
npx react-native run-android

# 2. Clean run (if issues exist)
npx react-native start --reset-cache &
cd android && ./gradlew clean && ./gradlew assembleDebug && cd ..
npx react-native run-android

# 3. Debug mode with verbose logging
npx react-native run-android --verbose

# 4. Check dependencies
npm ls --depth=0

# 5. Environment check
npx react-native doctor
```
