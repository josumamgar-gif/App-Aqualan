import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Algo ha fallado</Text>
          <Text style={styles.message}>
            Cierra la app y ábrela de nuevo. Si el problema continúa, comprueba que la URL del backend esté configurada.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.buttonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F9FC',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#023E8A',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#546E7A',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#0077B6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
