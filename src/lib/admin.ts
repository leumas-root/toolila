import 'server-only'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '../../utils/supabase/server';

export async function requireAdmin(
  redirectOnFailure = true,
): Promise<{ authorized: true; userId: string } | { authorized: false }> {
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
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (roleError) {
    console.error('Échec de la vérification du rôle administrateur.', roleError);
    return denyAccess();
  }

  if (!adminRole) {
    return denyAccess();
  }

  return { authorized: true, userId };
}
