'use client';

import { Button, Field, Input } from '@fluentui/react-components';
import { Controller, useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Logo from '../components/Logo';
import styles from './page.module.scss';
import clsx from 'clsx';
import { createClient } from '../../../utils/supabase/client';

type AuthFormValues = {
  email: string;
  password: string;
};

export default function AdminPage() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function auth(values: AuthFormValues): Promise<void> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error || !data.user) {
        router.replace('/');
        return;
      }

      const { data: adminRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'admin')
        .limit(1)

      if (roleError || !adminRole) {
        await supabase.auth.signOut();
        router.replace('/');
        return;
      }

      router.replace('/admin/dashbord');
    } catch (error) {
      console.error('Échec de la vérification de la connexion admin.', error);
      router.replace('/');
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Logo withType className={clsx('logo')} />
      </header>

      <main className={styles.main}>
        <form className={styles.form} onSubmit={handleSubmit(auth)}>
          <h1 className={styles.title}>Connexion à l’administration</h1>

          <Controller
            name="email"
            control={control}
            rules={{
              required: 'L’adresse e-mail est requise.',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Saisissez une adresse e-mail valide.',
              },
            }}
            render={({ field }) => (
              <Field
                label="Adresse e-mail"
                required
                validationMessage={errors.email?.message}
                validationState={errors.email ? 'error' : 'none'}
              >
                <Input
                  {...field}
                  type="email"
                  autoComplete="username"
                  size="large"
                  placeholder="nom@exemple.com"
                />
              </Field>
            )}
          />

          <Controller
            name="password"
            control={control}
            rules={{ required: 'Le mot de passe est requis.' }}
            render={({ field }) => (
              <Field
                label="Mot de passe"
                required
                validationMessage={errors.password?.message}
                validationState={errors.password ? 'error' : 'none'}
              >
                <Input
                  {...field}
                  type="password"
                  autoComplete="current-password"
                  size="large"
                  placeholder="••••••••••••"
                />
              </Field>
            )}
          />

          <Button
            appearance="primary"
            size="large"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className={styles.loader} role="status" aria-label="Connexion en cours" />
                Connexion en cours…
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
