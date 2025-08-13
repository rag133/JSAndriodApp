import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Firebase configuration for React Native Firebase
// The configuration is automatically loaded from google-services.json (Android) and GoogleService-Info.plist (iOS)

export { auth, firestore };

// Initialize Firestore settings for better performance
firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});

// Export commonly used Firebase services
export const db = firestore();
export const authService = auth();

// Helper functions for common Firebase operations
export const FirebaseHelpers = {
  // Get current user
  getCurrentUser: () => auth().currentUser,
  
  // Check if user is authenticated
  isAuthenticated: () => !!auth().currentUser,
  
  // Create a new document with auto-generated ID
  createDocument: async (collection: string, data: any) => {
    const docRef = await firestore().collection(collection).add(data);
    return docRef.id;
  },
  
  // Get a document by ID
  getDocument: async (collection: string, docId: string) => {
    const doc = await firestore().collection(collection).doc(docId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },
  
  // Update a document
  updateDocument: async (collection: string, docId: string, data: any) => {
    await firestore().collection(collection).doc(docId).update(data);
  },
  
  // Delete a document
  deleteDocument: async (collection: string, docId: string) => {
    await firestore().collection(collection).doc(docId).delete();
  },
  
  // Get all documents from a collection
  getCollection: async (collection: string, userId?: string) => {
    let query = firestore().collection(collection);
    
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  // Listen to real-time updates
  subscribeToCollection: (
    collection: string, 
    callback: (data: any[]) => void, 
    userId?: string
  ) => {
    let query = firestore().collection(collection);
    
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    
    return query.onSnapshot(snapshot => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    });
  }
};
