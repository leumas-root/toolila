import clsx from "clsx";
import styles from "./page.module.scss";
import { HeaderView, Navigation } from './layout.content';
import { requireAdmin } from "@/lib/admin";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const {} = await requireAdmin()

  return (<>
    <div 
      className={clsx(
        'px-5 lg-px-10 py-10',
        styles['top-side']
      )}
      >
        <HeaderView user={'@testadmin'} />
    </div>
    <div className={clsx('px-5 lg-px-10 lg-py-5', styles['bord-side'])}>
      <div className={styles['navbar-wrapper']}>
        <Navigation />
      </div>
      <div className={clsx(styles['view-wrapper'], 'px-3')}>
        {children}
      </div>
    </div>
  </>);
}