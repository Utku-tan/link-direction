import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings, Save, Star } from 'lucide-react'
import { updateTargetStars } from './actions'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type, target_stars_for_reward')
    .eq('id', user.id)
    .single()

  if (profile?.account_type !== 'business') {
    return (
      <div className="p-8 text-center text-zinc-400">
        Bu sayfayı sadece işletme hesapları görüntüleyebilir.
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
          <Settings className="w-6 h-6 text-[#00f2fe]" />
          İşletme Ayarları
        </h1>
        <p className="text-zinc-400 mt-1">
          Sadakat programınızı ve ödül kurallarını yapılandırın.
        </p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" />
          Ödül Hedefi
        </h2>
        <p className="text-sm text-zinc-400 mb-6">
          Müşterilerinizin ücretsiz ödül (kahve vb.) kazanabilmesi için toplamaları gereken yıldız sayısını belirleyin. 
          Bu değere ulaşan müşteriler "Ödül Kullan" kodu üretebilecek.
        </p>

        <form action={updateTargetStars} className="space-y-4">
          <div>
            <label htmlFor="target_stars" className="block text-sm font-medium text-zinc-300 mb-2">
              Hedef Yıldız Sayısı
            </label>
            <input 
              type="number" 
              id="target_stars" 
              name="target_stars" 
              defaultValue={profile.target_stars_for_reward || 8}
              min={1} 
              max={50}
              className="w-full max-w-[200px] bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white text-lg focus:outline-none focus:border-[#00f2fe] transition-colors"
            />
          </div>
          <button 
            type="submit" 
            className="px-6 py-3 bg-[#00f2fe] hover:bg-[#4facfe] text-zinc-950 font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Ayarları Kaydet
          </button>
        </form>
      </div>
    </div>
  )
}
