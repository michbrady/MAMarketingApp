# Routing and State Management Architecture

## Table of Contents
1. [Routing Architecture](#1-routing-architecture)
2. [State Management Architecture](#2-state-management-architecture)
3. [API Integration Layer](#3-api-integration-layer)
4. [Caching Strategy](#4-caching-strategy)
5. [Real-time Updates](#5-real-time-updates)

---

## 1. Routing Architecture

### 1.1 Route Configuration

**File**: `src/lib/constants/routes.ts`

```typescript
export const ROUTES = {
  // Public routes
  public: {
    trackingRedirect: (trackingId: string) => `/t/${trackingId}`,
  },

  // Auth routes
  auth: {
    login: '/login',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
  },

  // UFO routes
  ufo: {
    dashboard: '/dashboard',

    // Content
    content: {
      list: '/content',
      detail: (id: string) => `/content/${id}`,
      search: (query: string) => `/content?q=${encodeURIComponent(query)}`,
      category: (category: string) => `/content?category=${encodeURIComponent(category)}`,
    },

    // Share
    share: {
      new: (contentId: string) => `/share/${contentId}`,
    },

    // Contacts
    contacts: {
      list: '/contacts',
      detail: (id: string) => `/contacts/${id}`,
      new: '/contacts/new',
      import: '/contacts/import',
    },

    // Engagement
    engagement: '/engagement',
    activity: '/activity',
    history: '/history',

    // Settings
    settings: {
      profile: '/settings',
      account: '/settings/account',
      notifications: '/settings/notifications',
      preferences: '/settings/preferences',
    },
  },

  // Admin routes
  admin: {
    dashboard: '/admin-dashboard',

    // Content Management
    content: {
      list: '/content-management',
      new: '/content-management/new',
      edit: (id: string) => `/content-management/${id}`,
    },

    // Campaigns
    campaigns: {
      list: '/campaigns',
      new: '/campaigns/new',
      edit: (id: string) => `/campaigns/${id}`,
      detail: (id: string) => `/campaigns/${id}/overview`,
    },

    // Users
    users: {
      list: '/users',
      detail: (id: string) => `/users/${id}`,
    },

    // Analytics
    analytics: '/analytics',

    // Compliance
    compliance: '/compliance',

    // Settings
    settings: {
      general: '/system-settings',
      integrations: '/system-settings/integrations',
      templates: '/system-settings/templates',
      notifications: '/system-settings/notifications',
    },
  },
} as const;
```

### 1.2 Route Guards & Middleware

**File**: `src/middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';

// Public routes (no auth required)
const publicRoutes = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/t/', // Tracking links
];

// Admin-only routes
const adminRoutes = [
  '/admin-dashboard',
  '/content-management',
  '/campaigns',
  '/users',
  '/analytics',
  '/compliance',
  '/system-settings',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get user session
  const session = await getSession(request);

  // Redirect to login if not authenticated
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin routes
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  if (isAdminRoute && session.user.role !== 'admin' && session.user.role !== 'super_admin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
```

### 1.3 Navigation Hook

**File**: `src/hooks/useNavigation.ts`

```typescript
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { ROUTES } from '@/lib/constants/routes';

export function useNavigation() {
  const router = useRouter();

  const navigateTo = useCallback(
    (route: string, options?: { replace?: boolean }) => {
      if (options?.replace) {
        router.replace(route);
      } else {
        router.push(route);
      }
    },
    [router]
  );

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  return {
    navigateTo,
    goBack,
    router,
    routes: ROUTES,
  };
}
```

### 1.4 Breadcrumb Generation

**File**: `src/hooks/useBreadcrumbs.ts`

```typescript
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

interface Breadcrumb {
  label: string;
  href: string;
  isCurrentPage: boolean;
}

const breadcrumbNameMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/content': 'Content Library',
  '/share': 'Share',
  '/contacts': 'Contacts',
  '/engagement': 'Engagement',
  '/activity': 'Activity',
  '/history': 'Share History',
  '/settings': 'Settings',
  '/admin-dashboard': 'Admin Dashboard',
  '/content-management': 'Content Management',
  '/campaigns': 'Campaigns',
  '/users': 'Users',
  '/analytics': 'Analytics',
  '/compliance': 'Compliance',
  '/system-settings': 'System Settings',
};

export function useBreadcrumbs(): Breadcrumb[] {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    const paths = pathname.split('/').filter(Boolean);
    const crumbs: Breadcrumb[] = [];

    paths.forEach((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      const label = breadcrumbNameMap[href] || path.charAt(0).toUpperCase() + path.slice(1);

      crumbs.push({
        label,
        href,
        isCurrentPage: index === paths.length - 1,
      });
    });

    return crumbs;
  }, [pathname]);

  return breadcrumbs;
}
```

### 1.5 Query Parameters Hook

**File**: `src/hooks/useQueryParams.ts`

```typescript
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useQueryParams() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const getParam = useCallback(
    (key: string): string | null => {
      return searchParams.get(key);
    },
    [searchParams]
  );

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  const setParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        params.set(key, value);
      });
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  const removeParam = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pathname, router]
  );

  const clearParams = useCallback(() => {
    router.push(pathname);
  }, [pathname, router]);

  return {
    getParam,
    setParam,
    setParams,
    removeParam,
    clearParams,
    searchParams,
  };
}
```

---

## 2. State Management Architecture

### 2.1 Zustand Store Structure

#### Auth Store

**File**: `src/store/authStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user
        });
      },

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(credentials);
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          set({
            user: null,
            isAuthenticated: false
          });
        }
      },

      refreshUser: async () => {
        try {
          const user = await authApi.getCurrentUser();
          set({ user, isAuthenticated: true });
        } catch (error) {
          set({ user: null, isAuthenticated: false });
        }
      },

      updateProfile: async (data) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const updatedUser = await authApi.updateProfile(currentUser.id, data);
        set({ user: updatedUser });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);
```

#### UI Store

**File**: `src/store/uiStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Theme
  theme: 'light' | 'dark';

  // View preferences
  contentViewMode: 'grid' | 'list';
  contactViewMode: 'table' | 'cards';

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setContentViewMode: (mode: 'grid' | 'list') => void;
  setContactViewMode: (mode: 'table' | 'cards') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: 'light',
      contentViewMode: 'grid',
      contactViewMode: 'table',

      toggleSidebar: () => set((state) => ({
        sidebarOpen: !state.sidebarOpen
      })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      toggleSidebarCollapse: () => set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed
      })),

      setTheme: (theme) => set({ theme }),

      setContentViewMode: (mode) => set({ contentViewMode: mode }),

      setContactViewMode: (mode) => set({ contactViewMode: mode }),
    }),
    {
      name: 'ui-storage',
    }
  )
);
```

#### Notification Store

**File**: `src/store/notificationStore.ts`

```typescript
import { create } from 'zustand';
import type { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  setNotifications: (notifications: Notification[]) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      if (!notification || notification.isRead) return state;

      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      const wasUnread = notification && !notification.isRead;

      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  setNotifications: (notifications) => {
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    });
  },
}));
```

#### Share Store (Transient)

**File**: `src/store/shareStore.ts`

```typescript
import { create } from 'zustand';
import type { ContentItem, Contact, Channel } from '@/types';

interface ShareState {
  // Step 1: Content (pre-filled from route params)
  selectedContent: ContentItem | null;

  // Step 2: Channel
  selectedChannel: Channel | null;

  // Step 3: Recipients
  selectedRecipients: Contact[];

  // Step 4: Message
  message: string;
  subject: string;

  // Step 5: Result
  trackingLink: string | null;
  shareEventId: string | null;

  // Current step
  currentStep: number;

  // Actions
  setContent: (content: ContentItem) => void;
  setChannel: (channel: Channel) => void;
  addRecipient: (contact: Contact) => void;
  removeRecipient: (contactId: string) => void;
  setRecipients: (contacts: Contact[]) => void;
  setMessage: (message: string) => void;
  setSubject: (subject: string) => void;
  setTrackingLink: (link: string) => void;
  setShareEventId: (id: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

const initialState = {
  selectedContent: null,
  selectedChannel: null,
  selectedRecipients: [],
  message: '',
  subject: '',
  trackingLink: null,
  shareEventId: null,
  currentStep: 1,
};

export const useShareStore = create<ShareState>((set) => ({
  ...initialState,

  setContent: (content) => set({ selectedContent: content }),

  setChannel: (channel) => set({ selectedChannel: channel }),

  addRecipient: (contact) => set((state) => ({
    selectedRecipients: [...state.selectedRecipients, contact],
  })),

  removeRecipient: (contactId) => set((state) => ({
    selectedRecipients: state.selectedRecipients.filter((c) => c.id !== contactId),
  })),

  setRecipients: (contacts) => set({ selectedRecipients: contacts }),

  setMessage: (message) => set({ message }),

  setSubject: (subject) => set({ subject }),

  setTrackingLink: (link) => set({ trackingLink: link }),

  setShareEventId: (id) => set({ shareEventId: id }),

  nextStep: () => set((state) => ({
    currentStep: Math.min(5, state.currentStep + 1)
  })),

  prevStep: () => set((state) => ({
    currentStep: Math.max(1, state.currentStep - 1)
  })),

  reset: () => set(initialState),
}));
```

### 2.2 TanStack Query Configuration

**File**: `src/lib/query-client.ts`

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: how long until data is considered stale
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Cache time: how long unused data stays in cache
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

      // Retry failed requests
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus
      refetchOnWindowFocus: true,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});
```

**File**: `src/app/providers.tsx`

```typescript
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

### 2.3 Query Keys Factory

**File**: `src/lib/query-keys.ts`

```typescript
export const queryKeys = {
  // Content queries
  content: {
    all: ['content'] as const,
    lists: () => [...queryKeys.content.all, 'list'] as const,
    list: (filters: ContentFilters) => [...queryKeys.content.lists(), filters] as const,
    details: () => [...queryKeys.content.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.content.details(), id] as const,
    featured: () => [...queryKeys.content.all, 'featured'] as const,
    search: (query: string) => [...queryKeys.content.all, 'search', query] as const,
  },

  // Contact queries
  contacts: {
    all: ['contacts'] as const,
    lists: () => [...queryKeys.contacts.all, 'list'] as const,
    list: (filters: ContactFilters) => [...queryKeys.contacts.lists(), filters] as const,
    details: () => [...queryKeys.contacts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.contacts.details(), id] as const,
    timeline: (id: string) => [...queryKeys.contacts.all, 'timeline', id] as const,
  },

  // Share queries
  share: {
    all: ['share'] as const,
    history: () => [...queryKeys.share.all, 'history'] as const,
    historyList: (filters: HistoryFilters) => [...queryKeys.share.history(), filters] as const,
    detail: (id: string) => [...queryKeys.share.all, 'detail', id] as const,
  },

  // Engagement queries
  engagement: {
    all: ['engagement'] as const,
    dashboard: () => [...queryKeys.engagement.all, 'dashboard'] as const,
    metrics: (filters: MetricFilters) => [...queryKeys.engagement.all, 'metrics', filters] as const,
    topContent: () => [...queryKeys.engagement.all, 'top-content'] as const,
    topContacts: () => [...queryKeys.engagement.all, 'top-contacts'] as const,
  },

  // Activity queries
  activity: {
    all: ['activity'] as const,
    feed: (filters: ActivityFilters) => [...queryKeys.activity.all, 'feed', filters] as const,
  },

  // User queries
  user: {
    all: ['user'] as const,
    current: () => [...queryKeys.user.all, 'current'] as const,
    profile: (id: string) => [...queryKeys.user.all, 'profile', id] as const,
    settings: () => [...queryKeys.user.all, 'settings'] as const,
  },

  // Admin queries
  admin: {
    users: {
      all: ['admin', 'users'] as const,
      list: (filters: UserFilters) => [...queryKeys.admin.users.all, 'list', filters] as const,
      detail: (id: string) => [...queryKeys.admin.users.all, 'detail', id] as const,
    },
    campaigns: {
      all: ['admin', 'campaigns'] as const,
      list: () => [...queryKeys.admin.campaigns.all, 'list'] as const,
      detail: (id: string) => [...queryKeys.admin.campaigns.all, 'detail', id] as const,
    },
    analytics: {
      all: ['admin', 'analytics'] as const,
      overview: () => [...queryKeys.admin.analytics.all, 'overview'] as const,
      report: (type: string, filters: any) => [...queryKeys.admin.analytics.all, 'report', type, filters] as const,
    },
  },
} as const;
```

---

## 3. API Integration Layer

### 3.1 API Client Setup

**File**: `src/lib/api/client.ts`

```typescript
import axios, { AxiosError, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/authStore';

// Create axios instance
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracking
    config.headers['X-Request-ID'] = crypto.randomUUID();

    // Log request in dev
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in dev
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && originalRequest) {
      // Try to refresh token
      try {
        const newToken = await refreshAuthToken();

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      // Redirect to unauthorized page
      window.location.href = '/unauthorized';
    }

    // Handle 500 Server Error
    if (error.response?.status === 500) {
      // Show error toast
      toast.error('An unexpected error occurred. Please try again.');
    }

    // Log error in dev
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Error]', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    return Promise.reject(error);
  }
);

// Helper functions
function getAuthToken(): string | null {
  // Get token from cookie or localStorage
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('auth_token='))
    ?.split('=')[1] || null;
}

async function refreshAuthToken(): Promise<string> {
  const response = await apiClient.post('/auth/refresh');
  return response.data.token;
}
```

### 3.2 API Endpoints

**File**: `src/lib/api/endpoints/content.ts`

```typescript
import { apiClient } from '../client';
import type { ContentItem, ContentFilters, CreateContentRequest } from '@/types';

export const contentApi = {
  // Get content list
  getList: async (filters: ContentFilters = {}): Promise<ContentItem[]> => {
    const { data } = await apiClient.get('/content', { params: filters });
    return data.items;
  },

  // Get content by ID
  getById: async (id: string): Promise<ContentItem> => {
    const { data } = await apiClient.get(`/content/${id}`);
    return data;
  },

  // Get featured content
  getFeatured: async (): Promise<ContentItem[]> => {
    const { data } = await apiClient.get('/content/featured');
    return data.items;
  },

  // Search content
  search: async (query: string, filters?: ContentFilters): Promise<ContentItem[]> => {
    const { data } = await apiClient.get('/content/search', {
      params: { q: query, ...filters },
    });
    return data.items;
  },

  // Create content (admin)
  create: async (payload: CreateContentRequest): Promise<ContentItem> => {
    const { data } = await apiClient.post('/content', payload);
    return data;
  },

  // Update content (admin)
  update: async (id: string, payload: Partial<ContentItem>): Promise<ContentItem> => {
    const { data } = await apiClient.patch(`/content/${id}`, payload);
    return data;
  },

  // Delete content (admin)
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/content/${id}`);
  },

  // Toggle favorite
  toggleFavorite: async (id: string): Promise<void> => {
    await apiClient.post(`/content/${id}/favorite`);
  },
};
```

**File**: `src/lib/api/endpoints/share.ts`

```typescript
import { apiClient } from '../client';
import type { ShareEvent, CreateShareRequest, TrackingLink } from '@/types';

export const shareApi = {
  // Create share event
  create: async (payload: CreateShareRequest): Promise<ShareEvent> => {
    const { data } = await apiClient.post('/share', payload);
    return data;
  },

  // Get share history
  getHistory: async (filters?: HistoryFilters): Promise<ShareEvent[]> => {
    const { data } = await apiClient.get('/share/history', { params: filters });
    return data.items;
  },

  // Get share detail
  getById: async (id: string): Promise<ShareEvent> => {
    const { data } = await apiClient.get(`/share/${id}`);
    return data;
  },

  // Generate tracking link
  generateTrackingLink: async (payload: {
    contentId: string;
    channel: string;
  }): Promise<TrackingLink> => {
    const { data } = await apiClient.post('/share/tracking-link', payload);
    return data;
  },

  // Resend share
  resend: async (shareEventId: string): Promise<ShareEvent> => {
    const { data } = await apiClient.post(`/share/${shareEventId}/resend`);
    return data;
  },
};
```

### 3.3 Custom Query Hooks

**File**: `src/hooks/useContent.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/endpoints/content';
import { queryKeys } from '@/lib/query-keys';
import type { ContentFilters } from '@/types';

// Get content list
export function useContentList(filters: ContentFilters = {}) {
  return useQuery({
    queryKey: queryKeys.content.list(filters),
    queryFn: () => contentApi.getList(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get content detail
export function useContentDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.content.detail(id),
    queryFn: () => contentApi.getById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get featured content
export function useFeaturedContent() {
  return useQuery({
    queryKey: queryKeys.content.featured(),
    queryFn: () => contentApi.getFeatured(),
    staleTime: 10 * 60 * 1000,
  });
}

// Search content
export function useContentSearch(query: string, filters?: ContentFilters) {
  return useQuery({
    queryKey: queryKeys.content.search(query),
    queryFn: () => contentApi.search(query, filters),
    enabled: query.length >= 3,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Toggle favorite
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contentId: string) => contentApi.toggleFavorite(contentId),
    onMutate: async (contentId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.content.all });

      const previousContent = queryClient.getQueryData(
        queryKeys.content.detail(contentId)
      );

      queryClient.setQueryData(
        queryKeys.content.detail(contentId),
        (old: any) => ({ ...old, isFavorite: !old?.isFavorite })
      );

      return { previousContent };
    },
    onError: (err, contentId, context) => {
      // Rollback on error
      if (context?.previousContent) {
        queryClient.setQueryData(
          queryKeys.content.detail(contentId),
          context.previousContent
        );
      }
    },
    onSettled: (data, error, contentId) => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({
        queryKey: queryKeys.content.detail(contentId)
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.content.lists()
      });
    },
  });
}
```

**File**: `src/hooks/useShare.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shareApi } from '@/lib/api/endpoints/share';
import { queryKeys } from '@/lib/query-keys';
import { toast } from 'react-hot-toast';
import type { CreateShareRequest } from '@/types';

export function useCreateShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateShareRequest) => shareApi.create(payload),
    onSuccess: (data) => {
      // Invalidate share history
      queryClient.invalidateQueries({
        queryKey: queryKeys.share.history()
      });

      // Invalidate engagement data
      queryClient.invalidateQueries({
        queryKey: queryKeys.engagement.all
      });

      // Invalidate activity feed
      queryClient.invalidateQueries({
        queryKey: queryKeys.activity.all
      });

      // Update content share count (optimistic)
      queryClient.setQueryData(
        queryKeys.content.detail(data.contentId),
        (old: any) => ({
          ...old,
          shareCount: (old?.shareCount || 0) + 1,
        })
      );

      toast.success('Content shared successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to share content');
    },
  });
}

export function useShareHistory(filters?: HistoryFilters) {
  return useQuery({
    queryKey: queryKeys.share.historyList(filters || {}),
    queryFn: () => shareApi.getHistory(filters),
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

export function useGenerateTrackingLink() {
  return useMutation({
    mutationFn: shareApi.generateTrackingLink,
  });
}
```

---

## 4. Caching Strategy

### 4.1 Cache Configuration by Data Type

| Data Type | Stale Time | GC Time | Refetch Strategy | Notes |
|-----------|------------|---------|------------------|-------|
| Content Library | 5 min | 10 min | Window focus | Static content, updates infrequent |
| Content Detail | 10 min | 15 min | Window focus | Individual content rarely changes |
| Contacts | 2 min | 5 min | Window focus | User-managed data, may change often |
| Engagement Metrics | 1 min | 3 min | Interval (30s) | Real-time data, frequent updates |
| Activity Feed | 30 sec | 2 min | Interval (30s) | Real-time notifications |
| Share History | 3 min | 10 min | Window focus | Historical data, append-only |
| User Profile | 15 min | 30 min | Manual | Rarely changes |
| Admin Settings | 30 min | 1 hour | Manual | System config, rarely changes |
| Featured Content | 10 min | 15 min | Window focus | Curated list, infrequent updates |
| Search Results | 2 min | 5 min | None | Query-specific, may be stale |

### 4.2 Prefetching Strategy

**File**: `src/hooks/usePrefetch.ts`

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/endpoints/content';
import { queryKeys } from '@/lib/query-keys';

export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchContentDetail = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.content.detail(id),
      queryFn: () => contentApi.getById(id),
      staleTime: 10 * 60 * 1000,
    });
  };

  const prefetchContactDetail = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.contacts.detail(id),
      queryFn: () => contactApi.getById(id),
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    prefetchContentDetail,
    prefetchContactDetail,
  };
}
```

**Usage in ContentCard**:
```tsx
function ContentCard({ content }: { content: ContentItem }) {
  const { prefetchContentDetail } = usePrefetch();

  return (
    <div
      onMouseEnter={() => prefetchContentDetail(content.id)}
      onClick={() => navigate(`/content/${content.id}`)}
    >
      {/* Card content */}
    </div>
  );
}
```

### 4.3 Cache Invalidation Strategy

```typescript
// On share creation
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.share.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.engagement.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.activity.all });
}

// On contact creation/update
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
}

// On logout
onSuccess: () => {
  queryClient.clear(); // Clear all cache
}

// On role change
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.content.all });
}
```

### 4.4 Optimistic Updates

```typescript
// Example: Toggle favorite
onMutate: async (contentId) => {
  // Cancel outgoing queries
  await queryClient.cancelQueries({
    queryKey: queryKeys.content.detail(contentId)
  });

  // Snapshot previous value
  const previousContent = queryClient.getQueryData(
    queryKeys.content.detail(contentId)
  );

  // Optimistically update
  queryClient.setQueryData(
    queryKeys.content.detail(contentId),
    (old: any) => ({ ...old, isFavorite: !old?.isFavorite })
  );

  return { previousContent };
},

onError: (err, contentId, context) => {
  // Rollback on error
  if (context?.previousContent) {
    queryClient.setQueryData(
      queryKeys.content.detail(contentId),
      context.previousContent
    );
  }
},

onSettled: (data, error, contentId) => {
  // Always refetch to ensure sync
  queryClient.invalidateQueries({
    queryKey: queryKeys.content.detail(contentId)
  });
},
```

---

## 5. Real-time Updates

### 5.1 Polling Strategy

**File**: `src/hooks/useEngagement.ts`

```typescript
export function useEngagementDashboard() {
  return useQuery({
    queryKey: queryKeys.engagement.dashboard(),
    queryFn: () => engagementApi.getDashboard(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Poll every 30 seconds
    refetchIntervalInBackground: false, // Stop polling when tab is not visible
  });
}

export function useActivityFeed(filters?: ActivityFilters) {
  return useQuery({
    queryKey: queryKeys.activity.feed(filters || {}),
    queryFn: () => activityApi.getFeed(filters),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
  });
}
```

### 5.2 WebSocket Integration (Future)

**File**: `src/lib/websocket.ts`

```typescript
import { queryClient } from './query-client';
import { queryKeys } from './query-keys';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[WebSocket] Connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
    };

    this.ws.onclose = () => {
      console.log('[WebSocket] Disconnected');
      this.reconnect();
    };
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case 'ENGAGEMENT_EVENT':
        // Invalidate engagement queries
        queryClient.invalidateQueries({
          queryKey: queryKeys.engagement.all
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.activity.all
        });
        break;

      case 'NEW_CONTENT':
        // Invalidate content lists
        queryClient.invalidateQueries({
          queryKey: queryKeys.content.lists()
        });
        break;

      case 'NOTIFICATION':
        // Add notification to store
        useNotificationStore.getState().addNotification(message.data);
        break;

      default:
        console.warn('[WebSocket] Unknown message type:', message.type);
    }
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);

    setTimeout(() => {
      console.log(`[WebSocket] Reconnecting... (attempt ${this.reconnectAttempts})`);
      this.connect();
    }, delay);
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export const wsService = new WebSocketService();
```

### 5.3 Server-Sent Events (Alternative)

**File**: `src/hooks/useSSE.ts`

```typescript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

export function useSSE() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.addEventListener('engagement', (event) => {
      const data = JSON.parse(event.data);

      // Invalidate engagement data
      queryClient.invalidateQueries({
        queryKey: queryKeys.engagement.all
      });

      // Show notification
      toast.success(`${data.contactName} ${data.action} your content!`);
    });

    eventSource.addEventListener('content-update', () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.content.lists()
      });
    });

    eventSource.onerror = () => {
      console.error('[SSE] Connection error');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);
}
```

---

## Summary

This routing and state management architecture provides:

1. **Centralized Routing**:
   - Type-safe route constants
   - Route guards and middleware
   - Navigation hooks
   - Breadcrumb generation
   - Query parameter management

2. **Efficient State Management**:
   - Zustand for global UI state
   - TanStack Query for server state
   - Optimistic updates
   - Automatic cache invalidation
   - Prefetching strategies

3. **Robust API Integration**:
   - Axios client with interceptors
   - Token refresh mechanism
   - Error handling
   - Request/response logging
   - Type-safe endpoints

4. **Smart Caching**:
   - Data-specific cache configurations
   - Automatic background refetching
   - Manual invalidation strategies
   - Memory-efficient garbage collection

5. **Real-time Capabilities**:
   - Polling for engagement data
   - WebSocket support (future)
   - Server-Sent Events (alternative)
   - Automatic query invalidation

The architecture is designed to scale with the application while maintaining performance and developer experience.

---

**Document Version**: 1.0
**Last Updated**: 2026-04-04
**Author**: Lead Frontend Developer
