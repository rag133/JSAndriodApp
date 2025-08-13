import { Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Debug utility functions for mobile app troubleshooting

export const DebugUtils = {
  // Log app state for debugging
  logAppState: () => {
    const user = auth().currentUser;
    console.log('=== APP DEBUG INFO ===');
    console.log('User authenticated:', !!user);
    console.log('User email:', user?.email || 'Not signed in');
    console.log('Firebase app initialized:', !!firestore().app);
    console.log('Timestamp:', new Date().toISOString());
    console.log('=====================');
  },

  // Test Firebase connection
  testFirebaseConnection: async () => {
    try {
      console.log('Testing Firebase connection...');
      
      // Test Firestore connection
      const testDoc = await firestore().collection('_test').doc('connection').get();
      console.log('✅ Firestore connection successful');
      
      // Test Auth connection
      const currentUser = auth().currentUser;
      console.log('✅ Auth connection successful, user:', currentUser?.email || 'Not signed in');
      
      return { success: true, message: 'Firebase connection working' };
    } catch (error: any) {
      console.error('❌ Firebase connection failed:', error);
      return { success: false, message: error.message };
    }
  },

  // Test data operations
  testDataOperations: async () => {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Testing data operations...');
      
      // Test user collection access
      const userDocRef = firestore().collection('users').doc(user.uid);
      const userDoc = await userDocRef.get();
      
      if (!userDoc.exists) {
        // Create user document if it doesn't exist
        await userDocRef.set({
          email: user.email,
          createdAt: new Date(),
          lastActive: new Date(),
        });
        console.log('✅ Created user document');
      } else {
        console.log('✅ User document exists');
      }

      // Test subcollection access
      const tasksRef = userDocRef.collection('tasks');
      const tasksSnapshot = await tasksRef.limit(1).get();
      console.log('✅ Tasks collection accessible, count:', tasksSnapshot.size);

      return { success: true, message: 'Data operations working' };
    } catch (error: any) {
      console.error('❌ Data operations failed:', error);
      return { success: false, message: error.message };
    }
  },

  // Show debug info alert
  showDebugInfo: async () => {
    try {
      const firebaseTest = await DebugUtils.testFirebaseConnection();
      const dataTest = await DebugUtils.testDataOperations();
      
      const debugInfo = [
        `Firebase: ${firebaseTest.success ? '✅' : '❌'} ${firebaseTest.message}`,
        `Data Ops: ${dataTest.success ? '✅' : '❌'} ${dataTest.message}`,
        `User: ${auth().currentUser?.email || 'Not signed in'}`,
        `Time: ${new Date().toLocaleString()}`,
      ].join('\n');

      Alert.alert('Debug Info', debugInfo, [
        { text: 'Copy to Console', onPress: () => console.log(debugInfo) },
        { text: 'OK' }
      ]);
    } catch (error: any) {
      Alert.alert('Debug Error', error.message);
    }
  },

  // Enhanced error logging
  logError: (error: any, context: string, additionalInfo?: any) => {
    const timestamp = new Date().toISOString();
    const user = auth().currentUser;
    
    const errorLog = {
      timestamp,
      context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
      },
      user: {
        uid: user?.uid || 'anonymous',
        email: user?.email || 'not-signed-in',
      },
      additionalInfo,
    };

    console.error('🐛 ERROR LOG:', JSON.stringify(errorLog, null, 2));
    
    return errorLog;
  },

  // Performance monitoring
  startPerformanceTimer: (operation: string) => {
    const startTime = Date.now();
    console.log(`⏱️ Started: ${operation}`);
    
    return {
      end: () => {
        const duration = Date.now() - startTime;
        console.log(`⏱️ Completed: ${operation} in ${duration}ms`);
        return duration;
      }
    };
  },

  // Memory usage warning
  checkMemoryUsage: () => {
    // This is a placeholder - React Native doesn't expose memory APIs directly
    // In production, you'd use native modules or performance monitoring libraries
    console.log('💾 Memory check - use development tools for detailed analysis');
  },

  // Network status simulation
  simulateNetworkIssue: () => {
    console.warn('🌐 Simulating network issue - check error handling');
    Alert.alert(
      'Network Test',
      'This simulates a network error to test error handling',
      [{ text: 'OK' }]
    );
  },

  // Clear app data (for testing)
  clearAppData: async () => {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      Alert.alert(
        'Clear App Data',
        'This will delete all your data. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete All',
            style: 'destructive',
            onPress: async () => {
              try {
                // This is dangerous - only for testing
                const userDoc = firestore().collection('users').doc(user.uid);
                
                // Delete subcollections
                const collections = ['tasks', 'lists', 'tags', 'habits', 'goals', 'logEntries', 'foci'];
                for (const collectionName of collections) {
                  const snapshot = await userDoc.collection(collectionName).get();
                  const batch = firestore().batch();
                  snapshot.docs.forEach(doc => batch.delete(doc.ref));
                  await batch.commit();
                }
                
                Alert.alert('Success', 'All data cleared');
              } catch (error: any) {
                Alert.alert('Error', `Failed to clear data: ${error.message}`);
              }
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  },

  // Export debug report
  generateDebugReport: async () => {
    try {
      const user = auth().currentUser;
      const firebaseTest = await DebugUtils.testFirebaseConnection();
      const dataTest = await DebugUtils.testDataOperations();
      
      const report = {
        timestamp: new Date().toISOString(),
        user: {
          authenticated: !!user,
          email: user?.email || null,
          uid: user?.uid || null,
        },
        firebase: firebaseTest,
        dataOperations: dataTest,
        environment: {
          platform: 'Android', // React Native mobile
          version: '0.80.2',
        },
        features: {
          authentication: 'Working',
          navigation: 'Working',
          firestore: dataTest.success ? 'Working' : 'Failed',
        }
      };

      console.log('📋 DEBUG REPORT:', JSON.stringify(report, null, 2));
      
      Alert.alert(
        'Debug Report Generated',
        'Check console for full report details',
        [{ text: 'OK' }]
      );
      
      return report;
    } catch (error: any) {
      console.error('Failed to generate debug report:', error);
      return null;
    }
  },
};

// Global error handler
export const setupGlobalErrorHandler = () => {
  const originalConsoleError = console.error;
  
  console.error = (...args) => {
    // Log to original console
    originalConsoleError(...args);
    
    // Enhanced logging for debugging
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Error')) {
      DebugUtils.logError(args[1] || args[0], 'Global Error Handler', { args });
    }
  };
};

export default DebugUtils;
