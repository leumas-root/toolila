'use server';

import { cookies } from 'next/headers';
import type { Tables, TablesInsert } from '../../utils/supabase/database.types';
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
	}

	return { data, error: null };
}

export async function updatePositionTool(
	toolId: number,
	position: Tables<'tool'>['position'],
): Promise<AddToolResult> {
	if (!Number.isInteger(toolId) || toolId <= 0) {
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
	ids?: number[],
): Promise<{ data: Tables<'tool'>[] | null; error: string | null }> {
	if (ids?.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
		return { data: null, error: 'La liste des identifiants contient une valeur invalide.' };
	}

	const supabase = createClient(await cookies());
	let query = supabase.from('tool').select();

	if (ids && ids.length > 0) {
		query = query.in('id', ids);
	}

	const { data, error } = await query;

	if (error) {
		return { data: null, error: error.message };
	}

	return { data, error: null };
}




