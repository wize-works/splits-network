# Identity Service

The identity service manages users, organizations, and memberships. It synchronizes user data from Clerk and maintains the internal identity model.

## Responsibilities

- Synchronize Clerk users into internal user records
- Maintain organizations and memberships
- Provide user profile and membership information

## API Endpoints

### `GET /users/:id`
Get user profile by ID including memberships.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "memberships": [
      {
        "id": "uuid",
        "organization_id": "uuid",
        "organization_name": "Company Name",
        "role": "company_admin"
      }
    ]
  }
}
```

### `POST /sync-clerk-user`
Internal endpoint to sync Clerk user data.

**Request:**
```json
{
  "clerk_user_id": "user_xxx",
  "email": "user@example.com",
  "name": "John Doe"
}
```

### `POST /organizations`
Create a new organization.

**Request:**
```json
{
  "name": "Company Name",
  "type": "company"
}
```

### `POST /memberships`
Add a user to an organization with a role.

**Request:**
```json
{
  "user_id": "uuid",
  "organization_id": "uuid",
  "role": "company_admin"
}
```

### `DELETE /memberships/:id`
Remove a membership.

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build
pnpm build

# Start production
pnpm start
```

## Environment Variables

See `.env.example` for required environment variables.
