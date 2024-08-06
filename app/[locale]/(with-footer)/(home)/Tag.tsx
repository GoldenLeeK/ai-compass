'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export function TagItem({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex h-[38px] items-center justify-center gap-[2px] whitespace-nowrap rounded-full bg-[#2C2D36] px-3 text-xs'>
      {children}
    </div>
  );
}

export function TagLink({ name, href }: { name: string; href: string }) {
  return (
    <Link href={href} title={name}>
      <TagItem>{name}</TagItem>
    </Link>
  );
}

export function TagList({ data }: { data: { name: string; href: string; id: string }[] }) {
  const listRef = useRef<HTMLUListElement | null>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useEffect(() => {
    const checkScrollPosition = () => {
      if (listRef.current) {
        const { scrollLeft, clientWidth, scrollWidth } = listRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft + clientWidth < scrollWidth);
      }
    };

    const checkScrollable = () => {
      if (listRef.current) {
        const { scrollWidth, clientWidth } = listRef.current;
        setIsScrollable(scrollWidth > clientWidth);
      }
    };

    checkScrollable();
    checkScrollPosition();
    window.addEventListener('resize', checkScrollable);
    listRef.current?.addEventListener('scroll', checkScrollPosition);

    return () => {
      window.removeEventListener('resize', checkScrollable);
      listRef.current?.removeEventListener('scroll', checkScrollPosition);
    };
  }, []);

  const handleScrollLeft = () => {
    if (listRef.current) {
      listRef.current.scrollLeft -= 100; // Adjust the scroll distance as needed
    }
  };

  const handleScrollRight = () => {
    if (listRef.current) {
      listRef.current.scrollLeft += 100; // Adjust the scroll distance as needed
    }
  };

  return (
    <div className='relative flex items-center'>
      {isScrollable && showLeftArrow && (
        <button
          onClick={handleScrollLeft}
          type='button'
          className='absolute left-0 z-10 rounded bg-gray-200 p-2'
          style={{ left: '-2rem' }}
        >
          ⬅️
        </button>
      )}
      <ul ref={listRef} className='no-scrollbar flex max-w-full flex-1 items-center gap-3 overflow-x-auto'>
        {data.map((item) => (
          <li key={item.href}>
            <TagLink name={item.name} href={item.href} />
          </li>
        ))}
      </ul>
      {isScrollable && showRightArrow && (
        <button
          onClick={handleScrollRight}
          type='button'
          className='absolute right-0 z-10 rounded bg-gray-200 p-2'
          style={{ right: '-2rem' }}
        >
          ➡️
        </button>
      )}
    </div>
  );
}
