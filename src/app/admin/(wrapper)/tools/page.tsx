'use client'

import { useEffect, useRef, useState } from "react"
import clsx from "clsx"
import {
  Button,
  Field,
  Input,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Tooltip,
} from "@fluentui/react-components"
import {
  ArrowCounterClockwiseIcon,
  ArrowSquareOutIcon,
  CaretDownIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  WrenchIcon,
} from "@phosphor-icons/react"
import ImageWrapper from "@/app/components/ImageWrapper"
import { getTools, setTools } from "@/lib/tool.actions"
import type { Tables } from "@/../utils/supabase/database.types"
import styles from "./page.module.scss"

interface ToolsManipulation {
  tools: Tables<"tool">[]
  selectedIds: {ids:string[], isAll : false} | {isAll : true},
  isLoading: boolean
  error: string | null
}

export default function ToolsPage() {
  const [manipulation, setManipulation] = useState<ToolsManipulation>({
    tools: [],
    selectedIds: {ids:[], isAll : false},
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    let isMounted = true

    async function loadTools() {
      try {
        const result = await getTools()
        if (!isMounted) return

        if (result.error) {
          setManipulation((current) => ({
            ...current,
            isLoading: false,
            error: result.error,
          }))
          return
        }

        setManipulation((current) => ({
          ...current,
          tools: [...(result.data ?? [])].sort(
            (first, second) =>
              new Date(second.dateCreated).getTime() - new Date(first.dateCreated).getTime(),
          ),
          isLoading: false,
          error: null,
        }))
      } catch (error) {
        console.error("Échec du chargement des outils.", error)
        if (isMounted) {
          setManipulation((current) => ({
            ...current,
            isLoading: false,
            error: "Le chargement des outils a échoué. Réessayez plus tard.",
          }))
        }
      }
    }

    void loadTools()

    return () => {
      isMounted = false
    }
  }, [])

  function toggleTool(toolId: string) {
    setManipulation((current) => {
      if (current.selectedIds.isAll) {
        return {
          ...current,
          selectedIds: {
            ids: current.tools.filter((tool) => tool.id !== toolId).map((tool) => tool.id),
            isAll: false,
          },
        }
      }

      const ids = current.selectedIds.ids
      return {
        ...current,
        selectedIds: {
          ids: ids.includes(toolId) ? ids.filter((id) => id !== toolId) : [...ids, toolId],
          isAll: false,
        },
      }
    })
  }

  function toggleAllTools() {
    setManipulation((current) => ({
      ...current,
      selectedIds:( current.selectedIds.isAll
        ? {ids : [], isAll : false}
        : !current.selectedIds.isAll && {isAll : true}
      )
    }))
  }

  async function updateSelectedStatus(action: "enable" | "disabled") {
    const ids = manipulation.selectedIds.isAll
      ? manipulation.tools.map((tool) => tool.id)
      : manipulation.selectedIds.ids

    if (ids.length === 0) return

    try {
      const result = await setTools({
        column: "status",
        value: action === "enable",
        ids,
      })

      if (result.error) {
        setManipulation((current) => ({ ...current, error: result.error }))
        return
      }

      setManipulation((current) => ({
        ...current,
        tools: current.tools.map((tool) =>
          ids.includes(tool.id)
            ? { ...tool, status: action === "enable" ? "Enabled" : "Disabled" }
            : tool,
        ),
        selectedIds: { ids: [], isAll: false },
        error: null,
      }))
    } catch (error) {
      console.error("Échec de la mise à jour du statut des outils.", error)
      setManipulation((current) => ({
        ...current,
        error: "La mise à jour du statut a échoué. Réessayez plus tard.",
      }))
    }
  }

  const selectionCount = manipulation.selectedIds.isAll ? manipulation.tools.length : manipulation.selectedIds.ids.length

  return (
    <div className={styles["view-container"]}>
      <header className={clsx(styles.header, "pb-3")}>
        <div className={styles.selection}>
          <span className={styles.selectionCount}> {selectionCount} </span>
          <span>
            {selectionCount<=1 ? 'outil selectionné' : 'outils sélectionnés'}
          </span>
        </div>
        <div className={styles.actions}>
          <Button
            appearance="secondary"
            size="large"
            className={styles.delete}
            disabled={selectionCount<=0}
            title="La suppression sera disponible prochainement."
          >
            Supprimer
          </Button>
          <div className={styles.splitActions}>
            <Button
              appearance="primary"
              size="large"
              className={styles.setValide}
              disabled={selectionCount<=0}
              title="La validation sera disponible prochainement."
            >
              Valider
            </Button>
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button
                  appearance="primary"
                  size="large"
                  className={styles.splitChevron}
                  disabled={selectionCount<=0}
                  aria-label="Autres actions de statut"
                  title="Autres actions"
                >
                  <CaretDownIcon size={16} aria-hidden="true" />
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem onClick={() => void updateSelectedStatus("enable")}>
                    Valider
                  </MenuItem>
                  <MenuItem onClick={() => void updateSelectedStatus("disabled")}>
                    Désactiver
                  </MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>
          </div>
        </div>
      </header>

      <section className={styles["table-wrapper"]} aria-label="Liste des outils">
        <div className={styles.tableHeading}>
          <div>
            <h1>Outils</h1>
            <p>Consultez et gérez les outils enregistrés.</p>
          </div>
          <span className={styles.totalCount}>
            {manipulation.tools.length} {manipulation.tools.length === 1 ? "outil" : "outils"}
          </span>
        </div>

        {manipulation.error ? (
          <p className={styles.messageError} role="alert">{manipulation.error}</p>
        ) : (
          <div className={styles.tableScroll}>
            <table>
              <thead>
                <tr>
                  <th className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      aria-label="Sélectionner tous les outils"
                      checked={manipulation.selectedIds.isAll}
                      onChange={toggleAllTools}
                    />
                  </th>
                  <th scope="col">Outil</th>
                  <th scope="col">Lien</th>
                  <th scope="col">Ajouté le</th>
                  <th scope="col">Statut</th>
                </tr>
              </thead>
              <tbody>
                {manipulation.isLoading ? (
                  <tr>
                    <td colSpan={5} className={styles.messageCell} role="status">
                      Chargement des outils…
                    </td>
                  </tr>
                ) : manipulation.tools.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.messageCell}>
                      Aucun outil à afficher.
                    </td>
                  </tr>
                ) : (
                  manipulation.tools.map((tool) => (
                    <ToolRow
                      key={tool.id}
                      tool={tool}
                      selected={ !manipulation.selectedIds.isAll && manipulation.selectedIds.ids.includes(tool.id) || manipulation.selectedIds.isAll }
                      onToggle={() => toggleTool(tool.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function ToolRow({
  tool,
  selected,
  onToggle,
}: {
  tool: Tables<"tool">
  selected: boolean
  onToggle: () => void
}) {
  const [toolName, setToolName] = useState(tool.name_tool)
  const [isNameEditing, setIsNameEditing] = useState(false)
  const hasNameChanged = toolName !== tool.name_tool
  const createdDate = new Date(tool.dateCreated)
  const validDate = !Number.isNaN(createdDate.getTime())
  const safeLink = getSafeExternalLink(tool.link_tool)
  const applyNameChange = () => undefined
  const nameFieldRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isNameEditing) nameFieldRef.current?.focus()
  }, [isNameEditing])

  function restoreToolName() {
    setToolName(tool.name_tool)
    setIsNameEditing(false)
  }

  return (
    <tr className={clsx(selected && styles.selectedRow)}>
      <td className={styles.checkboxCell}>
        <input
          type="checkbox"
          aria-label={`Sélectionner ${tool.name_tool}`}
          checked={selected}
          onChange={onToggle}
        />
      </td>
      <td>
        <div className={styles.toolName}>
          <span className={styles.toolIcon}>
            {tool.icon_tool ? (
              <ImageWrapper src={tool.icon_tool} alt="" isExternal />
            ) : (
              <WrenchIcon size={20} aria-hidden="true" />
            )}
          </span>
          <div
            className={styles.toolNameEditor}
            onClick={() => {
              if (!isNameEditing) setIsNameEditing(true)
            }}
          >
            <Field className={styles.nameField}>
              <Input
                aria-label={`Nom de l’outil ${tool.name_tool}`}
                ref={nameFieldRef}
                value={toolName}
                disabled={!isNameEditing}
                data-stored-value={tool.name_tool}
                onChange={(_, data) => setToolName(data.value)}
                onBlur={() => setIsNameEditing(false)}
                className={styles.nameInput}
              />
            </Field>
            {hasNameChanged && (
              <div className={styles.nameActions}>
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<CheckIcon size={17} />}
                  aria-label={`Appliquer le nouveau nom de ${tool.name_tool}`}
                  title="Appliquer"
                  onClick={applyNameChange}
                />
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<ArrowCounterClockwiseIcon size={17} />}
                  aria-label={`Annuler la modification du nom de ${tool.name_tool}`}
                  title="Annuler"
                  onClick={restoreToolName}
                />
              </div>
            )}
          </div>
        </div>
      </td>
      <td>
        {safeLink ? (
          <Tooltip content={`${tool.link_tool}`} relationship="label">
            <a className={styles.toolLink} href={safeLink} target="_blank" rel="noreferrer">
                {getLinkLabel(safeLink)}
                <ArrowSquareOutIcon size={14} aria-hidden="true" />
            </a>
          </Tooltip>
        ) : (
          <span className={styles.muted}>Aucun lien</span>
        )}
      </td>
      <td className={styles.dateCell}>
        {validDate
          ? createdDate.toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—"}
      </td>
      <td>
        <span
          className={clsx(
            styles.status,
            tool.status === 'Enabled' && styles.enable_status,
            tool.status === 'Desabled' && styles.desable_status,
            tool.status === 'Pending' && styles.pending_status,
          )}
        >
            <span>{tool.status} </span>
        </span>
      </td>
    </tr>
  )
}

function getSafeExternalLink(value: string | null): string | null {
  if (!value) return null

  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null
  } catch {
    return null
  }
}

function getLinkLabel(value: string): string {
  const url = new URL(value)
  return url.hostname.replace(/^www\./, "")
}
