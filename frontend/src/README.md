# Frontend Documentation

This is the frontend for the Web3 AI NFT Platform. It is built with React and TypeScript, and integrates with the backend services for authentication, blockchain transactions, IPFS storage, and ORA AI functionality.

## Integration with Backend

The frontend communicates with the backend through a set of service modules located in the `services` directory. These services use Axios to make HTTP requests to the backend API endpoints.

### API Client

The `apiClient.ts` file contains the base configuration for making API requests. It handles:

-   Setting the base URL for all API requests
-   Adding authentication tokens to requests
-   Intercepting 401 responses to refresh tokens
-   Standardized error handling

### Service Modules

The frontend includes the following service modules for interacting with the backend:

1. **Authentication Service (`authService.ts`)**

    - Handles user authentication with Google OAuth
    - Manages JWT tokens and user information
    - Provides login, logout, and authentication status functions

2. **Blockchain Service (`blockchainService.ts`)**

    - Provides wallet connection functionality (direct from frontend)
    - Interacts with backend blockchain endpoints for NFT operations
    - Supports minting NFTs and recording provenance information

3. **IPFS Service (`ipfsService.ts`)**

    - Uploads files and metadata to IPFS through the backend
    - Retrieves content from IPFS
    - Prepares NFT metadata for blockchain storage

4. **ORA AI Service (`oraService.ts`)**

    - Integrates with ORA AI for image generation and analysis
    - Supports luxury item verification through the backend

5. **Okto Web3 Service (`oktoService.ts`)**
    - Provides interfaces for interacting with Okto Web3 wallets
    - Supports creating wallets, checking balances, and sending transactions

### Importing Services

All services are exported from a single `services/index.ts` file for easy importing:

```tsx
import { authService, blockchainService, ipfsService, oraService, oktoService } from '../services';
```

## Environment Configuration

The frontend expects a backend API running at `http://localhost:3001` by default. You can modify this in the `.env` file by setting:

```
REACT_APP_API_URL=http://your-backend-url
```

## Using the Services

Example of using the services in a React component:

```tsx
import React, { useState, useEffect } from 'react';
import { authService, ipfsService } from '../services';

function MyComponent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is authenticated
    setIsLoggedIn(authService.isAuthenticated());
    if (authService.isAuthenticated()) {
      setUser(authService.getCurrentUser());
    }
  }, []);

  const handleFileUpload = async (file) => {
    try {
      const result = await ipfsService.uploadToIPFS(file);
      if (result.success) {
        console.log('File uploaded to IPFS:', result.hash);
      } else {
        console.error('Error uploading file:', result.error);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    // Your component JSX
  );
}
```

## Security Considerations

-   The frontend never stores private keys or sensitive blockchain information
-   Authentication tokens are stored in localStorage and included in API requests
-   Secure routes in the application should check authentication status before rendering

## Error Handling

All service functions return standardized response objects with:

-   `success`: Boolean indicating success or failure
-   Data fields (varies by function)
-   `error`: String message if an error occurred

This allows for consistent error handling throughout the application.
