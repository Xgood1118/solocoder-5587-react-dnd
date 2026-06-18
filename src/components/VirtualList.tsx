import React, { useRef, useState, useCallback, useMemo, CSSProperties, ReactNode } from 'react';

interface VirtualListProps {
  items: string[];
  estimatedItemHeight?: number;
  overscan?: number;
  renderItem: (id: string, index: number, style: CSSProperties) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const VirtualList: React.FC<VirtualListProps> = ({
  items,
  estimatedItemHeight = 120,
  overscan = 5,
  renderItem,
  className = '',
  style,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const enableVirtual = items.length > 50;

  const totalHeight = useMemo(() => {
    return items.length * estimatedItemHeight;
  }, [items.length, estimatedItemHeight]);

  const { startIndex, endIndex, offsetY } = useMemo(() => {
    if (!enableVirtual) {
      return { startIndex: 0, endIndex: items.length, offsetY: 0 };
    }

    const safeScrollTop = Math.max(0, scrollTop);

    const start = Math.floor(safeScrollTop / estimatedItemHeight);
    const visibleCount = Math.ceil(containerHeight / estimatedItemHeight);

    const startIndex = Math.max(0, start - overscan);
    const endIndex = Math.min(items.length, start + visibleCount + overscan);
    const offsetY = startIndex * estimatedItemHeight;

    return { startIndex, endIndex, offsetY };
  }, [enableVirtual, scrollTop, containerHeight, estimatedItemHeight, overscan, items.length]);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const setRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      containerRef.current = node;
      setContainerHeight(node.clientHeight);
    }
  }, []);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex).map((id, idx) => {
      const actualIndex = startIndex + idx;
      const itemStyle: CSSProperties = enableVirtual
        ? {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: estimatedItemHeight,
            transform: `translateY(${actualIndex * estimatedItemHeight - offsetY}px)`,
          }
        : {};
      return renderItem(id, actualIndex, itemStyle);
    });
  }, [items, startIndex, endIndex, enableVirtual, estimatedItemHeight, offsetY, renderItem]);

  const contentStyle: CSSProperties = enableVirtual
    ? {
        transform: `translateY(${offsetY}px)`,
      }
    : {};

  return (
    <div
      ref={setRef}
      onScroll={handleScroll}
      className={`virtual-scroll-container ${className}`}
      style={style}
    >
      {enableVirtual && (
        <div
          className="virtual-scroll-phantom"
          style={{ height: totalHeight }}
        />
      )}
      <div
        className={enableVirtual ? 'virtual-scroll-content' : ''}
        style={contentStyle}
      >
        {visibleItems}
      </div>
    </div>
  );
};

export default VirtualList;
