
'use client';

import { createContext, type FormEvent, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { Root } from 'react-dom/client';
import type { GridStack as GridStackInstance } from 'gridstack';
import { GridItemHTMLElement, GridStack, useGridStack, type GridStackOptions } from "gridstack/dist/react";
import styles from "./page.module.scss";
import { clsx } from "clsx";
import 'gridstack/dist/gridstack.min.css';
import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, DialogTrigger, Field, Input, Skeleton, SkeletonItem, Tooltip } from '@fluentui/react-components';
import Link from 'next/link';
import { PlusIcon } from '@phosphor-icons/react/dist/icons/Plus';
import type { Tool } from '@/lib/store/tool/store';
import { Controller, useForm } from 'react-hook-form';
import { addTool, getTools, setTools } from '@/lib/tool.actions';
import type { Tables } from '../../utils/supabase/database.types';
import ImageWrapper from './components/ImageWrapper';
import { type CallbackProps, ToastUi } from './components/Toast';
import { useDialogue } from './components/DialogueUi';
import { MagnifyingGlassIcon, TrashIcon } from '@phosphor-icons/react';
import { clientDb, ClientDbProps } from '@/lib/clientdb.module';
import { ToolViewportProvider, useToolViewport } from '@/lib/store/tool/ToolViewportContext';

type ToolFormValues = {
  name: string;
  linkTo: string;
  icon: string;
};

const ItemContent = ({id, name }: {id?:string; name?: string;}) => {
  const {detailsById, errorsById} = useToolViewport();
  const [localToolResult, setLocalToolResult] = useState<{
    id: string;
    detailError: string;
    tool: Omit<Tables<'tool'>, 'dateCreated' | 'url_root_tool'> | null;
  } | null>(null);
  const detailError = id ? errorsById[id] : undefined;
  const localToolResultForCurrentTool =
    localToolResult &&
    localToolResult.id === id &&
    localToolResult.detailError === detailError
      ? localToolResult
      : null;
  const storedInLocalDb = localToolResultForCurrentTool?.tool ?? null;

  useEffect(() => {
    let isActive = true;

    if (!id || !detailError) return;

    const toolId = id;
    const toolDetailError = detailError;

    async function loadLocalTool() {
      let localStore: ClientDbProps<
        Omit<Tables<'tool'>, 'dateCreated' | 'url_root_tool'>
      > | null = null;

      try {
        localStore = await clientDb<
          Omit<Tables<'tool'>, 'dateCreated' | 'url_root_tool'>
        >('Nootin').init('personals', 'id', ['name_tool', 'id']);
        if (!isActive) return;
        const result = await localStore.get([toolId]);
        if (result.error) throw new Error(result.error);
        if (isActive) {
          setLocalToolResult({
            id: toolId,
            detailError: toolDetailError,
            tool: result.data?.[0] ?? null,
          });
        }
      } catch (error) {
        console.error(`Échec de la récupération locale de l’outil ${toolId}.`, error);
        if (isActive) {
          setLocalToolResult({ id: toolId, detailError: toolDetailError, tool: null });
        }
      } finally {
        localStore?.close();
      }
    }

    void loadLocalTool();

    return () => {
      isActive = false;
    };
  }, [detailError, id]);

  const details = id ? detailsById[id] : undefined;
  const linkTool = details?.link_tool || storedInLocalDb?.link_tool || '#';
  const iconTool = details?.icon_tool || storedInLocalDb?.icon_tool || '/logo_default.svg';
  const isExternalLink = /^https?:\/\//i.test(linkTool);
  const isLocalLoading = Boolean(
    id && detailError && !localToolResultForCurrentTool,
  );

  if (!details && (!detailError || isLocalLoading)) return (
    <Skeleton animation={'wave'}  aria-label="Loading Content">
      <SkeletonItem shape='square' size={56} />
    </Skeleton>
  );
  return (
    <Tooltip content={name || 'Outils'} relationship="label" >
      <Link
        href={linkTool}
        className='grid-stack-item-container'
        target={isExternalLink ? '_blank' : undefined}
        rel={isExternalLink ? 'noopener noreferrer' : undefined}
      >
        <ImageWrapper 
          classNameWrapper=''
          isExternal={true} 
          src={iconTool} 
          alt={name ? `Icône ${name}` : 'Icône par défaut'} 
        />
        <div className="name">{name || 'Outils'}</div>
      </Link>
    </Tooltip>
  );
}

type GridWidgetControllerActions = {
  loadTools: (tools: Tool[]) => boolean;
};

const GridWidgetControllerContext = createContext<GridWidgetControllerActions | null>(null);

function useGridWidgetController() {
  const actions = useContext(GridWidgetControllerContext);
  if (!actions) {
    throw new Error('useGridWidgetController doit être utilisé dans GridWidgetController.');
  }
  return actions;
}

const GridWidgetController = ({
  tools,
  autoLoad = false,
  children,
}: {
  tools: Tool[] | undefined;
  autoLoad?: boolean;
  children: ReactNode;
}) => {
  const { addWidget, grid } = useGridStack();
  const gridRef = useRef<GridStackInstance | null>(null);
  const addedToolIds = useRef(new Set<string>());
  const {registerToolElement}=useToolViewport()

  useEffect(() => {
    gridRef.current = grid;

    return () => {
      if (gridRef.current === grid) {
        gridRef.current = null;
      }
    };
  }, [grid]);

  const loadTools = useCallback((tools: Tool[]) => {
    if (!gridRef.current) return false;
    let allToolsLoaded = true;

    for (const tool of tools) {
      const id = String(tool.id);
      if (addedToolIds.current.has(id)) continue;
      const item = addWidget({
        id,
        x: tool.position.x,
        y: tool.position.y,
        w: 1,
        h: 2,
        component: 'ItemContent',
        props: {
          id: id,
          name: tool.name_tool,
        },
        noResize: true,
      });

      if (!item) {
        allToolsLoaded = false;
        continue;
      }

      addedToolIds.current.add(id);
      registerToolElement(id, item);
    }

    return allToolsLoaded;
  }, [addWidget, registerToolElement]);

  useEffect(() => {
    if (autoLoad && tools) loadTools(tools);
  }, [autoLoad, loadTools, tools]);

  return (
    <GridWidgetControllerContext.Provider value={{ loadTools }}>
      {children}
    </GridWidgetControllerContext.Provider>
  );
};

export default function Board() {
  const [gridOptions] = useState<GridStackOptions>({
    column: 12,
    cellHeight: 50,
    mode: 'float',
    columnOpts: {
      columnWidth: 100,
      columnMax: 12,
      breakpointForWindow: false,
    }
  });
  const ToastRef = useRef<((callbackProps: CallbackProps) => void) | null>(null);
  const [draggedToolId, setDraggedToolId] = useState<string | null>(null);
  const { openDialogue, dialogue } = useDialogue();  
  const [toolsList, setToolsList] = useState<Record<string, Omit<Tables<'tool'>, 'dateCreated' | 'url_root_tool'>> | null>(null);
  const [loads, setLoads] = useState<{local : boolean, remote:boolean}|null>(null)
  const listKeys = useRef(new Set<string>())

  const dragAction = useCallback(async(_: Event, el: GridItemHTMLElement)=>{
    const node = el.gridstackNode
    const id = node?.id
    const x = el.gridstackNode?.x
    const y = el.gridstackNode?.y
    setDraggedToolId(id||null)
    const position = {
      x : !Number(x) ? 0 : Number(x),
      y : !Number(y) ? 0 : Number(y),
    }

    if (!id) {
      openDialogue('La mise à jour a échoué', 'L’identifiant de l’outil est manquant.');
      return;
    }

    let serverError: string;
    try {
      const {error, data} = await setTools(
        {
          column : 'position',
          value : position,
          id
        }
      )

      if (!error && data) return;
      serverError = error || 'Aucune donnée retournée par le serveur.';
    } catch (error) {
      serverError = error instanceof Error ? error.message : String(error);
    }

    let remoteToolsStore: ClientDbProps<
      Pick<Tables<'tool'>, 'id' | 'name_tool' | 'position'>
    > | null = null;
    try {
      remoteToolsStore = await clientDb<
        Pick<Tables<'tool'>, 'id' | 'name_tool' | 'position'>
      >('Nootin').init('remote', 'id', ['name_tool', 'id']);

      const existingResult = await remoteToolsStore.get([id]);
      if (existingResult.error) throw new Error(existingResult.error);

      if (existingResult.data?.length) {
        const updateResult = await remoteToolsStore.update(id, { position });
        if (updateResult.error || !updateResult.data) {
          throw new Error(updateResult.error || 'La position locale n’a pas été mise à jour.');
        }
      } else {
        const name_tool = toolsList?.[id]?.name_tool;
        if (!name_tool) {
          throw new Error(`Le nom de l’outil ${id} est introuvable pour la sauvegarde locale.`);
        }

        const insertResult = await remoteToolsStore.insert([{ id, name_tool, position }]);
        if (insertResult.error || !insertResult.data?.length) {
          throw new Error(insertResult.error || 'L’outil n’a pas été créé dans le stockage local.');
        }
      }

      setToolsList((current) => {
        const previousTool = current?.[id];
        return {
          ...current,
          [id]: {
            ...previousTool,
            id,
            name_tool: previousTool?.name_tool ?? toolsList?.[id]?.name_tool ?? '',
            position,
            status: previousTool?.status ?? 'shared',
            link_tool: previousTool?.link_tool ?? '',
            icon_tool: previousTool?.icon_tool ?? '',
          },
        };
      });
    } catch (error) {
      const localError = error instanceof Error ? error.message : String(error);
      console.error(`Échec de la sauvegarde locale de la position de l’outil ${id}.`, error);
      openDialogue(
        'La mise à jour a échoué',
        `ID : ${id}. Erreur serveur : ${serverError} Erreur locale : ${localError}`,
      );
    } finally {
      remoteToolsStore?.close();
    }
  }, [openDialogue, toolsList])

  const gridTools = useMemo<Tool[]>(() => {
    if (toolsList === null) return [];
    if (!loads?.local) return [];
    const localTools = Object.values(toolsList).map((tool) => {
      const savedPosition =
        typeof tool.position === 'object' &&
        tool.position !== null &&
        !Array.isArray(tool.position)
          ? tool.position
          : null;

      return {
        id: tool.id,
        name_tool: tool.name_tool,
        link_tool: tool.link_tool ?? undefined,
        icon_tool: tool.icon_tool ?? undefined,
        position: {
          x: typeof savedPosition?.x === 'number' ? savedPosition.x : 0,
          y: typeof savedPosition?.y === 'number' ? savedPosition.y : 0,
        },
      };
    });

    return [...localTools];
  }, [loads?.local, toolsList]);

  useEffect(() => {
    let isActive = true;
    async function fetchTools() {
      
      try {
        const result = await getTools(undefined, true);
        if (!isActive) return;
        if (result.error) {
          openDialogue('La récupération a échoué', result.error);
          return;
        }
        const remoteTools =
          result.data?.filter(item => !listKeys.current.has(item.id)) || [];

        setToolsList((c)=>{
          const previous = {...c}

          for (const item of remoteTools) {
            previous[item.id] = {...item,  status:'shared', link_tool: '', icon_tool:''}
          }
          return previous
        });
        setLoads((c)=>({
          remote : true,
          local : (c && c.local) || false
        }))
      } catch (error) {
        if (!isActive) return;
        const message = error instanceof Error ? error.message : String(error);
        console.error('Échec du chargement des outils.', error);
        openDialogue('La récupération a échoué', message);
        setLoads((c)=>({
          remote : false,
          local : (c && c.local) || false
        }))
      }
    }

    async function fetchLocalTools() {
      try{
        const localToolsStore = await clientDb<Omit<Tables<'tool'>, 'dateCreated' | 'url_root_tool'>>('Nootin').init('personals', 'id', ['name_tool', 'id']);
        const remoteToolsStore = await clientDb<Pick<Tables<'tool'>, 'id' | 'name_tool' | 'position'>>('Nootin').init('remote', 'id', ['name_tool', 'id']);
        const {data: localTools} = await localToolsStore.get()
        const {data: remoteTools} = await remoteToolsStore.get()
        if (!isActive) return;
        if (localTools) {
          for (const tool of localTools) listKeys.current.add(tool.id);
          setToolsList((current)=>{
            const next = {...current}
            for (const tool of localTools) {
              next[tool.id] = tool
            }
            return next
          })
        }
        if (remoteTools) {
          for (const tool of remoteTools) listKeys.current.add(tool.id);
          setToolsList((current)=>{
            const next = {...current}
            for (const tool of remoteTools) {
              next[tool.id] = { ...tool, status:'shared', link_tool: '', icon_tool:'' }
            }
            return next
          })
        }
        setLoads((c)=>({
          local:true,
          remote : (c ? c.remote : false)
        }))
      }catch(error) {
        if (!isActive) return;
        const message = error instanceof Error ? error.message : String(error);
        console.error('Échec du chargement local des outils.', error);
        openDialogue('La récupération locale a échoué', message);
        setLoads((c)=>({
          local:false,
          remote : (c ? c.remote : false)
        }))
      }
    }
    void fetchLocalTools();
    void fetchTools();
    return () => {
      isActive = false;
    };
  }, [openDialogue]);

  return (
      <div className={clsx(styles['board-wrapper'], 'board-wrapper')}>
      <ToolViewportProvider>
          <GridStack options={gridOptions} onDragStop={dragAction} components={{ItemContent}}>
          <GridWidgetController autoLoad tools={gridTools}>
            <ActionsButtons />
          </GridWidgetController>
        </GridStack>
      </ToolViewportProvider>
      <DeleteToolManager draggedToolId={draggedToolId} />
      <ToastUi toasterId="my-toaster" notifyCallback={ToastRef} />
      {dialogue}
    </div>
  );
}

export function ActionsButtons() {
  const { loadTools } = useGridWidgetController();
  const { grid } = useGridStack();
  const roots = useRef<Map<HTMLElement, Root>>(new Map());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);  
  const [isPending, startTransition] = useTransition();
  const ToastRef = useRef<((callbackProps: CallbackProps) => void) | null>(null);
  const { control, handleSubmit, reset, formState: { errors } } = useForm<ToolFormValues>({
    defaultValues: { name: 'Nike', linkTo: 'https://www.nike.com/', icon: 'https://pngimg.com/uploads/nike/nike_PNG18.png' },
  });
  const toolStoreRef = useRef<ClientDbProps<Omit<Tables<'tool'>, 'dateCreated' | 'url_root_tool'>> | null>(null)

  function getVisibleCenterPosition(): Tool['position'] | null {
    if (!grid) return null;

    const gridRect = grid.el.getBoundingClientRect();
    const visibleTop = Math.max(gridRect.top, 0);
    const visibleBottom = Math.min(gridRect.bottom, window.innerHeight);
    if (visibleBottom <= visibleTop) return null;

    const visibleCenterY = (visibleTop + visibleBottom) / 2;
    const cell = grid.getCellFromPixel({
      top: visibleCenterY + window.scrollY,
      left: gridRect.left + gridRect.width / 2 + window.scrollX,
    }, true);

    return {
      x: 6,
      y: Math.max(0, cell.y - 1),
    };
  }

  useEffect(() => {
    let isActive = true;
    const effectRoots = roots.current;

    async function initializeLocalStore() {
      try {
        const toolStore = await clientDb<Omit<Tables<'tool'>, 'dateCreated' | 'url_root_tool'>>('Nootin').init('personals', 'id', ['name_tool', 'id']);
        if (!isActive) {
          toolStore.close();
          return;
        }
        toolStoreRef.current = toolStore;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Échec de l’initialisation du stockage local des outils.', error);
        if (isActive) setSubmitError(`Le stockage local est indisponible. ${message}`);
      }
    }

    void initializeLocalStore();
    return () => {
      isActive = false;
      toolStoreRef.current?.close();
      toolStoreRef.current = null;
      effectRoots.forEach(root => root.unmount());
      effectRoots.clear();
    };
  }, []);

  async function handleAddTool(values: ToolFormValues) {
    setSubmitError(null);
    const position = getVisibleCenterPosition();
    if (!position) {
      const message = 'La grille doit être visible pour placer le nouvel outil.';
      setSubmitError(message);
      ToastRef.current?.({
        title: 'Placement impossible',
        message,
        intent: 'error',
      });
      return;
    }

    let addToolResult: Awaited<ReturnType<typeof addTool>>;
    try {
      addToolResult = await addTool({
        name_tool: values.name,
        link_tool: values.linkTo,
        icon_tool: values.icon || null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Échec de la création de l’outil.', error);
      setSubmitError(`La création du tool a échoué. ${message}`);
      ToastRef.current?.({
        title: 'Erreur',
        message: `La création du tool a échoué. ${message}`,
        intent: 'error',
      });
      return;
    }

    const { data: createdTool, error: addToolError } = addToolResult;

    if (addToolError || !createdTool) {
      setSubmitError(addToolError || 'La création du tool a échoué.');
      ToastRef.current?.({
        title : "Erreur",
        message: `La créations de l'outil à échouer. ${addToolError}`,
        intent: 'error',
      });
      return;
    }

    const localStore = toolStoreRef.current;
    if (!localStore) {
      const message = 'L’outil a été créé sur le serveur, mais le stockage local n’est pas initialisé.';
      setSubmitError(message);
      ToastRef.current?.({
        title: 'Erreur de sauvegarde locale',
        message,
        intent: 'error',
      });
      return;
    }

    let insertResult: Awaited<ReturnType<typeof localStore.insert>>;
    try {
      insertResult = await localStore.insert([{
          id: createdTool.id,
          name_tool: createdTool.name_tool,
          status: createdTool.status,
          icon_tool: createdTool.icon_tool,
          position,
          link_tool: createdTool.link_tool,
        }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Échec de la sauvegarde locale de l’outil.', error);
      const errorMessage = `L’outil a été créé sur le serveur, mais la sauvegarde locale a échoué. ${message}`;
      setSubmitError(errorMessage);
      ToastRef.current?.({
        title: 'Erreur de sauvegarde locale',
        message: errorMessage,
        intent: 'error',
      });
      return;
    }

    const { error: insertError, data: insertedData } = insertResult;
    if (insertError || !insertedData) {
      const message = insertError || "L'outil a été créé sur le serveur, mais n'a pas pu être sauvegardé localement.";
      setSubmitError(message);
      ToastRef.current?.({
        title: "Erreur de sauvegarde locale",
        message,
        intent: 'error',
      });
      return;
    }

    const tool: Tool = {
      id: createdTool.id,
      name_tool: createdTool.name_tool,
      link_tool: createdTool.link_tool ?? undefined,
      icon_tool: createdTool.icon_tool ?? undefined,
      position,
    };
    if (!loadTools([tool])) {
      const message = 'L’outil a été sauvegardé, mais n’a pas pu être ajouté à la grille.';
      setSubmitError(message);
      ToastRef.current?.({
        title: 'Erreur d’affichage',
        message,
        intent: 'error',
      });
      return;
    }

    reset();
    setDialogOpen(false);
    
  }

  function submitToolForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    startTransition(async () => {
      await handleSubmit(handleAddTool)(event);
    });
  }

  return (
    <div className={clsx(styles['btn-actions-wrapper'], 'py-2 lg-py-3 px-2')}>
      <Dialog open={dialogOpen} onOpenChange={(_, data) => setDialogOpen(data.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button 
          appearance="outline" name="addbloc"
          icon={<PlusIcon />} 
          className={clsx(styles['btn-actions'], styles['active'])}
        />
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Ajouter un outil</DialogTitle>
          <DialogContent>
            {submitError && <div role="alert">{submitError}</div>}
            <form id="add-tool-form" className={clsx(styles['form_add_tool'])} onSubmit={submitToolForm}>
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
            <Button appearance="primary" size="large" className={clsx(styles['form_add_tool_actions'])} type="submit" form="add-tool-form" disabled={isPending}>
              {isPending ? 'Ajout…' : 'Ajouter'}
            </Button>
            <Button appearance="secondary" className={clsx(styles['form_add_tool_actions'])} size="large" type='reset' onClick={() => reset({ name: '', linkTo: '', icon: '' })} form="add-tool-form">Initialiser</Button>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary" className={clsx(styles['form_add_tool_actions'])} size="large">Annuler</Button>
            </DialogTrigger>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
    <div className="">
      <Button 
          appearance="outline" name="addbloc"
          icon={<MagnifyingGlassIcon weight="fill" />} 
          className={clsx(styles['btn-actions'])}
        />
    </div>
    <ToastUi toasterId="my-toaster" notifyCallback={ToastRef} />
    </div>
    
  );
}

interface DeleteToolManagerProps {
  draggedToolId: string | null;
}

function DeleteToolManager({ draggedToolId }: DeleteToolManagerProps) {

  const { openDialogue , dialogue} = useDialogue();

  function handleDeleteTool() {
    if (draggedToolId === null) {
      openDialogue('Aucun outil sélectionné', 'Déplacez un outil avant de demander sa suppression.');
      return;
    }
    openDialogue('Supprimer un outil', `Etes-vous sûr de vouloir supprimer l'outil avec l'identifiant ${draggedToolId} ? Cette action est irréversible.`);
  }

  return (<>
    <div className="">
      <Button appearance="primary" size="large" icon={<TrashIcon size={32} weight="fill" />} className={clsx('btn btn-danger')}
        onPointerUp={()=>handleDeleteTool()}
        onPointerDown={()=>handleDeleteTool()}
      />
    </div>
    {dialogue}
  </>)  
}
