# Deployment Checklist - Glorious Restoration Embassy

## Status Summary
- ✅ **Build**: Production build passes successfully
- ✅ **ESLint**: All focused files pass with no errors  
- ✅ **Tests**: `tests/news-dashboard.spec.ts` passes (3/3 tests)
- ✅ **TypeScript**: Compilation successful
- ⏳ **Supabase Migration**: CMS migration needs to be applied
- ⏳ **Environment Variables**: Need to be configured for deployment

---

## 🔥 Critical Deployment Steps

### 1. Apply Supabase CMS Migration
**Priority: CRITICAL - Blocking CMS functionality**

The Supabase CMS migration has NOT been applied yet. Build logs show:
```
[cms] Could not read published gallery images from Supabase. {
  code: 'PGRST205',
  details: null,
  hint: null,
  message: "Could not find the table 'public.site_content' in the schema cache"
}
```

**Action required:**
1. Open your Supabase project at https://app.supabase.com
2. Go to **SQL Editor** 
3. Open `supabase/migrations/20261006180000_supabase_editorial_cms.sql` in this repository
4. Copy and paste the entire SQL content into the SQL editor
5. Execute the migration

This will create:
- `public.cms_admins` table for CMS user management
- `public.site_content` table for all CMS content (sermons, events, gallery, etc.)
- `public.is_cms_admin()` function for permission checking
- Storage bucket `cms-media` for image uploads
- Row-level security policies for all CMS operations

### 2. Set Up CMS User Access
**Priority: CRITICAL - Blocking CMS access**

After applying the migration:

1. **First-time setup**: 
   - Go to `/login?next=%2Fcms` on your deployed site
   - Enter the email address for your CMS administrator
   - Complete the magic-link sign-in process
   
2. **Grant admin privileges**:
   - In Supabase SQL Editor, run:
   ```sql
   insert into public.cms_admins (user_id)
   values ('<AUTH_USER_UUID>')
   on conflict (user_id) do nothing;
   ```
   - Replace `<AUTH_USER_UUID>` with the actual UUID from Supabase Auth
   - Find the UUID in: Authentication → Users → select your user → copy the ID

3. **Verify access**:
   - Refresh `/cms` page
   - You should now see the CMS workspace instead of access denied messages

### 3. Configure Environment Variables
**Priority: CRITICAL - Required for all functionality**

#### Required Variables
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key

# AI Backend (for website chat)
FASTAPI_BACKEND_URL=https://your-fastapi-service-url
CHAT_BACKEND_SHARED_SECRET=<same-long-random-secret-configured-in-Koyeb-and-Cloudflare>

# Admin Dashboard
ADMIN_PASSWORD=your-secure-admin-password
ADMIN_SESSION_SECRET=your-random-secret-for-admin-sessions

# News API (optional for development)
NEWS_API_KEY=your-newsapi-key
```

`CHAT_BACKEND_SHARED_SECRET` must be the same long, random value in Vercel,
Koyeb, and Cloudflare Worker secrets. FastAPI rejects chat requests when the
secret is missing or incorrect.

#### Optional Variables
```bash
# Enable NewsAPI in production (only after confirming paid plan)
NEWS_API_PRODUCTION_ENABLED=true

# Enable thumbnails (only after confirming image reuse rights)
NEWS_THUMBNAILS_LICENSE_CONFIRMED=true

# Customize donation number
MPESA_NUMBER=your-donation-number
```

### 4. Configure Supabase Auth Redirect URLs
**Priority: HIGH - Required for login to work**

1. Go to Supabase Dashboard → Authentication → Settings
2. Add these redirect URLs:
   - `http://localhost:3000/auth/callback` (for local development)
   - `https://your-production-domain.com/auth/callback` (for production)

### 5. Apply AI Chat Admission Migration
**Priority: HIGH - Required for AI chat functionality**

If not already applied:
1. In Supabase SQL Editor
2. Run the migration at `supabase/migrations/20261006172000_admitted_ai_chat_attempts.sql`

This creates the daily chat quota system that limits each user to 10 AI requests per day.

---

## 📋 Pre-Deployment Verification

### Local Testing Checklist
- [ ] Run `npm run build` - should complete without errors
- [ ] Run `npm exec eslint` - should pass with no errors  
- [ ] Run `npx playwright test` - all tests should pass
- [ ] Test `/api/news` endpoint locally - should return news data with Exploration category
- [ ] Test `/login` flow - magic link sign-in should work
- [ ] Verify CMS content loading falls back gracefully when tables don't exist

### Supabase Verification
- [ ] CMS migration applied successfully
- [ ] `public.site_content` table exists
- [ ] `public.cms_admins` table exists
- [ ] `cms-media` storage bucket exists and is public
- [ ] Row-level security policies are in place
- [ ] At least one user has CMS admin privileges

---

## 🚀 Deployment Process

### Vercel Deployment
1. Push repository to GitHub if not already done
2. Log in to Vercel: `npx vercel login`
3. Link project: `npx vercel link` (select your Vercel project)
4. Add all required environment variables in Vercel dashboard
5. Deploy: `npx vercel deploy --prod`

### Alternative: Manual Deployment
1. Push to GitHub
2. Create new Vercel project
3. Import repository
4. Configure environment variables
5. Deploy

---

## ✅ Post-Deployment Verification

### Immediate Checks
- [ ] Homepage loads correctly
- [ ] Navigation works (all links functional)
- [ ] Static pages render properly
- [ ] AI chat works for signed-in users
- [ ] Contact form submission works
- [ ] Newsletter signup works

### CMS Functionality Tests
- [ ] `/cms` redirects to login when not authenticated
- [ ] Magic link sign-in works
- [ ] CMS workspace loads for authorized users
- [ ] Content creation/editing works
- [ ] Publish/unpublish functionality works
- [ ] Image upload to gallery works
- [ ] Published content appears on public pages

### News Dashboard Tests
- [ ] `/news` page loads with daily scripture
- [ ] News articles appear from multiple sources
- [ ] Category filters work (including "🏛️ History & Exploration")
- [ ] World History Encyclopedia articles show under Exploration
- [ ] Biblical Archaeology Review articles show under Exploration
- [ ] AllAfrica and Christian Daily articles show under appropriate categories

---

## 🔧 Troubleshooting

### Common Issues

#### "Could not find the table 'public.site_content'"
**Solution**: Apply the CMS migration as described in Step 1 above.

#### CMS access denied even after adding user to cms_admins
**Solution**: 
1. Ensure you're signed in with the correct email
2. Verify the UUID in `cms_admins` matches the authenticated user
3. Check browser cookies/session
4. Try signing out and back in

#### News API not working in production
**Solution**: 
1. Ensure `NEWS_API_PRODUCTION_ENABLED=true` is set
2. Confirm you have a paid NewsAPI plan
3. Verify `NEWS_API_KEY` is set as server-only variable

#### Images not showing in news articles
**Solution**: Set `NEWS_THUMBNAILS_LICENSE_CONFIRMED=true` only after confirming image reuse rights for all enabled sources.

---

## 📞 Support Contacts

For deployment assistance:
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/docs/guides/troubleshooting

---

## 🎯 Current Implementation Status

### Completed Features
- ✅ Supabase CMS backend implementation
- ✅ CMS workspace UI component
- ✅ Content management for sermons, events, announcements, gallery
- ✅ Public content reading via publishable key
- ✅ Dynamic rendering for CMS-backed pages
- ✅ News dashboard with Exploration category
- ✅ World History Encyclopedia feed integration
- ✅ Biblical Archaeology Review feed integration
- ✅ Category filtering with emoji support
- ✅ RSS-to-JSON conversion for all feeds
- ✅ Retirement of old Decap CMS routes

### Pending for Production
- ⏳ Supabase CMS migration application
- ⏳ CMS user access configuration
- ⏳ Environment variable setup
- ⏳ Supabase Auth redirect URL configuration
- ⏳ Final deployment to Vercel

---

*This checklist was generated based on the handoff report from the previous development session.*