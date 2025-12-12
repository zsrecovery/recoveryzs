// app/auth/logout.tsx
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { auth } from '@/firebaseConfig';
import { useRouter, useSegments } from 'expo-router';

export default function LogoutScreen() {
  const router = useRouter();
  const segments = useSegments(); // get current route segments

  useEffect(() => {
    auth.signOut()
      .then(() => {
        Alert.alert('Logged out', 'You have been logged out.', [
          {
            text: 'OK',
            onPress: () => {
              // Always go to the root index page
              router.replace('/index'); 
            },
          },
        ]);
      })
      .catch(err => Alert.alert('Logout failed', err.message));
  }, []);

  return null;
}
