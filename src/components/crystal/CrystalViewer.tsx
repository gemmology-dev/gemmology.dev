import { useState, useCallback, useRef, useEffect } from 'react';
import { ViewControls } from './ViewControls';
import { clsx } from 'clsx';

interface CrystalViewerProps {
  svgContent: string;
  initialElevation?: number;
  initialAzimuth?: number;
  showControls?: boolean;
  showGrid?: boolean;
  className?: string;
  onViewChange?: (elevation: number, azimuth: number) => void;
}

export function CrystalViewer({
  svgContent,
  initialElevation = 30,
  initialAzimuth = -45,
  showControls = true,
  showGrid = true,
  className,
  onViewChange,
}: CrystalViewerProps) {
  const [elevation, setElevation] = useState(initialElevation);
  const [azimuth, setAzimuth] = useState(initialAzimuth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handleViewChange = useCallback(
    (newElevation: number, newAzimuth: number) => {
      setElevation(newElevation);
      setAzimuth(newAzimuth);
      onViewChange?.(newElevation, newAzimuth);
    },
    [onViewChange]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;

      const newAzimuth = azimuth + deltaX * 0.5;
      const newElevation = Math.max(-90, Math.min(90, elevation - deltaY * 0.5));

      handleViewChange(newElevation, newAzimuth);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    },
    [isDragging, azimuth, elevation, handleViewChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => setIsDragging(false);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging]);

  // Apply CSS transform based on elevation and azimuth
  const transformStyle = {
    transform: `perspective(800px) rotateX(${-elevation}deg) rotateY(${azimuth}deg)`,
    transformStyle: 'preserve-3d' as const,
  };

  return (
    <div className={clsx('relative', className)}>
      <div
        ref={containerRef}
        className={clsx(
          'crystal-svg-container aspect-square cursor-grab',
          isDragging && 'cursor-grabbing',
          showGrid && 'bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] bg-[size:20px_20px]'
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="w-full h-full flex items-center justify-center"
          style={transformStyle}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>

      {showControls && (
        <ViewControls
          elevation={elevation}
          azimuth={azimuth}
          onElevationChange={(e) => handleViewChange(e, azimuth)}
          onAzimuthChange={(a) => handleViewChange(elevation, a)}
          onReset={() => handleViewChange(30, -45)}
        />
      )}
    </div>
  );
}
