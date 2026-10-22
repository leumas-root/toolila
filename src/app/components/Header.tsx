'use client'
import clsx from "clsx";
import Image from 'next/image'
import styles from "./Hero.module.scss";
import Link from "next/link";
import { Button } from "@fluentui/react-components";
import Logo from "./Logo";

export default function Header () {
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
                    <Button appearance="primary" icon={4} />
                </div>
            </div>
        </header>
    </>
}