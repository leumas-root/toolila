'use client'
import clsx from "clsx";
import styles from "./Hero.module.scss";
import Link from "next/link";
import { Button } from "@fluentui/react-components";
import Logo from "./Logo";
import { UserCircleIcon } from "@phosphor-icons/react/dist/icons/UserCircle";
import { useSpaceStore } from "@/lib/store/space/store";

export default function Header () {
    const openSpace = useSpaceStore((state) => state.open);

    return <>
        <header className="doc-h">
            <div className={clsx('container box flexbox justify-between', clsx(styles.container))}>
                <Link href={''} className={clsx(styles['header-logo'])}>
                    <Logo 
                        className={styles.logo} 
                        withType
                    />
                </Link>
                
                <nav className="pages">
                    <Link href={''}></Link>
                    <Link href={''}></Link>
                    <Link href={''}></Link>
                    <Link href={''}></Link>
                </nav>

                <div className={clsx('nav-button')}>
                    <Button appearance="primary" size="large" icon={<UserCircleIcon size={20} />} onClick={openSpace}>Mon espace</Button>
                </div>
            </div>
        </header>
    </>
}