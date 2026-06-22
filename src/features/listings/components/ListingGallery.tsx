import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ListingGalleryProps {
  images: string[];
  title: string;
  activeImage: string;
  setActiveImage: (image: string) => void;
  isGalleryOpen: boolean;
  setIsGalleryOpen: (open: boolean) => void;
  handleClose: () => void;
}

export const ListingGallery: React.FC<ListingGalleryProps> = ({
  images,
  title,
  activeImage,
  setActiveImage,
  setIsGalleryOpen,
  handleClose,
}) => {
  if (!images || images.length === 0) return null;

  return (
    <>
      {/* Desktop Bento Box */}
      <div className="relative mt-2 mb-6 hidden h-[50vh] max-h-[600px] min-h-[400px] gap-2 px-4 sm:px-6 md:grid md:grid-cols-4 md:grid-rows-2 lg:px-8">
        <div
          className="group relative col-span-2 row-span-2 cursor-pointer overflow-hidden bg-gray-100"
          onClick={() => setIsGalleryOpen(true)}
        >
          <img
            src={images[0]}
            alt={title}
            loading="eager"
            className="h-full w-full rounded-l-2xl object-cover transition-opacity duration-300 hover:opacity-90"
          />
        </div>
        {images.slice(1, 5).map((img, idx) => {
          const isTopRight = idx === 1;
          const isBottomRight = idx === 3;
          return (
            <div
              key={idx}
              className="group relative cursor-pointer overflow-hidden bg-gray-100"
              onClick={() => setIsGalleryOpen(true)}
            >
              <img
                src={img}
                alt={`Gallery ${idx + 1}`}
                loading="lazy"
                decoding="async"
                className={cn(
                  'h-full w-full object-cover transition-opacity duration-300 hover:opacity-90',
                  isTopRight && 'rounded-tr-2xl',
                  isBottomRight && 'rounded-br-2xl'
                )}
              />
              {isBottomRight && (
                <button
                  className="absolute right-4 bottom-4 z-10 flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-md transition-colors hover:bg-gray-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsGalleryOpen(true);
                  }}
                >
                  <ImageIcon className="h-4 w-4" />
                  Ver recorrido visual
                </button>
              )}
            </div>
          );
        })}
        {images.length < 5 &&
          Array.from({ length: 4 - (images.length - 1) }).map((_, i) => {
            const isBottomRight = i === 4 - (images.length - 1) - 1;
            return (
              <div key={`empty-${i}`} className="relative flex items-center justify-center bg-gray-50">
                <ImageIcon className="h-8 w-8 text-gray-200" />
                {isBottomRight && (
                  <button
                    className="absolute right-4 bottom-4 z-10 flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-md transition-colors hover:bg-gray-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsGalleryOpen(true);
                    }}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Ver recorrido visual
                  </button>
                )}
              </div>
            );
          })}
      </div>

      {/* Mobile swipeable gallery */}
      <div className="relative h-[400px] w-full md:hidden">
        {/* Floating Back Button for Mobile */}
        <button
          onClick={handleClose}
          className="absolute left-4 top-4 z-70 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-transform active:scale-90"
        >
          <ArrowLeft className="h-5 w-5 text-brand-navy" />
        </button>
        <motion.div
          className="flex h-full w-full"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            const swipe = info.offset.x;
            if (swipe < -50) {
              const currentIndex = images.indexOf(activeImage);
              if (currentIndex < images.length - 1) {
                setActiveImage(images[currentIndex + 1]);
              }
            } else if (swipe > 50) {
              const currentIndex = images.indexOf(activeImage);
              if (currentIndex > 0) {
                setActiveImage(images[currentIndex - 1]);
              }
            }
          }}
          onClick={() => setIsGalleryOpen(true)}
        >
          <img
            src={activeImage || images[0]}
            alt={title}
            className="h-full w-full cursor-pointer object-cover select-none"
          />
        </motion.div>

        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 md:hidden">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={cn(
                'h-1.5 w-1.5 rounded-full transition-all',
                img === activeImage ? 'bg-brand-500 w-4' : 'bg-white/50'
              )}
            />
          ))}
        </div>

        <button
          className="absolute right-4 bottom-4 flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-md transition-colors hover:bg-gray-50"
          onClick={(e) => {
            e.stopPropagation();
            setIsGalleryOpen(true);
          }}
        >
          <ImageIcon className="h-3 w-3" />1 / {images.length}
        </button>
      </div>
    </>
  );
};

export default ListingGallery;
