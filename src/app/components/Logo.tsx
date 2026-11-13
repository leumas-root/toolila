import Image from 'next/image'
import ImageWrapper from './ImageWrapper'
import clsx from 'clsx'

export default function Logo(
    {isText = false, withType = false, className, white = false, animation=false}
    :
    {isText? : boolean, withType? : boolean, className? : string, white? : boolean, animation? : boolean}
) {

    if (isText) return <span>Toolila</span>
    if (animation) return <object
            data="/logo-animation.svg"
            type="image/svg+xml"
            ></object>

    const type = clsx(withType && '+type')
    const color = clsx(white && '+white')
    
    return (<>
        <object
            data={`/logo${type}${color}.svg`}
            type="image/svg+xml"
            height={'50'}
            ></object>
    </>)
}