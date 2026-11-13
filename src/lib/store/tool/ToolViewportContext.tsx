'use client';

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { getTools, type ToolListItem } from '@/lib/tool.actions';

type ToolDetails = Pick<ToolListItem, 'icon_tool' | 'link_tool'>;

type ToolViewportContextValue = {
  detailsById: Record<string, ToolDetails | undefined>;
  errorsById: Record<string, string | undefined>;
  registerToolElement: (id: string, element: HTMLElement | null) => void;
  retryToolDetails: (id: string) => void;
};

const ToolViewportContext = createContext<ToolViewportContextValue | null>(null);

type ToolViewportProviderProps = {
  children: ReactNode;
};

export function ToolViewportProvider({ children }: ToolViewportProviderProps) {
  const [detailsById, setDetailsById] = useState<
    Record<string, ToolDetails | undefined>
  >({});
  const [errorsById, setErrorsById] = useState<Record<string, string | undefined>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementIdsRef = useRef(new Map<Element, string>());
  const loadedIdsRef = useRef(new Set<string>());
  const loadingIdsRef = useRef(new Set<string>());
  const isMountedRef = useRef(false);

  const loadToolDetails = useCallback(async (ids: string[]) => {
    const idsToLoad = [...new Set(ids)].filter(
      (id) => !loadedIdsRef.current.has(id) && !loadingIdsRef.current.has(id),
    );

    idsToLoad.forEach((id) => loadingIdsRef.current.add(id));

    for (let index = 0; index < idsToLoad.length; index += 50) {
      const batch = idsToLoad.slice(index, index + 50);

      try {
        const result = await getTools(batch);
        if (result.error) throw new Error(result.error);
        if (!isMountedRef.current) return;

        const returnedIds = new Set((result.data ?? []).map((tool) => tool.id));
        setDetailsById((currentDetails) => {
          const nextDetails = { ...currentDetails };
          for (const tool of result.data ?? []) {
            nextDetails[tool.id] = {
              icon_tool: tool.icon_tool,
              link_tool: tool.link_tool,
            };
          }
          return nextDetails;
        }); 

        for (const id of returnedIds) loadedIdsRef.current.add(id);
        //CODE qui demande à la bdd local les données d'un id du batch s'il ne fait pas partie des id retournés
        setErrorsById((currentErrors) => {
          const nextErrors = { ...currentErrors };
          for (const id of batch) {
            if (returnedIds.has(id)) delete nextErrors[id];
            else nextErrors[id] = `Aucun détail trouvé pour l’outil ${id}.`;
          }
          return nextErrors;
        });
      } catch (error) {
        if (!isMountedRef.current) return;
        const message = error instanceof Error ? error.message : String(error);
        console.error('Échec du chargement groupé des détails des outils.', error);
        setErrorsById((currentErrors) => {
          const nextErrors = { ...currentErrors };
          for (const id of batch) nextErrors[id] = message;
          return nextErrors;
        });
      } finally {
        batch.forEach((id) => loadingIdsRef.current.delete(id));
      }
    }
  }, []);

  const registerToolElement = useCallback(
    (id: string, element: HTMLElement | null) => {
      const observer = observerRef.current;

      if (!element) {
        for (const [registeredElement, registeredId] of elementIdsRef.current) {
          if (registeredId === id) {
            observer?.unobserve(registeredElement);
            elementIdsRef.current.delete(registeredElement);
          }
        }
        return;
      }

      elementIdsRef.current.set(element, id);
      observer?.observe(element);
    },
    [],
  );

  const retryToolDetails = useCallback(
    (id: string) => {
      setErrorsById((currentErrors) => {
        const nextErrors = { ...currentErrors };
        delete nextErrors[id];
        return nextErrors;
      });
      void loadToolDetails([id]);
    },
    [loadToolDetails],
  );

  useEffect(() => {
    isMountedRef.current = true;
    const observer = new IntersectionObserver((entries) => {
      const visibleIds = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => {
          observer.unobserve(entry.target);
          return elementIdsRef.current.get(entry.target);
        })
        .filter((id): id is string => id !== undefined);

      if (visibleIds.length > 0) void loadToolDetails(visibleIds);
    });

    observerRef.current = observer;
    for (const element of elementIdsRef.current.keys()) {
      observer.observe(element);
    }

    return () => {
      isMountedRef.current = false;
      observer.disconnect();
      observerRef.current = null;
      elementIdsRef.current.clear();
    };
  }, [loadToolDetails]);

  return (
    <ToolViewportContext.Provider
      value={{ detailsById, errorsById, registerToolElement, retryToolDetails }}
    >
      {children}
    </ToolViewportContext.Provider>
  );
}

export function useToolViewport() {
  const context = useContext(ToolViewportContext);
  if (!context) {
    throw new Error('useToolViewport doit être utilisé dans un ToolViewportProvider.');
  }
  return context;
}
