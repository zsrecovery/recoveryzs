import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

// --- 1. Define the User Info We Share (The Dashboard Data) ---
// This is the structure of the data that will be shared across the app.
interface AuthContextType {
  user: User | null; // Stores the user's basic login information (null if logged out)
  isLoading: boolean; // True while we wait for Firebase to check the login status
  userRole: 'client' | 'driver' | null; // Stores the user's assigned role
  refreshAuthToken: () => Promise<void>; // A function to quickly update the role after login
}

// Create the actual "box" (Context) to hold all the user information
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- 2. The Provider: Manages and Updates the Info ---
// This component wraps the whole app and actively listens to Firebase for changes.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'client' | 'driver' | null>(null);
  const auth = getAuth(); // Get the Firebase authentication tool

  // Helper function to force Firebase to give us the user's current 'role'
  const refreshAuthToken = async () => {
    if (user) {
      // Ask for the latest ID ticket, which contains the 'role' claim. The 'true' forces a check.
      const tokenResult = await user.getIdTokenResult(true); 
      // Read the 'role' claim from the ticket
      const role = tokenResult.claims.role as 'client' | 'driver' | null; 
      setUserRole(role); 
      console.log('Token refreshed. New Role:', role);
    }
  };

  useEffect(() => {
    // This watches the login status constantly
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser); // Save the logged-in user details
      if (authUser) {
        // If logged in, check their role right away
        await refreshAuthToken(); 
      } else {
        setUserRole(null); 
      }
      setIsLoading(false); // Finished checking
    });

    return () => unsubscribe(); // Cleanup the listener when the component is removed
  }, []); 

  return (
    // Share the current user data with the rest of the app
    <AuthContext.Provider value={{ user, isLoading, userRole, refreshAuthToken }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- 3. The Hook: The simple way to ask for the info ---
// Any component can call useAuth() to get the current user's status.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};