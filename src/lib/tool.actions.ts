'use server';

import { cookies } from 'next/headers';
import type { Tables, TablesInsert } from '../../utils/supabase/database.types';
import { requireAdmin } from './admin';
import { createClient } from '../../utils/supabase/server';

type AddToolResult = {
	data: Omit<Tables<'tool'>, 'dateCreated' | 'position' | 'url_root_tool'> | null;
	error: string | null;
};

export async function addTool(tool: TablesInsert<'tool'>): Promise<AddToolResult> {
	const name = tool.name_tool.trim();
	const link = tool.link_tool?.trim();

	if (!name) {
		return { data: null, error: 'Le nom du tool est requis.' };
	}

	if (!link) {
		return { data: null, error: 'Le lien du tool est requis.' };
	}

	try {
		const parsedLink = new URL(link);
		if (parsedLink.protocol !== 'http:' && parsedLink.protocol !== 'https:') {
			return { data: null, error: 'Le lien doit commencer par http:// ou https://.' };
		}
	} catch {
		return { data: null, error: 'Le lien fourni est invalide.' };
	}

	const rootUrl = new URL(link).host.replace(/^www\./i, '');

	try {
		const supabase = createClient(await cookies());
		const { data: sessionData, error: sessionError } =
			await supabase.auth.getSession();

		if (sessionError) {
			return { data: null, error: `Impossible de récupérer la session : ${sessionError.message}` };
		}

		if (!sessionData.session) {
			return { data: null, error: 'Une session utilisateur est requise pour ajouter un outil.' };
		}

		const { data: userData, error: userError } = await supabase.auth.getUser();
		if (userError || !userData.user) {
			return {
				data: null,
				error: `Impossible de vérifier l’utilisateur : ${userError?.message ?? 'Utilisateur introuvable.'}`,
			};
		}

		const { data: existingTool, error: existingToolError } = await supabase
			.from('tool')
			.select('id')
			.eq('url_root_tool', rootUrl)
			.limit(1)
			.maybeSingle();

		if (existingToolError) {
			return {
				data: null,
				error: `Impossible de vérifier si ce domaine est déjà utilisé : ${existingToolError.message}`,
			};
		}

		if (existingTool) {
			return {
				data: null,
				error: `Un outil utilisant déjà le domaine « ${rootUrl} » existe.`,
			};
		}

		const { data, error } = await supabase
			.from('tool')
			.insert({
				...tool,
				name_tool: name,
				link_tool: link,
				icon_tool: tool.icon_tool?.trim() || null,
				url_root_tool: rootUrl,
			})
			.select()
			.single();

		if (error) {
			return { data: null, error: error.message };
		}

		const { error: ownerError } = await supabase.from('owner').insert({
			user_id: userData.user.id,
			tool_id: data.id,
		});

		if (ownerError) {
			console.error(`Tool ${data.id} created but owner association failed:`, ownerError.message);
			return {
				data: null,
				error: `L’outil ${data.id} a été créé, mais son association à l’utilisateur a échoué : ${ownerError.message}`,
			};
		}

		return { data, error: null };
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Erreur inattendue.';
		console.error('Échec de la création de l’outil ou de son association au propriétaire :', error);
		return { data: null, error: message };
	}
}

export type ToolListItem = Omit<Tables<'tool'>, 'dateCreated' | 'url_root_tool'>;
export type AdminToolListItem = Tables<'tool'>;
export type ToolNameAndPosition = Pick<Tables<'tool'>, 'id' | 'name_tool' | 'position'>;

export async function getAdminTools(): Promise<{
	data: AdminToolListItem[] | null;
	error: string | null;
}> {
	const { authorized } = await requireAdmin(false);
	if (!authorized) {
		return { data: null, error: 'Accès administrateur requis.' };
	}

	const supabase = createClient(await cookies());
	const { data, error } = await supabase.from('tool').select('*');

	if (error) {
		return { data: null, error: error.message };
	}

	return { data, error: null };
}

export async function getTools(
	ids?: string[],
): Promise<{ data: ToolListItem[] | null; error: string | null }>;
export async function getTools(
	ids: string[] | undefined,
	onlyNameAndPosition: true,
): Promise<{ data: ToolNameAndPosition[] | null; error: string | null }>;
export async function getTools(
	ids?: string[],
	onlyNameAndPosition = false,
): Promise<{ data: ToolListItem[] | ToolNameAndPosition[] | null; error: string | null }> {
	if (ids?.some((id) => !id)) {
		return { data: null, error: 'La liste des identifiants contient une valeur invalide.' };
	}

	const { authorized } = await requireAdmin(false);
	const supabase = createClient(await cookies());
	if (onlyNameAndPosition) {
		let query = supabase.from('tool').select('id, name_tool, position');

		if (ids && ids.length > 0) {
			query = query.in('id', ids);
		}

		if (!authorized) {
			query = query.eq('status', 'Enabled');
		}

		const { data, error } = await query;
		if (error) {
			return { data: null, error: error.message };
		}
		return { data, error: null };
	}

	let query = supabase.from('tool').select('id, name_tool, status, icon_tool, position, link_tool');

	if (ids && ids.length > 0) {
		query = query.in('id', ids);
	}

	if (!authorized) {
		query = query.eq('status', 'Enabled');
	}

	const { data, error } = await query;

	if (error) {
		return { data: null, error: error.message };
	}

	return { data, error: null };
}


export async function setTools(
	{ column, value, ...target }:
		| { column: 'status'; value: boolean; ids: string[] }
		| { column: 'name_tool'; value: string; id: string }
		| { column: 'position'; value: Tables<'tool'>['position']; id: string }
) {
	const { authorized } = await requireAdmin(false);
	if (!authorized) {
		return { data: null, error: 'Accès administrateur requis.' };
	}

	const supabase = createClient(await cookies());

	if (column === 'status' && 'ids' in target) {
		if (target.ids.length === 0 || target.ids.some((id) => !id)) {
			return { data: null, error: 'La liste des identifiants est invalide.' };
		}

		const { data, error } = await supabase
			.from('tool')
			.update({ status: value ? 'Enabled' : 'Disabled' })
			.in('id', target.ids)
			.select();

		if (error) {
			return { data: null, error: error.message };
		}

		return { data, error: null };
	}

	if (column === 'position' && 'id' in target) {
		if (!target.id) {
			return { data: null, error: 'L’identifiant du tool est invalide.' };
		}

		const { data, error } = await supabase
			.from('tool')
			.update({ position: value })
			.eq('id', target.id)
			.select()
			.single();

		if (error) {
			return { data: null, error: error.message };
		}

		return { data, error: null };
	}

	const name = typeof value === 'string' ? value.trim() : '';
	if (!('id' in target) || !target.id) {
		return { data: null, error: 'L’identifiant du tool est invalide.' };
	}
	if (!name) {
		return { data: null, error: 'Le nom du tool est requis.' };
	}

	const { data, error } = await supabase
		.from('tool')
		.update({ name_tool: name })
		.eq('id', target.id)
		.select()
		.single();

	if (error) {
		return { data: null, error: error.message };
	}

	return { data, error: null };
}
