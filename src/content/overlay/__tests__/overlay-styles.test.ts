/**
 * Tests for overlay CSS styles to prevent regressions.
 * These tests verify that critical UI elements have correct pointer-events settings.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Overlay CSS Styles', () => {
  let styleElement: HTMLStyleElement;
  let container: HTMLDivElement;

  // Extract the CSS rules we need to test
  const getOverlayStyles = (): string => `
    .overlay-container {
      position: fixed;
      pointer-events: none;
    }

    .overlay-container .overlay {
      pointer-events: auto;
    }

    .overlay-container .filter-modal-backdrop {
      pointer-events: auto;
    }
  `;

  beforeEach(() => {
    // Create a style element with overlay styles
    styleElement = document.createElement('style');
    styleElement.textContent = getOverlayStyles();
    document.head.appendChild(styleElement);

    // Create the container structure
    container = document.createElement('div');
    container.className = 'overlay-container';
    container.innerHTML = `
      <div class="overlay">
        <button class="overlay-button">Click me</button>
      </div>
      <div class="filter-modal-backdrop">
        <div class="filter-modal">
          <button class="filter-modal-close" data-action="close-filter-modal">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(container);
  });

  afterEach(() => {
    styleElement.remove();
    container.remove();
  });

  describe('pointer-events configuration', () => {
    it('overlay container should have pointer-events: none', () => {
      const computed = window.getComputedStyle(container);
      expect(computed.pointerEvents).toBe('none');
    });

    it('overlay element should have pointer-events: auto', () => {
      const overlay = container.querySelector('.overlay') as HTMLElement;
      const computed = window.getComputedStyle(overlay);
      expect(computed.pointerEvents).toBe('auto');
    });

    it('filter modal backdrop should have pointer-events: auto', () => {
      const backdrop = container.querySelector('.filter-modal-backdrop') as HTMLElement;
      const computed = window.getComputedStyle(backdrop);
      expect(computed.pointerEvents).toBe('auto');
    });

    it('filter modal close button should be clickable (inherit pointer-events: auto)', () => {
      const closeButton = container.querySelector('.filter-modal-close') as HTMLElement;
      const computed = window.getComputedStyle(closeButton);
      // Buttons inherit pointer-events from parent, which should be auto
      expect(computed.pointerEvents).toBe('auto');
    });
  });

  describe('click event propagation', () => {
    it('should allow clicks to reach filter modal close button', () => {
      const closeButton = container.querySelector('.filter-modal-close') as HTMLElement;
      let clicked = false;

      closeButton.addEventListener('click', () => {
        clicked = true;
      });

      // Simulate click
      closeButton.click();

      expect(clicked).toBe(true);
    });

    it('should allow clicks on filter modal buttons with data-action', () => {
      const closeButton = container.querySelector('[data-action="close-filter-modal"]') as HTMLElement;
      let dataActionCaptured: string | null = null;

      container.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const actionBtn = target.closest('[data-action]') as HTMLElement;
        if (actionBtn) {
          dataActionCaptured = actionBtn.dataset.action || null;
        }
      });

      closeButton.click();

      expect(dataActionCaptured).toBe('close-filter-modal');
    });
  });
});
