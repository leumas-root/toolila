'use client'
import clsx from "clsx";
import Image from 'next/image'
import styles from "./Hero.module.scss";
import Link from "next/link";
import { Button } from "@fluentui/react-components";

export default function Hero() {
    const featureTags = ['Fast setup', 'Built for growth', 'No-code workflow'];

    return <>
        <Header />
        <div className="hero">
            <div className="container" style={{ maxWidth: 960, margin: '0 auto', padding: '80px 24px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                    {featureTags.map((tag) => (
                        <span
                            key={tag}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '8px 12px',
                                borderRadius: 999,
                                background: '#eef2ff',
                                color: '#3730a3',
                                fontSize: 13,
                                fontWeight: 600,
                            }}
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <h1 style={{ margin: 0, fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1.1, maxWidth: 680 }}>
                    Launch your next big idea with clarity and speed.
                </h1>

                <p style={{ margin: '20px 0 0', maxWidth: 620, fontSize: 18, lineHeight: 1.7, color: '#4b5563' }}>
                    Build polished experiences, move faster with your team, and turn customer feedback into product decisions that actually stick.
                </p>

                <div style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap' }}>
                    <Button appearance="primary" size={'large'}>Get started</Button>
                    <Button appearance="secondary" size={'large'}>View demo</Button>
                </div>
            </div>
        </div>
    </>
}

function Header () {
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