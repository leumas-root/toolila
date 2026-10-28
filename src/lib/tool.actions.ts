'use server';

import { cookies } from 'next/headers';
import type { Tables, TablesInsert } from '../../utils/supabase/database.types';
import { requireAdmin } from './admin';
import { createClient } from '../../utils/supabase/server';

type AddToolResult = {
	data: Tables<'tool'> | null;
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

	const supabase = createClient(await cookies());
	const { data, error } = await supabase
		.from('tool')
		.insert({
			...tool,
			name_tool: name,
			link_tool: link,
			icon_tool: tool.icon_tool?.trim() || null,
		})
		.select()
		.single();

	if (error) {
		return { data: null, error: error.message };
		console.log(error)
	}

	return { data, error: null };
}

export async function updatePositionTool(
	toolId: string,
	position: Tables<'tool'>['position'],
): Promise<AddToolResult> {
	if (!toolId) {
		return { data: null, error: 'L’identifiant du tool est invalide.' };
	}

	const supabase = createClient(await cookies());
	const { data, error } = await supabase
		.from('tool')
		.update({ position })
		.eq('id', toolId)
		.select()
		.single();

	if (error) {
		return { data: null, error: error.message };
	}

	return { data, error: null };
}

export async function getTools(
	ids?: string[],
): Promise<{ data: Tables<'tool'>[] | null; error: string | null }> {
	if (ids?.some((id) => !id)) {
		return { data: null, error: 'La liste des identifiants contient une valeur invalide.' };
	}

	const { authorized } = await requireAdmin(false);
	const supabase = createClient(await cookies());
	let query = supabase.from('tool').select();

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
