import Image from 'next/image'
import ImageWrapper from './ImageWrapper'

export default function Logo(
    {isText = false, withType = false, className}
    :
    {isText? : boolean, withType? : boolean, className? : string}
) {

    if (isText) return <span>Toolila</span>
    
    return (<>
        <ImageWrapper 
            src={!withType ? '/logo.svg' : '/logo+type.svg'}
            alt='Logo toolila'
            classNameWrapper={className}
        />
    </>)
}