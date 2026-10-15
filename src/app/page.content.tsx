
'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { GridStack, type GridItemHTMLElement, type GridStackWidget } from 'gridstack';
import Image from 'next/image'
import styles from "./page.module.scss";
import { clsx } from "clsx";
import 'gridstack/dist/gridstack.min.css';
import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, DialogTrigger, Field, Input, Tooltip } from '@fluentui/react-components';
import Link from 'next/link';
import { PlusIcon } from '@phosphor-icons/react/dist/icons/Plus';
import { useToolStore } from '@/lib/store/tool/provider';
import { Controller, useForm } from 'react-hook-form';
import { addTool, getTools, updatePositionTool } from '@/lib/tool.actions';
import type { Tables } from '../../utils/supabase/database.types';

type ToolFormValues = {
  name: string;
  linkTo: string;
  icon: string;
};

type GridItemRequest = {
  grid: GridStack;
  widget: GridStackWidget;
  content: ReactNode;
};

function ajouterComposant(
  item: GridItemRequest,
  roots: Map<HTMLElement, Root>,
  onItemAdded: (item: GridItemHTMLElement) => boolean,
): boolean {
  const gridItem = item.grid.addWidget(item.widget);
  const container = gridItem?.querySelector('.grid-stack-item-content');
  if (!gridItem || !container) return false;

  const root = createRoot(container);
  roots.set(gridItem, root);
  root.render(item.content);

  return onItemAdded(gridItem);
}

const ItemContent = ({ id, name, linkTo, icon }: { id: string; name?: string; linkTo?: string; icon?: string }) => {
  const isExternalLink = /^https?:\/\//i.test(linkTo || '');

  return (
    <Tooltip content={name || 'Outils'} relationship="label" >
      <Link
        href={linkTo || '#'}
        className='grid-stack-item-content'
        target={isExternalLink ? '_blank' : undefined}
        rel={isExternalLink ? 'noopener noreferrer' : undefined}
      >
        <div className="img-wrapper">
          <Image
              src={icon || '/logo_default.svg'}
              fill
              unoptimized
              alt={name ? `Icône ${name}` : 'Icône par défaut'}
          />
        </div>
        <div className="name">{name || 'Outils'}</div>
      </Link>
    </Tooltip>
  );
}

function persistToolPosition(item: GridItemHTMLElement) {
  const node = item.gridstackNode;
  const toolId = Number(node?.id);

  if (
    !Number.isSafeInteger(toolId) ||
    toolId <= 0 ||
    typeof node?.x !== 'number' ||
    typeof node.y !== 'number'
  ) {
    return;
  }

  void updatePositionTool(toolId, {
    x: node.x,
    y: node.y,
  }).then(({ error }) => {
    if (error) console.error('Impossible de sauvegarder la position du tool:', error);
  });
}

export default function Board() {
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInstance = useRef<GridStack | null>(null);
  const roots = useRef<Map<HTMLElement, Root>>(new Map());
  const { gridStack, updateGridRef } = useToolStore((state) => state)
  useEffect(() => {
    if (!gridRef.current) return;

    let isActive = true;
    const grid = GridStack.init(
      {
        column: 12,
        cellHeight: 100,
        margin: 8,
        mode: 'float',
      },
      gridRef.current
    );
    if (!grid) return; 
    grid.on('dragstop', (_event, item) => persistToolPosition(item));
    grid.on('resizestop', (_event, item) => persistToolPosition(item));
    gridInstance.current = grid;
    updateGridRef(gridInstance);

    function ajouterToolEnGrille(tool: Tables<'tool'>) {
      const savedPosition =
        typeof tool.position === 'object' && tool.position !== null && !Array.isArray(tool.position)
          ? tool.position
          : {};
      if (!grid) return;
      const itemSet = ajouterComposant(
        {
          grid,
          widget: {
            id: String(tool.id),
            x: typeof savedPosition.x === 'number' ? savedPosition.x : 0,
            y: typeof savedPosition.y === 'number' ? savedPosition.y : 0,
            w: 1,
            h: 1,
            content: '',
            noResize: true,
          },
          content: (
            <ItemContent
              id={String(tool.id)}
              name={tool.name_tool}
              linkTo={tool.link_tool}
              icon={tool.icon_tool ?? undefined}
            />
          ),
        },
        roots.current,
        (addedItem) => Boolean(addedItem.gridstackNode?.id),
      );
      if (!itemSet) console.error(`Impossible d’ajouter le tool ${tool.id} à la grille.`);
    }

    async function chargerTools() {
      const { data, error } = await getTools();
      if (!isActive) return;
      if (error) {
        console.error('Impossible de charger les tools:', error);
        return;
      }
      data?.forEach(ajouterToolEnGrille);
    }

    void chargerTools();

    return () => {
      isActive = false;
      roots.current.forEach(root => root.unmount());
      roots.current.clear();
      grid && grid.destroy(false);
      gridInstance.current = null;
      updateGridRef(gridInstance);
    };
  }, []);

  return (
    <div>
      <div
        ref={gridRef}
        className="grid-stack"
        style={{ marginTop: 20 }}
      />
    </div>
  );
}

export function ActionsButtons() {
  const { tool, updateTool, gridStack } = useToolStore((state) => state)
  const roots = useRef<Map<HTMLElement, Root>>(new Map());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { control, handleSubmit, reset, formState: { errors } } = useForm<ToolFormValues>({
    defaultValues: { name: 'Nike', linkTo: 'https://www.nike.com/', icon: 'https://pngimg.com/uploads/nike/nike_PNG18.png' },
  });

  async function handleAddTool(values: ToolFormValues) {
    if (!gridStack) return;
    const grid = gridStack.current;
    if (!grid) return;

    setSubmitError(null);
    const { data, error } = await addTool({
      name_tool: values.name,
      link_tool: values.linkTo,
      icon_tool: values.icon || null,
    });

    if (error || !data) {
      setSubmitError(error || 'La création du tool a échoué.');
      return;
    }

    updateTool(values);
    const itemSet = ajouterComposant(
      {
        grid,
        widget: {
          id: String(data.id),
          w: 1,
          h: 1,
          content: '',
          noResize: true,
        },
        content: <ItemContent id={String(data.id)} {...values} />,
      },
      roots.current,
      (item) => {
        return Boolean(item.gridstackNode?.id);
      },
    );
    if (!itemSet) {
      setSubmitError('Le tool a été créé, mais le bloc n’a pas pu être ajouté au grid.');
      return;
    }
    reset();
    setDialogOpen(false);
    
  }
  return (
    <div className={clsx(styles['btn-actions-wrapper'], 'py-2 lg-py-3 px-2')}>
      <Dialog open={dialogOpen} onOpenChange={(_, data) => setDialogOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button 
          appearance="outline" name="addbloc" size="large"
          icon={<PlusIcon size={32} />} 
        />
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Ajouter un outil</DialogTitle>
          <DialogContent>
            <form id="add-tool-form" className={clsx(styles['form_add_tool'])} onSubmit={handleSubmit(handleAddTool)}>
              {submitError && <div role="alert">{submitError}</div>}
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Le nom est requis.' }}
                render={({ field }) => (
                  <Field label="Nom" required validationMessage={errors.name?.message}>
                    <Input {...field} size='large' value={field.value} placeholder="Nom de l’outil" />
                  </Field>
                )}
              />
              <Controller
                name="linkTo"
                control={control}
                rules={{ required: 'Le lien est requis.' }}
                render={({ field }) => (
                  <Field label="Lien" required validationMessage={errors.linkTo?.message}>
                    <Input {...field} size='large' value={field.value} type="url" placeholder="https://www.nike.com/" />
                  </Field>
                )}
              />
              <Controller
                name="icon"
                control={control}
                render={({ field }) => (
                  <Field label="Icône" hint="Chemin d’image, par exemple https://www.nike.com/logo.png">
                    <Input {...field} size='large' value={field.value} placeholder="https://www.nike.com/logo.png" />
                  </Field>
                )}
              />
            </form>
          </DialogContent>
          <DialogActions fluid>
            <Button appearance="primary" size="large" className={clsx(styles['form_add_tool_actions'])} type="submit" form="add-tool-form">Ajouter</Button>
            <Button appearance="secondary" className={clsx(styles['form_add_tool_actions'])} size="large" type='reset' onClick={() => reset()} form="add-tool-form">Initialiser</Button>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary" className={clsx(styles['form_add_tool_actions'])} size="large">Annuler</Button>
            </DialogTrigger>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
    </div>
  );
}
