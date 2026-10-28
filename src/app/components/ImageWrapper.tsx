import clsx from 'clsx';
import Image, { ImageProps } from 'next/image'

interface ImageWrapperProps extends Pick<ImageProps, 'src' | 'alt'> {
    isExternal?: boolean;
    classNameWrapper?: string;
}

export default function ImageWrapper({isExternal, src, alt, classNameWrapper}:ImageWrapperProps){

    const imageOptimized = isExternal ? {unoptimized: true} : {unoptimized: false};

    return <>
        <div className={clsx('image-wrapper', classNameWrapper)}>
            <Image
                src={src}
                fill
                {...imageOptimized}
                alt={alt}
            />
        </div>
    </>
}