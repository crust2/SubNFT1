# Frontend Integration Guide

This guide explains how to integrate the backend API with your existing frontend.

## 🔄 Backend Integration

Your frontend currently uses direct contract interactions via Wagmi. To integrate with the backend API, you have two options:

### Option 1: Hybrid Approach (Recommended)
Keep direct contract reads for real-time data, use backend for complex operations.

### Option 2: Full Backend Integration
Replace all contract interactions with API calls.

## 📡 API Integration Examples

### 1. Update useSubscriptionPlans Hook

```typescript
// hooks/use-subscription-contract.ts
import { useQuery } from '@tanstack/react-query';

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const response = await fetch('/api/plans');
      if (!response.ok) throw new Error('Failed to fetch plans');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### 2. Update useUserSubscriptions Hook

```typescript
export function useUserSubscriptions(userAddress?: `0x${string}`) {
  return useQuery({
    queryKey: ['user-subscriptions', userAddress],
    queryFn: async () => {
      if (!userAddress) return [];
      const response = await fetch(`/api/subscriptions/${userAddress}`);
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      return response.json();
    },
    enabled: !!userAddress,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
```

### 3. Update useUSDCBalance Hook

```typescript
export function useUSDCBalance(userAddress?: `0x${string}`) {
  return useQuery({
    queryKey: ['usdc-balance', userAddress],
    queryFn: async () => {
      if (!userAddress) return null;
      const response = await fetch(`/api/balance/usdc/${userAddress}`);
      if (!response.ok) throw new Error('Failed to fetch balance');
      return response.json();
    },
    enabled: !!userAddress,
    staleTime: 30 * 1000, // 30 seconds
  });
}
```

### 4. Update Subscription Actions

```typescript
export function useSubscriptionActions() {
  const queryClient = useQueryClient();

  const subscribe = async (planId: bigint, duration: bigint, value: bigint) => {
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: planId.toString(),
        duration: duration.toString(),
        value: value.toString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Subscription failed');
    }

    const result = await response.json();
    
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['usdc-balance'] });
    
    return result;
  };

  const renewSubscription = async (tokenId: bigint, value: bigint) => {
    const response = await fetch('/api/renew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenId: tokenId.toString(),
        value: value.toString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Renewal failed');
    }

    const result = await response.json();
    queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
    
    return result;
  };

  const cancelSubscription = async (tokenId: bigint) => {
    const response = await fetch('/api/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenId: tokenId.toString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Cancellation failed');
    }

    const result = await response.json();
    queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['usdc-balance'] });
    
    return result;
  };

  return {
    subscribe,
    renewSubscription,
    cancelSubscription,
  };
}
```

## 🔧 Backend Proxy Setup

Add a proxy configuration to your Next.js app to route API calls to the backend:

```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
```

## 🌐 Environment Variables

Update your frontend `.env.local`:

```env
# Contract addresses (from deployment)
NEXT_PUBLIC_SUBSCRIPTION_CONTRACT=0x...
NEXT_PUBLIC_USDC_CONTRACT=0x...

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Backend URL (for direct API calls if not using proxy)
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

## 🚀 Quick Start Integration

1. **Start the backend server:**
   ```bash
   npm run backend:dev
   ```

2. **Update your frontend hooks** with the examples above

3. **Test the integration:**
   - Connect your wallet
   - Check if plans load from the API
   - Try subscribing to a plan

## 🔍 Debugging

### Check Backend Health
```bash
curl http://localhost:5000/api/health
```

### Check API Endpoints
```bash
# Get plans
curl http://localhost:5000/api/plans

# Get user subscriptions (replace with actual address)
curl http://localhost:5000/api/subscriptions/0x1234...
```

### Frontend Network Tab
- Open browser dev tools
- Check Network tab for API calls
- Verify requests are reaching the backend

## ⚠️ Important Notes

1. **CORS**: Backend is configured for `http://localhost:3000`
2. **Error Handling**: Always handle API errors gracefully
3. **Loading States**: Show loading indicators during API calls
4. **Cache Invalidation**: Invalidate React Query cache after mutations
5. **Fallback**: Keep direct contract calls as fallback for critical operations

## 🎯 Testing Checklist

- [ ] Backend server starts without errors
- [ ] API health check returns success
- [ ] Plans load from API endpoint
- [ ] User subscriptions load correctly
- [ ] USDC balance displays properly
- [ ] Subscription creation works
- [ ] Renewal functionality works
- [ ] Cancellation works with refunds
- [ ] Error handling works for failed requests
- [ ] Loading states display correctly

## 🆘 Troubleshooting

### Common Issues

1. **"Failed to fetch"**: Backend server not running
2. **CORS errors**: Check backend CORS configuration
3. **404 errors**: API endpoint not found
4. **500 errors**: Check backend logs for details

### Debug Steps

1. Check if backend is running on port 5000
2. Verify environment variables are set
3. Check browser network tab for request details
4. Check backend console for error logs
5. Test API endpoints directly with curl/Postman

---

This integration maintains your existing UI while adding backend functionality for better scalability and user experience.
