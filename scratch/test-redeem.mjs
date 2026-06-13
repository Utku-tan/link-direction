import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function main() {
  console.log('Testing generate_redeem_code...');
  const { data, error } = await supabase.rpc('generate_redeem_code', {
    p_business_id: '1d0a5e2f-b4b0-468e-9080-b7dc4465b828',
    p_visitor_uuid: 'a87a26f3-21c6-4d0f-a4fb-dbb2e1e0a294'
  });
  console.log('Data:', data);
  console.log('Error:', error);
}
main();
