# Onboarding Wizard Testing Guide

## Quick Start

1. **Start Required Services**:
   ```bash
   # From repo root
   pnpm --filter @splits-network/identity-service dev
   pnpm --filter @splits-network/portal dev
   ```

2. **Access Portal**: Open http://localhost:3000

## Test Scenarios

### ✅ Scenario 1: New User Signup
1. Click "Sign Up" (Clerk widget)
2. Complete email verification
3. **Expected**: Redirect to dashboard with onboarding modal immediately visible
4. Modal should be:
   - Non-dismissible (no close button)
   - Backdrop should not close on click
   - Centered on screen
   - Body scroll should be blocked

### ✅ Scenario 2: Recruiter Flow
1. Complete Step 1: Select "Recruiter" role
2. **Expected**: Auto-advance to Step 2
3. Complete Step 2: Click "Continue" (subscription placeholder)
4. **Expected**: Advance to Step 3 (Recruiter Profile form)
5. Fill in form:
   - Bio (required)
   - Phone (required, tel format)
   - Industries (optional, comma-separated)
   - Team Invite Code (optional, auto-uppercased)
6. Click "Continue"
7. **Expected**: Advance to Step 4 (Review)
8. Review displayed information
9. Click "Complete Onboarding"
10. **Expected**:
    - Success message
    - Modal closes after 2 seconds
    - Redirect to dashboard
    - Personal organization created
    - Membership with 'recruiter' role created

### ✅ Scenario 3: Company Admin Flow
1. Complete Step 1: Select "Company Admin" role
2. Complete Step 2: Click "Continue"
3. **Expected**: Advance to Step 3 (Company Info form)
4. Fill in form:
   - Company Name (required)
   - Website (required, URL format)
   - Industry (required, select from dropdown)
   - Company Size (required, select from dropdown)
5. Click "Continue"
6. **Expected**: Advance to Step 4 (Review)
7. Review displayed information
8. Click "Complete Onboarding"
9. **Expected**:
    - Success message
    - Modal closes after 2 seconds
    - Company organization created
    - Membership with 'company_admin' role created

### ✅ Scenario 4: Modal Persistence
1. Start onboarding, complete Step 1
2. Navigate to different authenticated page (e.g., /roles)
3. **Expected**: Modal persists with progress maintained
4. Navigate to /candidates
5. **Expected**: Modal still visible at same step
6. Complete onboarding
7. Navigate between pages
8. **Expected**: Modal does NOT reappear

### ✅ Scenario 5: Browser Refresh
1. Start onboarding, complete Step 2
2. Refresh browser (F5)
3. **Expected**: 
   - Modal reappears
   - Progress restored (should be on Step 2)
   - Form data persisted (if backend stores partial progress)

### ✅ Scenario 6: Back Button Navigation
1. Complete Step 1 (Role Selection)
2. At Step 2, click "Back"
3. **Expected**: Return to Step 1, can change role
4. Select different role
5. **Expected**: Navigate to Step 2, then correct Step 3 form

## Database Verification

After completing onboarding, check database:

```sql
-- Check user record
SELECT 
  id,
  email,
  onboarding_status,
  onboarding_step,
  onboarding_completed_at
FROM identity.users
WHERE email = 'test@example.com';
-- Expected: status='completed', step=4, completed_at=<timestamp>

-- Check organization created
SELECT 
  id,
  name,
  type
FROM identity.organizations
WHERE id = (SELECT organization_id FROM identity.memberships WHERE user_id = '<user-id>');
-- Expected: One row with appropriate name and type

-- Check membership
SELECT 
  user_id,
  organization_id,
  role,
  status
FROM identity.memberships
WHERE user_id = '<user-id>';
-- Expected: role='recruiter' or 'company_admin', status='active'
```

## API Testing

### Test Progress Update
```bash
curl -X PATCH http://localhost:3001/users/<user-id>/onboarding \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk-jwt>" \
  -d '{"step": 2, "status": "in_progress"}'
```

### Test Completion (Recruiter)
```bash
curl -X POST http://localhost:3001/users/<user-id>/complete-onboarding \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk-jwt>" \
  -d '{
    "role": "recruiter",
    "data": {
      "bio": "Experienced recruiter",
      "phone": "+1234567890",
      "industries": ["Tech", "Finance"],
      "teamInviteCode": "ALPHA123"
    }
  }'
```

### Test Completion (Company Admin)
```bash
curl -X POST http://localhost:3001/users/<user-id>/complete-onboarding \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk-jwt>" \
  -d '{
    "role": "company_admin",
    "data": {
      "name": "Acme Corp",
      "website": "https://acme.com",
      "industry": "technology",
      "size": "51-200"
    }
  }'
```

## Edge Cases to Test

### ❌ Validation Errors
1. Try submitting recruiter form without required fields
2. **Expected**: Form validation prevents submission
3. Try submitting company form with invalid URL
4. **Expected**: Browser validation shows error

### ❌ Network Errors
1. Disconnect network
2. Try completing onboarding
3. **Expected**: Error message displayed
4. Reconnect network
5. **Expected**: Can retry submission

### ❌ Concurrent Sessions
1. Open two browser tabs
2. Complete Step 1 in Tab A
3. Navigate to Step 2 in Tab B
4. **Expected**: Both tabs show Step 2 (backend is source of truth)

### ❌ Invalid Data
1. Try sending invalid step number via API (e.g., step=99)
2. **Expected**: 400 Bad Request
3. Try completing with invalid role
4. **Expected**: 400 Bad Request

## Known Limitations

- Subscription step (Step 2) is placeholder - no Stripe integration yet
- No "skip for now" option for optional fields
- No partial form data persistence (refresh loses unsaved Step 3 data)
- No analytics tracking yet

## Success Criteria

✅ Modal appears immediately after signup  
✅ Modal persists across all authenticated pages  
✅ Modal cannot be dismissed without completing  
✅ Both recruiter and company flows work end-to-end  
✅ Organization and membership created correctly  
✅ Modal disappears permanently after completion  
✅ Progress indicator updates correctly  
✅ Form validation works  
✅ Back button navigation works  
✅ API endpoints respond correctly  
✅ Database records updated properly  

## Troubleshooting

**Modal doesn't appear after signup**:
- Check browser console for errors
- Verify `/api/users/me` returns `onboarding_status: 'pending'`
- Check identity-service is running

**Modal reappears after completion**:
- Check database: `onboarding_status` should be 'completed'
- Check API response after submission
- Clear browser cache and retry

**Form submission fails**:
- Check network tab for API errors
- Verify Clerk token is valid
- Check identity-service logs

**Progress doesn't persist**:
- Verify PATCH endpoint is being called
- Check database updates after each step
- Verify Context state is updating

---

**Last Updated**: December 15, 2024  
**Version**: 1.0  
**Status**: Ready for Testing
