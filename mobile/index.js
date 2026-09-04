import { registerRootComponent } from 'expo';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import App from './App';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Root ErrorBoundary Caught]:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Vasantham CRM</Text>
          <Text style={styles.errorSubtitle}>
            {this.state.error?.message || 'A runtime error occurred.'}
          </Text>
          <TouchableOpacity style={styles.reloadBtn} onPress={this.handleReload} activeOpacity={0.8}>
            <Text style={styles.reloadBtnText}>Reload App</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  reloadBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  reloadBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});

function Root() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

registerRootComponent(Root);

