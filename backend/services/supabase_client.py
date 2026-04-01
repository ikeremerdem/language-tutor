from supabase import create_client, Client
from config import settings

# Service-role client — bypasses RLS; auth is enforced by our JWT middleware.
supabase: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)
