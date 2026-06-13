'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateTargetStars(formData: FormData) {
  const targetStars = parseInt(formData.get('target_stars') as string)

  if (isNaN(targetStars) || targetStars < 1 || targetStars > 50) {
    throw new Error('Lütfen 1 ile 50 arasında bir değer girin.')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Giriş yapmanız gerekiyor.')
  }

  const { error } = await supabase
    .from('profiles')
    .update({ target_stars_for_reward: targetStars })
    .eq('id', user.id)

  if (error) {
    throw new Error('Ayarlar güncellenirken bir hata oluştu.')
  }

  revalidatePath('/dashboard/settings')
}
