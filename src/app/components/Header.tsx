'use client'
import clsx from "clsx";
import Image from 'next/image'
import styles from "./Hero.module.scss";
import Link from "next/link";
import { Button } from "@fluentui/react-components";

export default function Header () {
    return <>
        <header className="doc-h">
            <div className={clsx('container box flexbox justify-between', clsx(styles.container))}>
                <Link href={''} className={clsx(styles['header-logo'])}>
                    <div className={styles.logo}>
                        <Image
                            src={'/logo+type.svg'}
                            fill
                            alt=""
                        />
                    </div>
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