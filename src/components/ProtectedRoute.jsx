import React from 'react';

export default function ProtectedRoute({ children }) {
  // Authentication requirement removed: all routes have open access
  return children;
}
