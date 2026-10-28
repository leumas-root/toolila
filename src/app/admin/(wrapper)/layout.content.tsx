'use client'
import Logo from "@/app/components/Logo";
import {
    AppItem,
    Avatar,
    DrawerProps,
    NavDrawer,
    NavDrawerBody,
    NavItem,
} from "@fluentui/react-components";
import { UserIcon } from "@phosphor-icons/react";
import styles from "./page.module.scss";
import clsx from "clsx";
import { usePathname } from "next/navigation";


export function HeaderView({ user }: { user: string | null }) {
    

    return(<>
        <header className={clsx('pb-12')}>
            <Logo withType white className={styles.logo} />
        </header>
        <article>
            <div className={styles.user}>
                <Avatar size={48} icon={<UserIcon size={32} weight="bold" />} aria-label="Guest" />
                <div className={styles.description}>
                    <p className={clsx('display display-6 pb-2')}>Welcome admin!</p>
                    <p>{user}</p>
                </div>
            </div>
        </article>
    </>)
}

type DrawerType = Required<DrawerProps>['type']

export function Navigation({type, opened = true}:{type? : DrawerType, opened? : boolean}) {
    const pathname = usePathname();
    function vPath(x:string) {
        return `/admin/${x}`
    }
    
    return (
        <NavDrawer
            type="inline"
            
            selectedValue={clsx(
                pathname == vPath('dashbord') && 'overview',
                pathname == vPath('tools') && 'tools',
            )}
            aria-label="Navigation d’administration"
            {...(!opened ? {open : true} : {open:opened})}
        >
            <NavDrawerBody>
                <AppItem href="/admin/dashbord">Administration</AppItem>
                <NavItem 
                    href="/admin/dashbord" 
                    value={'overview'}
                >
                    Overview
                </NavItem>
                <NavItem 
                    href="/admin/tools" 
                    value={'tools'}
                >
                    Outils
                </NavItem>
            </NavDrawerBody>
        </NavDrawer>
    );
}