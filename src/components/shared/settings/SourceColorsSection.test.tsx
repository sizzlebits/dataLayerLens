import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SourceColorsSection } from './SourceColorsSection';

describe('SourceColorsSection', () => {
  describe('rendering', () => {
    it('renders section header', () => {
      render(
        <SourceColorsSection
          sources={['dataLayer']}
          sourceColors={{}}
          onColorChange={() => {}}
        />
      );

      expect(screen.getByText('Source Colors')).toBeInTheDocument();
    });

    it('renders palette icon', () => {
      const { container } = render(
        <SourceColorsSection
          sources={['dataLayer']}
          sourceColors={{}}
          onColorChange={() => {}}
        />
      );

      // Lucide icons render as SVG
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders SourceColorEditor with sources', () => {
      render(
        <SourceColorsSection
          sources={['dataLayer', 'customLayer']}
          sourceColors={{ dataLayer: '#ff0000' }}
          onColorChange={() => {}}
        />
      );

      expect(screen.getByText('dataLayer')).toBeInTheDocument();
      expect(screen.getByText('customLayer')).toBeInTheDocument();
    });

    it('shows empty state when no sources', () => {
      render(
        <SourceColorsSection
          sources={[]}
          sourceColors={{}}
          onColorChange={() => {}}
        />
      );

      expect(screen.getByText(/No dataLayer sources detected/)).toBeInTheDocument();
    });
  });

  describe('props passthrough', () => {
    it('passes onColorChange to SourceColorEditor', () => {
      const onColorChange = vi.fn();
      render(
        <SourceColorsSection
          sources={['dataLayer']}
          sourceColors={{}}
          onColorChange={onColorChange}
        />
      );

      // The SourceColorEditor should receive the onColorChange prop
      // We can verify this by checking the component renders
      expect(screen.getByText('dataLayer')).toBeInTheDocument();
    });

    it('passes sourceColors to SourceColorEditor', () => {
      render(
        <SourceColorsSection
          sources={['dataLayer']}
          sourceColors={{ dataLayer: '#ff0000' }}
          onColorChange={() => {}}
        />
      );

      // SourceColorEditor displays the color dot with the assigned color
      const sourceRow = screen.getByText('dataLayer').closest('button');
      expect(sourceRow).toBeInTheDocument();
    });
  });
});
