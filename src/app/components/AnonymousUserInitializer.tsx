'use client';

import { useEffect } from 'react';
import { anonymous } from '@/lib/user.actions';

let anonymousInitialization: Promise<void> | null = null;

function ensureAnonymousSession(): Promise<void> {
	if (!anonymousInitialization) {
		anonymousInitialization = (async () => {
			const { data, error } = await anonymous();

			if (error || !data?.user) {
				throw new Error(error ?? 'La session utilisateur est introuvable.');
			}
		})().catch((error: unknown) => {
			anonymousInitialization = null;
			throw error;
		});
	}

	return anonymousInitialization;
}

async function initializeAnonymousSession(): Promise<void> {
	if (navigator.locks) {
		await navigator.locks.request('nootin-anonymous-session', () =>
			ensureAnonymousSession(),
		);
		return;
	}

	await ensureAnonymousSession();
}

export default function AnonymousUserInitializer() {
	useEffect(() => {
		void initializeAnonymousSession().catch((error: unknown) => {
			console.error('Impossible d’initialiser la session utilisateur.', error);
		});
	}, []);

	return null;
}
