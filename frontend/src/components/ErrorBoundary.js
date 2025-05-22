import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Une erreur est survenue :</h1>
          <p>{this.state.error?.message || 'Erreur inconnue'}</p>
          <button onClick={() => window.location.reload()}>Recharger la page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
