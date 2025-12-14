// ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import { View, Text } from 'react-native';

class GlobalErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: any }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // THIS IS THE CRUCIAL LINE
    console.log("!!! GLOBAL CONTEXT FATAL ERROR:", error.message, error.stack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, color: 'red' }}>💥 App Crash Detected 💥</Text>
          <Text style={{ marginTop: 10 }}>See Logcat for the full error details (!!! GLOBAL CONTEXT FATAL ERROR).</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default GlobalErrorBoundary;