import { alpha, Backdrop, CircularProgress, IconButton, makeStyles, Typography } from '@material-ui/core';
import { grey } from '@material-ui/core/colors';
import BrokenImageOutlinedIcon from '@material-ui/icons/BrokenImageOutlined';
import CloseOutlinedIcon from '@material-ui/icons/CloseOutlined';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import clsx from 'clsx';
import Carousel from 'commons/addons/elements/carousel/Carousel';
import useMyAPI from 'components/hooks/useMyAPI';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const XLSize = '8.5vh';
const LGSize = '10.5vh';
const MDSize = '15vh';
const textSpacing = '25px';

const useStyles = makeStyles(theme => ({
  container: {
    backgroundColor: alpha(grey[900], 0.8),
    backdropFilter: 'blur(1px)',
    height: '100vh',
    width: '100vw',
    zIndex: 3000
  },
  carousel: {
    height: '95vh',
    width: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexWrap: 'nowrap'
  },
  text: {
    display: 'flex',
    flex: `1 1 ${textSpacing}`,
    color: 'white',
    wordBreak: 'break-word'
  },
  title: {
    alignItems: 'flex-end'
  },
  description: {
    alignItems: 'flex-start'
  },
  image: {
    display: 'flex',
    flex: '0 1 auto',
    objectFit: 'contain',
    maxWidth: '100vw',

    '@media (min-height:0px)': {
      maxHeight: `calc(95vh - 2*${textSpacing})`
    },
    '@media (min-height:500px)': {
      maxHeight: `calc(95vh - ${MDSize} - 2*${textSpacing})`
    },
    '@media (min-height:720px)': {
      maxHeight: `calc(95vh - ${LGSize} - 2*${textSpacing})`
    },
    '@media (min-height:1080px)': {
      maxHeight: `calc(95vh - ${XLSize} - 2*${textSpacing})`
    }
  },
  thumbsSection: {
    '@media (min-height:0px)': {
      display: 'none'
    },
    '@media (min-height:500px)': {
      flex: '0 1 auto',
      flexWrap: 'nowrap',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100vw'
    }
  },
  thumbsSlide: {
    display: 'flex',
    flexWrap: 'nowrap',
    overflowX: 'hidden',
    overflowY: 'hidden',
    alignItems: 'center',
    gap: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2)
  },
  thumb: {
    cursor: 'pointer',
    objectFit: 'cover',
    '@media (min-height:500px)': {
      borderRadius: '3vh',
      height: MDSize,
      width: MDSize
    },
    '@media (min-height:720px)': {
      borderRadius: '2vh',
      height: LGSize,
      width: LGSize
    },
    '@media (min-height:1080px)': {
      borderRadius: '1vh',
      height: XLSize,
      width: XLSize
    }
  },
  unselectedThumb: {
    filter: `brightness(50%)`,
    transitionDuration: '150ms',
    transitions: {
      easing: {
        easeOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        sharp: 'linear'
      }
    },
    '&:hover': {
      filter: `brightness(90%)`,
      transitionDuration: '150ms',
      transitions: {
        easing: {
          easeOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
          sharp: 'linear'
        }
      }
    }
  },
  button: {
    cursor: 'pointer',
    backgroundColor: alpha(theme.palette.secondary.main, 0.1),
    color: 'white',
    margin: theme.spacing(2)
  },
  closeButton: {
    position: 'absolute',
    top: '0px',
    left: '0px'
  },
  beforeButton: {
    position: 'absolute',
    top: '50%',
    left: '0px',
    transform: 'translate(0%, -50%)'
  },
  nextButton: {
    position: 'absolute',
    top: '50%',
    right: '0px',
    transform: 'translate(0%, -50%)'
  },
  imageLoading: {
    display: 'grid',
    placeItems: 'center',
    borderRadius: theme.spacing(0.5),
    minHeight: theme.spacing(16),
    minWidth: theme.spacing(16)
  }
}));

export type CarouselContextProps = {
  carousel: boolean;
  index: number;
  images: Array<{
    name: string;
    description: string;
    imgSrc: string;
    thumbSrc: string;
  }>;
  setCarousel: (value: boolean) => void;
  openCarousel: (
    idx: number,
    imgs: Array<{
      name: string;
      description: string;
      imgSrc: string;
      thumbSrc: string;
    }>
  ) => void;
  closeCarousel: () => void;
  setIndex: (value: number) => void;
  setImages: (
    images: Array<{
      name: string;
      description: string;
      imgSrc: string;
      thumbSrc: string;
    }>
  ) => void;
};

export interface CarouselProviderProps {
  children: React.ReactNode;
}

export const CarouselContext = React.createContext<CarouselContextProps>(null);

function CarouselProvider(props: CarouselProviderProps) {
  const classes = useStyles();
  const { children } = props;
  const [carousel, setCarousel] = useState<boolean>(false);
  const [index, setIndex] = useState<number>(0);
  const [images, setImages] = useState<
    Array<{
      name: string;
      description: string;
      imgSrc: string;
      thumbSrc: string;
    }>
  >([]);
  const carouselItemsRef = useRef<HTMLDivElement[] | null[]>([]);

  const openCarousel = (idx, imgs) => {
    setIndex(idx);
    setImages(imgs);
    setCarousel(true);
  };

  const closeCarousel = () => {
    setCarousel(false);
    setIndex(0);
    setImages([]);
  };

  const handleSelectedImageChange = useCallback(
    (newIndex: number) => {
      if (images && images.length > 0) {
        setIndex(newIndex);
        if (carouselItemsRef?.current[newIndex]) {
          carouselItemsRef?.current[newIndex]?.scrollIntoView({
            inline: 'center',
            behavior: 'smooth'
          });
        }
      }
    },
    [images]
  );

  const onPreviousImage = useCallback(() => {
    if (images && images.length > 0) {
      let newIndex = index >= 1 ? index - 1 : images.length - 1;
      handleSelectedImageChange(newIndex);
    }
  }, [handleSelectedImageChange, images, index]);

  const onNextImage = useCallback(() => {
    if (images && images.length > 0) {
      let newIndex = index < images.length - 1 ? index + 1 : 0;
      handleSelectedImageChange(newIndex);
    }
  }, [handleSelectedImageChange, images, index]);

  useEffect(() => {
    if (images && images[index]) {
      carouselItemsRef.current = carouselItemsRef.current.slice(0, images.length);
      handleSelectedImageChange(index);
    }
  }, [index, images, handleSelectedImageChange]);

  return (
    <CarouselContext.Provider
      value={{
        carousel,
        index,
        images,
        setCarousel,
        openCarousel,
        closeCarousel,
        setIndex,
        setImages
      }}
    >
      {useMemo(
        () => (
          <>{children}</>
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [children]
      )}

      {useMemo(() => {
        return (
          carousel &&
          images.length && (
            <Backdrop className={clsx(classes.container)} open>
              <Carousel enableSwipe onNext={onNextImage} onPrevious={onPreviousImage}>
                <div id="carousel-image" className={classes.carousel}>
                  <Typography className={clsx(classes.text, classes.title)} variant="body1" noWrap>
                    {images[index].name}
                  </Typography>
                  <Image className={classes.image} alt={images[index].name} src={images[index].imgSrc} />
                  <Typography className={clsx(classes.text, classes.description)} variant="body1" noWrap>
                    {images[index].description}
                  </Typography>
                  <div className={classes.thumbsSection}>
                    <div className={classes.thumbsSlide}>
                      {images.map((element, i) => {
                        return index === i ? (
                          <Image
                            key={'thumb-' + i}
                            className={clsx(classes.thumb)}
                            alt={element.name}
                            src={element.thumbSrc}
                            onClick={() => {
                              handleSelectedImageChange(i);
                            }}
                            onRef={el => (carouselItemsRef.current[i] = el)}
                          />
                        ) : (
                          <Image
                            key={'thumb-' + i}
                            className={clsx(classes.thumb, classes.unselectedThumb)}
                            alt={element.name}
                            src={element.thumbSrc}
                            onClick={() => {
                              handleSelectedImageChange(i);
                            }}
                            onRef={el => (carouselItemsRef.current[i] = el)}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                <IconButton className={clsx(classes.button, classes.closeButton)} onClick={closeCarousel}>
                  <CloseOutlinedIcon />
                </IconButton>

                <IconButton className={clsx(classes.button, classes.beforeButton)} onClick={onPreviousImage}>
                  <NavigateBeforeIcon />
                </IconButton>

                <IconButton className={clsx(classes.button, classes.nextButton)} onClick={onNextImage}>
                  <NavigateNextIcon />
                </IconButton>
              </Carousel>
            </Backdrop>
          )
        );
      }, [carousel, classes, handleSelectedImageChange, images, index, onNextImage, onPreviousImage])}
    </CarouselContext.Provider>
  );
}

export default CarouselProvider;

type ImageProps = {
  id?: string;
  className?: string;
  alt: string;
  src: string;
  onClick?: () => void;
  onRef?: (el: HTMLDivElement) => void;
};

const Image = ({ id, className, alt, src, onClick, onRef }: ImageProps) => {
  const [image, setImage] = useState<string>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const classes = useStyles();
  const apiCall = useMyAPI();

  useEffect(() => {
    apiCall({
      url: `/api/v4/file/image/${src}/`,
      allowCache: true,
      onSuccess: api_data => {
        setLoading(false);
        setImage(api_data.api_response);
      },
      onFailure: api_data => {
        setLoading(false);
        setImage(null);
      }
    });
  }, [alt, src, apiCall, image, loading]);

  return (
    <>
      {image ? (
        <img id={id} className={className} src={image} alt={alt} onClick={onClick} ref={onRef} />
      ) : (
        <div className={classes.imageLoading}>{loading ? <CircularProgress /> : <BrokenImageOutlinedIcon />}</div>
      )}
    </>
  );
};
