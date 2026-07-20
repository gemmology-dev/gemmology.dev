import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MineralCrystalViewer } from './MineralCrystalViewer';
import * as webgl from '../../lib/webgl';

// Crystal3DViewer pulls in @react-three/fiber/three, which needs a real WebGL
// context — stub it so these tests stay focused on MineralCrystalViewer's own
// wiring (SVG-default, WebGL gate, lazy parse).
vi.mock('../crystal/Crystal3DViewer', () => ({
  Crystal3DViewer: ({ gltfData }: { gltfData: object | null }) => (
    <div data-testid="crystal-3d-viewer">{gltfData ? 'rendered' : 'no-data'}</div>
  ),
}));

const VALID_GLTF = JSON.stringify({ buffers: [], accessors: [], bufferViews: [], meshes: [] });

describe('MineralCrystalViewer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the inline SVG by default and shows no toggle without a model', () => {
    vi.spyOn(webgl, 'isWebGLAvailable').mockReturnValue(true);
    render(
      <MineralCrystalViewer
        svgHtml="<svg><circle /></svg>"
        svgPath="/crystals/diamond.svg"
        gltfJson={null}
        name="Diamond"
      />
    );
    expect(screen.getByRole('img', { name: 'Diamond crystal structure' })).toBeInTheDocument();
    expect(screen.queryByText('3D WebGL')).not.toBeInTheDocument();
  });

  it('falls back to the file-based <img> when there is no inline SVG, with a guarded onerror', () => {
    render(
      <MineralCrystalViewer svgHtml="" svgPath="/crystals/missing.svg" gltfJson={null} name="Missing" />
    );
    const img = screen.getByAltText('Missing crystal structure') as HTMLImageElement;
    expect(img.src).toContain('/crystals/missing.svg');

    fireEvent.error(img);
    expect(img.onerror).toBeNull();
    expect(img.src).toContain('/crystals/placeholder.svg');

    // A second error (e.g. placeholder.svg itself 404ing) must not loop.
    fireEvent.error(img);
    expect(img.src).toContain('/crystals/placeholder.svg');
  });

  it('hides the toggle when a model exists but WebGL is unavailable', () => {
    vi.spyOn(webgl, 'isWebGLAvailable').mockReturnValue(false);
    render(
      <MineralCrystalViewer svgHtml="<svg />" svgPath="/crystals/x.svg" gltfJson={VALID_GLTF} name="X" />
    );
    expect(screen.queryByText('3D WebGL')).not.toBeInTheDocument();
  });

  it('shows the toggle and lazily parses the glTF only once switched to 3D', () => {
    vi.spyOn(webgl, 'isWebGLAvailable').mockReturnValue(true);
    vi.spyOn(webgl, 'prefersReducedMotion').mockReturnValue(false);
    render(
      <MineralCrystalViewer svgHtml="<svg />" svgPath="/crystals/x.svg" gltfJson={VALID_GLTF} name="X" />
    );

    expect(screen.queryByTestId('crystal-3d-viewer')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('3D WebGL'));
    expect(screen.getByTestId('crystal-3d-viewer')).toHaveTextContent('rendered');
  });

  it('falls back to 2D without crashing when the glTF JSON is invalid', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(webgl, 'isWebGLAvailable').mockReturnValue(true);
    render(
      <MineralCrystalViewer svgHtml="<svg />" svgPath="/crystals/x.svg" gltfJson="not json" name="Broken" />
    );

    fireEvent.click(screen.getByText('3D WebGL'));

    // Recovers to the 2D SVG rather than getting stuck on an empty 3D pane.
    expect(screen.getByRole('img', { name: 'Broken crystal structure' })).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  });
});
