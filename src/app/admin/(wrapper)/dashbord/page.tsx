'use client'

import { useState } from "react"
import clsx from "clsx"
import { CalendarCheckIcon, WrenchIcon } from "@phosphor-icons/react"
import ImageWrapper from "@/app/components/ImageWrapper"
import styles from "./page.module.scss"

interface StatistiqueTool {
  name_tool: string
  icon_tool: string | null
  dateCreated: string
}

interface StatistiqueValues {
  totalTools: number
  pendingTools: number
  recentlyAdded: {
    currentMonth: StatistiqueTool[]
    previousMonths: {
      label: string
      tools: StatistiqueTool[]
    }[]
  }
  users: {
    total: number
    active: number
  }
}

const toolNames = [
  "Analyse financière",
  "Suivi de portefeuille",
  "Calculateur de rendement",
  "Gestion des risques",
  "Comparateur de fonds",
  "Tableau de performance",
  "Simulateur d'investissement",
  "Veille des marchés",
  "Rapport trimestriel",
  "Évaluation ESG",
  "Planificateur budgétaire",
  "Convertisseur de devises",
  "Calendrier économique",
  "Analyse sectorielle",
  "Suivi des transactions",
  "Indice de volatilité",
  "Prévision de trésorerie",
  "Calcul des frais",
]

function createDefaultStatistics(): StatistiqueValues {
  const now = new Date()
  let nameIndex = 0

  function createTools(monthsAgo: number, count: number): StatistiqueTool[] {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)

    return Array.from({ length: count }, (_, index) => {
      const dateCreated = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        Math.min(index + 1, new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()),
      )

      return {
        name_tool: toolNames[nameIndex++],
        icon_tool: null,
        dateCreated: dateCreated.toISOString(),
      }
    })
  }

  const monthLabel = (monthsAgo: number) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
    const label = monthDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    return label.charAt(0).toLocaleUpperCase("fr-FR") + label.slice(1)
  }

  return {
    totalTools: 230,
    pendingTools: 25,
    recentlyAdded: {
      currentMonth: createTools(0, 6),
      previousMonths: [1, 2, 3].map((monthsAgo) => ({
        label: monthLabel(monthsAgo),
        tools: createTools(monthsAgo, 4),
      })),
    },
    users: {
      total: 124,
      active: 96,
    },
  }
}

function RecentToolItem({
  tool,
  showIcon = false,
  showDate = false,
}: {
  tool: StatistiqueTool
  showIcon?: boolean
  showDate?: boolean
}) {
  return (
    <li className={styles.toolItem}>
      {showIcon && (
        <span className={styles.toolIcon}>
          <ImageWrapper src={tool.icon_tool || '/logo.svg'} alt={tool.name_tool} isExternal />
        </span>
      )}
      <span className={styles.toolName}>{tool.name_tool}</span>
      {showDate && (
        <time className={styles.toolDate} dateTime={tool.dateCreated}>
          {new Date(tool.dateCreated).toLocaleDateString("fr-FR")}
        </time>
      )}
    </li>
  )
}

export default function Dashbord() {
  const [statistique] = useState<StatistiqueValues>(createDefaultStatistics)
  const nonActiveUsers = statistique.users.total - statistique.users.active
  const currentMonthLabel = new Date().toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  })
  const currentMonthTitle = currentMonthLabel.charAt(0).toLocaleUpperCase("fr-FR") + currentMonthLabel.slice(1)
  const currentMonthVisible = statistique.recentlyAdded.currentMonth.slice(0, 5)

  return (
    <div className={clsx(styles["view-container"])}>
      <div className="bloc size-full md-size-middle lg-size-third">
        <div className="box-container px-8 py-8">
          <p className="text text-5 row-label">Total des outils</p>
          <span className="display display-12 row-value value-unique">
            {statistique.totalTools}
          </span>
        </div>
      </div>

      <div className="bloc size-full md-size-middle lg-size-third">
        <div className="box-container px-8 py-8">
          <p className="text text-5 row-label">Outils en attente</p>
          <span className="display display-12 row-value value-unique">
            {statistique.pendingTools}
          </span>
        </div>
      </div>

      <div className="bloc size-full">
        <div className={clsx("box-container px-8 py-8", styles.recentTools)}>
          <section className={clsx(styles.monthSection, styles.monthCurrent)} aria-labelledby="current-month">
            <p className="text text-5 row-label pb-5">Récemment ajoutés</p>
            <div className={clsx('px-5 py-5')} >  
              <h2 id="current-month" className={clsx(styles.monthTitle, 'display display-8')}><CalendarCheckIcon size={32} weight="fill" /> {currentMonthTitle}</h2>
              <ul className={styles.toolList}>
                {currentMonthVisible.map((tool) => (
                  <RecentToolItem key={tool.name_tool} tool={tool} showIcon showDate />
                ))}
              </ul>
            </div>
          </section>

          {statistique.recentlyAdded.previousMonths.map((month) => (
              <section className={styles.monthSection} key={month.label}>
                <h2 className={styles.monthTitle}>{month.label}</h2>
                <ul className={styles.toolList}>
                  {month.tools.slice(0, 3).map((tool) => (
                    <RecentToolItem key={tool.name_tool} tool={tool} />
                  ))}
                </ul>
              </section>
            ))}
            
          {statistique.recentlyAdded.previousMonths.some((month) => month.tools.length > 3) && (
            <details className={styles.moreDetails}>
              <summary className={styles.seeMore}>Voir plus</summary>
              <div className={styles.previousMonths}>
                {statistique.recentlyAdded.previousMonths.map((month) => {
                  const moreTools = month.tools.slice(3)

                  return moreTools.length > 0 ? (
                    <section className={styles.monthSection} key={month.label}>
                      <h2 className={styles.monthTitle}>{month.label}</h2>
                      <ul className={styles.toolList}>
                        {moreTools.map((tool) => (
                          <RecentToolItem key={tool.name_tool} tool={tool} />
                        ))}
                      </ul>
                    </section>
                  ) : null
                })}
              </div>
            </details>
          )}
        </div>
      </div>

      <div className="bloc size-full md-size-middle lg-size-third">
        <div className="box-container px-8 py-8">
          <p className="text text-5 row-label">Total des utilisateurs</p>
          <span className="display display-12 row-value value-unique">
            {statistique.users.total}
          </span>
          <div className={styles.userBreakdown}>
            <p>
              Actifs <span>{statistique.users.active}</span>
            </p>
            <p>
              Non actifs <span>{nonActiveUsers}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
