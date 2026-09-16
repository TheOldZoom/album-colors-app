'use client';

import {useCallback, useEffect, useRef, useState} from 'react';

const DRAG_THRESHOLD = 5;

export default function Draggable({
  rootClass = '',
  children,
}: {
  rootClass: string;
  children: React.ReactNode;
}) {
  const ourRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const dragState = useRef({
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  const endDrag = useCallback(() => setIsDragging(false), []);

  const handlePointerMove = useCallback((clientX: number) => {
    const slider = ourRef.current;
    if (!slider) return;

    const x = clientX - slider.offsetLeft;
    const delta = x - dragState.current.startX;

    if (!dragState.current.moved && Math.abs(delta) > DRAG_THRESHOLD) {
      dragState.current.moved = true;
    }

    if (dragState.current.moved) {
      slider.scrollLeft = dragState.current.scrollLeft - delta;
    }
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.pageX);
    const onTouchMove = (e: TouchEvent) =>
      handlePointerMove(e.touches[0].pageX);
    const onMouseUp = () => endDrag();
    const onTouchEnd = () => endDrag();
    const onBlur = () => endDrag();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('blur', onBlur);
    };
  }, [isDragging, handlePointerMove, endDrag]);

  const startDrag = (clientX: number) => {
    const slider = ourRef.current;
    if (!slider) return;
    dragState.current = {
      startX: clientX - slider.offsetLeft,
      scrollLeft: slider.scrollLeft,
      moved: false,
    };
    setIsDragging(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    startDrag(e.pageX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startDrag(e.touches[0].pageX);
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (dragState.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      ref={ourRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClickCapture={handleClickCapture}
      onDragStart={e => e.preventDefault()}
      className={
        rootClass +
        ` mt-16 lg:mt-[104px] flex overflow-x-scroll select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`
      }
    >
      {children}
    </div>
  );
}
