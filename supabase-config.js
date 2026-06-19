/* ============================================================
   supabase-config.js  —  shared Supabase client
   Loaded by BOTH login.html and index.html, AFTER the CDN:
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="supabase-config.js"></script>

   Paste your two values from Supabase -> Settings -> API.
   The anon/public key is safe here (protected by RLS).
   ============================================================ */
window.SB_URL = 'https://zisgeftdyvewbtyokhrm.supabase.co';
window.SB_KEY = 'sb_publishable_hE5szHOuV2yzDqVZb7uPxg_OhSe6yj6';

window.sbClient = (window.supabase && window.SB_URL.indexOf('YOUR-PROJECT') === -1)
  ? window.supabase.createClient(window.SB_URL, window.SB_KEY)
  : null;
if (!window.sbClient) console.warn('[supabase] not configured — edit supabase-config.js');
