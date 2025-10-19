# Database Migrations

## Running Migrations

### Option 1: Manual via Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Navigate to your project
3. Click "SQL Editor" in the left sidebar
4. Copy the contents of the migration file
5. Paste and click "Run"

### Option 2: Via Supabase CLI
```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Or run a specific file
psql $DATABASE_URL < src/database/migrations/003_create_prompts_table.sql
```

## Migration Files

- `001_*` - Initial database setup
- `002_*` - Additional tables
- `003_create_prompts_table.sql` - **Prompt version control system** (NEW)

## Prompt Table Features

The `prompt_versions` table provides:

✅ **Version Control**: Full semantic versioning (MAJOR.MINOR.PATCH)
✅ **No Deletions**: Prompts are never deleted, only versioned
✅ **Git Integration**: Track git commits for each prompt change
✅ **Active Version Management**: Only ONE version can be active per prompt
✅ **Full History**: Complete audit trail of all changes
✅ **Helper Functions**:
  - `get_active_prompt(prompt_id)` - Get currently active version
  - `create_prompt_version(...)` - Create new version with auto-increment

## After Running Migration

1. Import existing prompts:
   ```typescript
   import { promptRepository } from './src/services/promptRepository';
   await promptRepository.importFromFile('/src/config/prompts.json');
   ```

2. Verify import:
   ```sql
   SELECT prompt_id, prompt_name, version_string, is_active
   FROM prompt_versions
   ORDER BY prompt_id, created_at DESC;
   ```

3. Check active prompts:
   ```sql
   SELECT * FROM get_active_prompt('critical_rules');
   SELECT * FROM get_active_prompt('self_discovery');
   SELECT * FROM get_active_prompt('simple_companion');
   ```
