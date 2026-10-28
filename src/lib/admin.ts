import 'server-only'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '../../utils/supabase/server';

export async function requireAdmin(
  redirectOnFailure = true,
): Promise<
  | { authorized: true; pseudo: string | null }
  | { authorized: false }
> {
  function denyAccess(): { authorized: false } {
    if (redirectOnFailure) {
      redirect('/');
    }
    return { authorized: false };
  }

  const supabase = createClient(await cookies());

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== 'string' || !userId) {
    return denyAccess();
  }

  const { data: adminRole, error: roleError } = await supabase
    .from('user_details')
    .select('pseudo')
    .eq('user_id', userId)
    .eq('role', 'ADMIN')
    .maybeSingle()

  if (roleError) {
    console.log('Échec de la vérification du rôle administrateur.');
    return denyAccess();
  }

  if (!adminRole) {
    return denyAccess();
  }

  return { authorized: true, pseudo: adminRole.pseudo };
}
