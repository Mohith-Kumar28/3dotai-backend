# TikTok Shop Authorization Integration

This module provides complete TikTok Shop OAuth 2.0 authorization flow integration, allowing users to connect their TikTok Shop accounts and manage access tokens automatically.

## Features

- **OAuth 2.0 Authorization Flow**: Complete implementation of TikTok Shop's authorization process
- **Automatic Token Refresh**: Tokens are automatically refreshed when needed during API calls
- **One Shop Per User**: Each user can connect to only one TikTok Shop (as per requirements)
- **Secure State Management**: CSRF protection using cryptographically secure state parameters
- **Comprehensive Error Handling**: Proper validation and error responses
- **Database Integration**: Persistent storage of authorization credentials

## API Endpoints

### `POST /api/v1/tiktok/auth/initiate`
Initiates the TikTok Shop authorization flow.

**Request Body:**
```json
{
  "state": "optional-custom-state",
  "scope": "optional-scopes"
}
```

**Response:**
```json
{
  "authUrl": "https://services.tiktokshop.com/open/authorize?...",
  "state": "generated-state-parameter"
}
```

### `POST /api/v1/tiktok/auth/callback`
Handles the OAuth callback and exchanges the authorization code for tokens.

**Request Body:**
```json
{
  "code": "authorization-code-from-tiktok",
  "state": "state-parameter",
  "shop_id": "optional-shop-id",
  "shop_region": "optional-region"
}
```

**Response:**
```json
{
  "shopId": "shop_123456",
  "shopName": "My TikTok Shop",
  "region": "US",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### `GET /api/v1/tiktok/shop/info`
Retrieves information about the user's connected TikTok Shop.

**Response:**
```json
{
  "shopId": "shop_123456",
  "shopName": "My TikTok Shop",
  "region": "US",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### `DELETE /api/v1/tiktok/shop/disconnect`
Disconnects the user's TikTok Shop.

**Response:**
```json
{
  "message": "TikTok Shop disconnected successfully",
  "statusCode": 200
}
```

### `POST /api/v1/tiktok/auth/refresh`
Manually refreshes the access token.

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

### `GET /api/v1/tiktok/auth/status`
Checks the user's TikTok Shop connection status.

**Response:**
```json
{
  "isConnected": true,
  "shopId": "shop_123456",
  "shopName": "My TikTok Shop"
}
```

## Environment Variables

Add these variables to your `.env` file:

```env
# TikTok Shop API
TIKTOK_CLIENT_ID=your_tiktok_client_id
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_REDIRECT_URI=http://localhost:8000/api/v1/tiktok/auth/callback
TIKTOK_BASE_URL=https://open-api.tiktokglobalshop.com
TIKTOK_AUTH_URL=https://services.tiktokshop.com/open/authorize
TIKTOK_TOKEN_URL=https://auth.tiktok-shops.com/api/v2/token/get
TIKTOK_API_VERSION=v2
```

## Database Schema

The integration adds a `TikTokShopAuth` model to store authorization data:

```prisma
model TikTokShopAuth {
  id                    String    @id @default(uuid())
  userId                String    @unique
  shopId                String    @unique
  shopName              String?
  accessToken           String
  refreshToken          String
  accessTokenExpiresAt  DateTime
  refreshTokenExpiresAt DateTime
  scope                 String?
  region                String?
  isActive              Boolean   @default(true)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  deletedAt             DateTime? @db.Timestamptz(6)
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("tiktok_shop_auth")
}
```

## Usage Example

### Frontend Integration

```typescript
// 1. Initiate authorization
const response = await fetch('/api/v1/tiktok/auth/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});
const { authUrl, state } = await response.json();

// 2. Redirect user to TikTok authorization
window.location.href = authUrl;

// 3. Handle callback (TikTok will redirect to your callback URL)
// Your callback handler should extract the 'code' and 'state' from URL params
// and send them to the callback endpoint

const callbackResponse = await fetch('/api/v1/tiktok/auth/callback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: urlParams.get('code'),
    state: urlParams.get('state')
  })
});
const shopInfo = await callbackResponse.json();
```

### Using TikTok Service in Other Services

```typescript
@Injectable()
export class MyService {
  constructor(private readonly tiktokService: TikTokService) {}

  async makeApiCall(userId: string) {
    // Get valid access token (automatically refreshes if needed)
    const accessToken = await this.tiktokService.getValidAccessToken(userId);
    
    // Use the token for TikTok Shop API calls
    const response = await axios.get('https://open-api.tiktokglobalshop.com/api/products/search', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  }
}
```

## Security Features

- **State Parameter Validation**: Prevents CSRF attacks using cryptographically secure state parameters
- **Token Expiration Handling**: Automatic token refresh before expiration
- **Unique Shop Constraint**: Prevents multiple users from connecting to the same shop
- **Secure Token Storage**: Encrypted storage of sensitive credentials
- **Request Validation**: Comprehensive input validation using class-validator

## Error Handling

The service provides detailed error messages for common scenarios:

- `BadRequestException`: Invalid authorization code, expired tokens, etc.
- `UnauthorizedException`: Invalid state parameter or authentication failure
- `NotFoundException`: No TikTok Shop connection found
- `ConflictException`: Shop already connected to another user

## Architecture

The module follows the established patterns in the codebase:

- **Controller**: Handles HTTP requests and responses
- **Service**: Contains business logic and TikTok API interactions
- **Repository**: Database operations abstraction
- **DTOs**: Request/response validation and documentation
- **Types**: TypeScript interfaces for TikTok API responses

## Testing

The implementation includes comprehensive error handling and validation. For testing:

1. Set up TikTok Shop Partner account and get API credentials
2. Configure environment variables
3. Run database migrations
4. Test the authorization flow end-to-end

## Notes

- Token refresh happens automatically during API calls (no background cron jobs)
- Each user can only connect to one TikTok Shop
- All sensitive data is stored securely in the database
- The implementation follows TikTok Shop's latest API guidelines
