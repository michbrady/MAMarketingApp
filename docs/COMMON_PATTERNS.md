# Common Development Patterns

This document contains reusable patterns and code snippets for common tasks.

---

## API Client Patterns

### Backend to Frontend Mapping Function

Use this pattern when creating new API endpoints:

```typescript
/**
 * Map backend entity to frontend format
 * Handles both PascalCase (database) and camelCase (service layer)
 */
function mapEntityToFrontend(backendEntity: any): FrontendEntity {
  return {
    // IDs - always convert to string
    id: (backendEntity.EntityID || backendEntity.entityId || backendEntity.id)?.toString(),

    // String fields - check both cases with fallback
    name: backendEntity.Name || backendEntity.name || '',

    // Nullable fields
    email: backendEntity.Email || backendEntity.email,

    // Field name transformations
    phone: backendEntity.Mobile || backendEntity.mobile,
    company: backendEntity.CompanyName || backendEntity.companyName,

    // Enums - cast as any or use proper type
    status: (backendEntity.Status || backendEntity.status) as EntityStatus,

    // Arrays from comma-separated strings
    tags: backendEntity.Tags || backendEntity.tags
      ? (backendEntity.Tags || backendEntity.tags).split(',').filter(Boolean)
      : [],

    // Dates - convert to ISO strings
    createdAt: backendEntity.CreatedDate || backendEntity.createdDate || backendEntity.createdAt,
    updatedAt: backendEntity.UpdatedDate || backendEntity.updatedDate || backendEntity.updatedAt,
  };
}
```

### Frontend to Backend Mapping

```typescript
/**
 * Create/Update request data transformation
 */
function mapToBackendRequest(frontendData: FrontendFormData): BackendRequest {
  return {
    // Direct mappings
    firstName: frontendData.firstName,
    lastName: frontendData.lastName,
    email: frontendData.email,

    // Field name transformations
    mobile: frontendData.phone,
    companyName: frontendData.company,
    jobTitle: frontendData.position,

    // Arrays to comma-separated
    tags: frontendData.tags,  // Backend service will handle join

    // Boolean defaults
    emailOptIn: frontendData.emailOptIn ?? true,
    smsOptIn: frontendData.smsOptIn ?? true,

    // Enum with default
    status: frontendData.status || 'Active',
  };
}
```

### API Method with Full Error Handling

```typescript
export const entityApi = {
  getEntity: async (id: string): Promise<ApiResponse<Entity>> => {
    console.log('Getting entity with ID:', id);
    try {
      const response = await apiClient.get<ApiResponse<any>>(`/entities/${id}`);
      console.log('Entity response:', response.data);

      if (response.data.data) {
        response.data.data = mapEntityToFrontend(response.data.data);
      }

      return response.data as ApiResponse<Entity>;
    } catch (error: any) {
      console.error('Error getting entity:', {
        error,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: `/entities/${id}`
      });
      throw error;
    }
  },

  createEntity: async (data: EntityFormData): Promise<ApiResponse<Entity>> => {
    try {
      const backendData = mapToBackendRequest(data);
      const response = await apiClient.post<ApiResponse<any>>('/entities', backendData);

      if (response.data.data) {
        response.data.data = mapEntityToFrontend(response.data.data);
      }

      return response.data as ApiResponse<Entity>;
    } catch (error: any) {
      console.error('Create entity error:', error.response?.data);
      throw error;
    }
  },

  updateEntity: async (id: string, data: Partial<EntityFormData>): Promise<ApiResponse<Entity>> => {
    const backendData: any = {};

    // Only include fields that were actually changed
    if (data.name !== undefined) backendData.name = data.name;
    if (data.phone !== undefined) backendData.mobile = data.phone;
    if (data.company !== undefined) backendData.companyName = data.company;
    // ... map other fields

    const response = await apiClient.put<ApiResponse<any>>(`/entities/${id}`, backendData);

    if (response.data.data) {
      response.data.data = mapEntityToFrontend(response.data.data);
    }

    return response.data as ApiResponse<Entity>;
  },
};
```

---

## Backend Controller Patterns

### Standard CRUD Controller

```typescript
export class EntityController {
  /**
   * GET /api/v1/entities/:id - Get single entity
   */
  async getEntity(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const entityId = parseInt(req.params.id as string);

      const entity = await entityService.getEntity(entityId, userId);

      if (!entity) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Entity not found'
        });
        return;
      }

      res.json({
        success: true,
        data: entity
      });

    } catch (error: any) {
      logger.error('Get entity error:', error);
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        entityId: req.params.id,
        userId: (req as any).user?.userId
      });

      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message || 'Failed to retrieve entity',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * POST /api/v1/entities - Create new entity
   */
  async createEntity(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const entityData: CreateEntityRequest = req.body;

      // Validate required fields
      if (!entityData.name) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Name is required'
        });
        return;
      }

      const entity = await entityService.createEntity(entityData, userId);

      res.status(201).json({
        success: true,
        data: entity,
        message: 'Entity created successfully'
      });

    } catch (error: any) {
      logger.error('Create entity error:', error);
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: error.message || 'Failed to create entity'
      });
    }
  }

  /**
   * PUT /api/v1/entities/:id - Update entity
   */
  async updateEntity(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const entityId = parseInt(req.params.id as string);
      const updates: UpdateEntityRequest = req.body;

      const entity = await entityService.updateEntity(entityId, updates, userId);

      res.json({
        success: true,
        data: entity,
        message: 'Entity updated successfully'
      });

    } catch (error: any) {
      logger.error('Update entity error:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: statusCode === 404 ? 'Not Found' : 'Internal Server Error',
        message: error.message || 'Failed to update entity'
      });
    }
  }

  /**
   * DELETE /api/v1/entities/:id - Delete entity
   */
  async deleteEntity(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const entityId = parseInt(req.params.id as string);

      const success = await entityService.deleteEntity(entityId, userId);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Entity not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Entity deleted successfully'
      });

    } catch (error: any) {
      logger.error('Delete entity error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: error.message || 'Failed to delete entity'
      });
    }
  }
}
```

---

## React Query Patterns

### List Page with CRUD Operations

```typescript
export default function EntitiesPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [filters, setFilters] = useState<EntityFilters>({});

  // Fetch entities list
  const { data: entitiesData, isLoading } = useQuery({
    queryKey: ['entities', filters],
    queryFn: () => entityApi.getEntities(filters),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: EntityFormData) => entityApi.createEntity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      toast.success('Entity created successfully');
      setShowAddForm(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create entity');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EntityFormData> }) =>
      entityApi.updateEntity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      toast.success('Entity updated successfully');
      setEditingEntity(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update entity');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => entityApi.deleteEntity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      toast.success('Entity deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete entity');
    },
  });

  const entities = entitiesData?.data || [];

  return (
    <div>
      {/* Your UI here */}
    </div>
  );
}
```

### Detail Page Pattern

```typescript
export default function EntityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const entityId = params.id as string;

  // Fetch entity
  const { data: entityData, isLoading } = useQuery({
    queryKey: ['entity', entityId],
    queryFn: () => entityApi.getEntity(entityId),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<EntityFormData>) =>
      entityApi.updateEntity(entityId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity', entityId] });
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      toast.success('Entity updated successfully');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => entityApi.deleteEntity(entityId),
    onSuccess: () => {
      toast.success('Entity deleted successfully');
      router.push('/entities');
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const entity = entityData?.data;

  if (!entity) {
    return <NotFoundMessage />;
  }

  return (
    <div>
      {/* Your UI here */}
    </div>
  );
}
```

---

## Component Patterns

### Status Badge with Fallback

```typescript
const statusConfig: Record<Status, { label: string; bg: string; text: string; border: string }> = {
  Active: {
    label: "Active",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  // ... other statuses
};

export default function StatusBadge({ status }: { status: Status }) {
  // Always provide fallback to prevent crashes
  const config = statusConfig[status] || {
    label: status || "Unknown",
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
  };

  return (
    <span className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} px-2 py-1 text-sm`}>
      {config.label}
    </span>
  );
}
```

---

## Database Patterns

### SQL Query with Field Mapping

```sql
-- Always alias PascalCase columns to camelCase
SELECT
  EntityID AS entityId,
  Name AS name,
  Email AS email,
  Mobile AS mobile,
  CompanyName AS companyName,
  Status AS status,
  CreatedDate AS createdDate,
  UpdatedDate AS updatedDate
FROM dbo.Entity
WHERE OwnerUserID = @userId
```

### Parameterized Query Pattern

```typescript
// Backend service
async getEntity(entityId: number, userId: number): Promise<Entity | null> {
  try {
    const result = await query<Entity>(`
      SELECT
        EntityID AS entityId,
        Name AS name,
        Email AS email,
        Status AS status,
        CreatedDate AS createdDate
      FROM dbo.Entity
      WHERE EntityID = @entityId AND OwnerUserID = @userId
    `, { entityId, userId });

    return result[0] || null;
  } catch (error) {
    logger.error('Get entity error:', error);
    throw error;
  }
}
```

---

## TypeScript Type Patterns

### API Response Types

```typescript
// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string;
}

// List response with pagination
export interface ListResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Form data type (what user enters)
export interface EntityFormData {
  name: string;
  email?: string;
  phone?: string;      // Frontend field name
  company?: string;    // Frontend field name
  status: EntityStatus;
}

// Backend request type (what API expects)
export interface CreateEntityRequest {
  name: string;
  email?: string | null;
  mobile?: string | null;     // Backend field name
  companyName?: string | null; // Backend field name
  status?: EntityStatus;
}

// Frontend display type (what UI consumes)
export interface Entity {
  id: string;          // Always string for URLs
  name: string;
  email?: string;
  phone?: string;      // Mapped from mobile
  company?: string;    // Mapped from companyName
  status: EntityStatus;
  createdAt: string;   // ISO date string
  updatedAt: string;
}
```

---

## Validation Patterns

### Zod Schema for Forms

```typescript
import { z } from 'zod';

const entityFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Pending']),
  tags: z.array(z.string()).optional(),
});

type EntityFormData = z.infer<typeof entityFormSchema>;
```

---

## Error Handling Patterns

### Standardized Error Response

```typescript
// Backend
try {
  // ... operation
} catch (error: any) {
  logger.error('Operation failed:', {
    error: error.message,
    stack: error.stack,
    context: { userId, entityId }
  });

  res.status(500).json({
    success: false,
    error: 'InternalServerError',
    message: error.message || 'Operation failed',
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
}
```

### Frontend Error Display

```typescript
// In mutation onError
onError: (error: any) => {
  const message = error.response?.data?.message
    || error.message
    || 'Operation failed';

  toast.error(message);

  // Log for debugging
  console.error('Operation failed:', {
    status: error.response?.status,
    data: error.response?.data,
    message: error.message
  });
}
```

---

**Last Updated:** 2026-04-07
**Maintained By:** Development Team
