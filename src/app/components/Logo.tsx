import Image from 'next/image'
import ImageWrapper from './ImageWrapper'
import clsx from 'clsx'

export default function Logo(
    {isText = false, withType = false, className, white = false}
    :
    {isText? : boolean, withType? : boolean, className? : string, white? : boolean}
) {

    if (isText) return <span>Toolila</span>

    const type = clsx(withType && '+type')
    const color = clsx(white && '+white')
    
    return (<>
        <ImageWrapper 
            src={`/logo${type}${color}.svg`}
            alt='Logo toolila'
            classNameWrapper={className}
        />
    </>)
}