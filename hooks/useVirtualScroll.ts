import { useState, useEffect, useRef, useCallback } from 'react';

export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export interface VirtualScrollResult {
  virtualItems: Array<{
    index: number;
    offsetTop: number;
  }>;
  totalHeight: number;
  scrollToIndex: (index: number) => void;
}

/**
 * Virtual scrolling hook for large lists
 * Renders only visible items for better performance
 */
export const useVirtualScroll = (
  itemCount: number,
  options: VirtualScrollOptions
): VirtualScrollResult => {
  const { itemHeight, containerHeight, overscan = 3 } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const scrollingRef = useRef<HTMLDivElement>(null);

  const totalHeight = itemHeight * itemCount;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const virtualItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push({
      index: i,
      offsetTop: i * itemHeight,
    });
  }

  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      if (scrollingRef.current) {
        const offset = index * itemHeight;
        scrollingRef.current.scrollTop = offset;
      }
    },
    [itemHeight]
  );

  useEffect(() => {
    const element = scrollingRef.current;
    if (!element) return;

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return {
    virtualItems,
    totalHeight,
    scrollToIndex,
  };
};

/**
 * Virtual grid for 2D scrolling
 */
export interface VirtualGridOptions {
  rowHeight: number;
  columnWidth: number;
  containerWidth: number;
  containerHeight: number;
  columnCount: number;
  overscan?: number;
}

export interface VirtualGridResult {
  virtualCells: Array<{
    rowIndex: number;
    columnIndex: number;
    index: number;
    top: number;
    left: number;
  }>;
  totalHeight: number;
  totalWidth: number;
  scrollToCell: (rowIndex: number, columnIndex: number) => void;
}

export const useVirtualGrid = (
  itemCount: number,
  options: VirtualGridOptions
): VirtualGridResult => {
  const {
    rowHeight,
    columnWidth,
    containerWidth,
    containerHeight,
    columnCount,
    overscan = 2,
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollingRef = useRef<HTMLDivElement>(null);

  const rowCount = Math.ceil(itemCount / columnCount);
  const totalHeight = rowHeight * rowCount;
  const totalWidth = columnWidth * columnCount;

  const visibleRowCount = Math.ceil(containerHeight / rowHeight);
  const visibleColumnCount = Math.ceil(containerWidth / columnWidth);

  const startRowIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endRowIndex = Math.min(
    rowCount - 1,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
  );

  const startColumnIndex = Math.max(0, Math.floor(scrollLeft / columnWidth) - overscan);
  const endColumnIndex = Math.min(
    columnCount - 1,
    Math.ceil((scrollLeft + containerWidth) / columnWidth) + overscan
  );

  const virtualCells = [];
  for (let rowIndex = startRowIndex; rowIndex <= endRowIndex; rowIndex++) {
    for (let columnIndex = startColumnIndex; columnIndex <= endColumnIndex; columnIndex++) {
      const index = rowIndex * columnCount + columnIndex;
      if (index < itemCount) {
        virtualCells.push({
          rowIndex,
          columnIndex,
          index,
          top: rowIndex * rowHeight,
          left: columnIndex * columnWidth,
        });
      }
    }
  }

  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
  }, []);

  const scrollToCell = useCallback(
    (rowIndex: number, columnIndex: number) => {
      if (scrollingRef.current) {
        scrollingRef.current.scrollTop = rowIndex * rowHeight;
        scrollingRef.current.scrollLeft = columnIndex * columnWidth;
      }
    },
    [rowHeight, columnWidth]
  );

  useEffect(() => {
    const element = scrollingRef.current;
    if (!element) return;

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return {
    virtualCells,
    totalHeight,
    totalWidth,
    scrollToCell,
  };
};
