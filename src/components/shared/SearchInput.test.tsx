import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchInput } from './SearchInput';
import { createRef } from 'react';

describe('SearchInput', () => {
  describe('rendering', () => {
    it('renders input with value', () => {
      render(<SearchInput value="test query" onChange={() => {}} />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('test query');
    });

    it('renders with default placeholder', () => {
      render(<SearchInput value="" onChange={() => {}} />);

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(<SearchInput value="" onChange={() => {}} placeholder="Filter events..." />);

      expect(screen.getByPlaceholderText('Filter events...')).toBeInTheDocument();
    });

    it('renders search icon', () => {
      render(<SearchInput value="" onChange={() => {}} />);

      // Search icon should be hidden from accessibility tree
      const container = screen.getByRole('textbox').parentElement;
      expect(container?.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<SearchInput value="" onChange={() => {}} className="custom-class" />);

      const container = screen.getByRole('textbox').parentElement;
      expect(container).toHaveClass('custom-class');
    });

    it('uses provided id', () => {
      render(<SearchInput value="" onChange={() => {}} id="search-input" />);

      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'search-input');
    });
  });

  describe('clear button', () => {
    it('shows clear button when value is present', () => {
      render(<SearchInput value="test" onChange={() => {}} />);

      expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
    });

    it('hides clear button when value is empty', () => {
      render(<SearchInput value="" onChange={() => {}} />);

      expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
    });

    it('calls onChange with empty string when clear clicked', () => {
      const onChange = vi.fn();
      render(<SearchInput value="test" onChange={onChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));

      expect(onChange).toHaveBeenCalledWith('');
    });
  });

  describe('input interaction', () => {
    it('calls onChange when typing', () => {
      const onChange = vi.fn();
      render(<SearchInput value="" onChange={onChange} />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new value' } });

      expect(onChange).toHaveBeenCalledWith('new value');
    });

    it('supports autoFocus', () => {
      render(<SearchInput value="" onChange={() => {}} autoFocus />);

      expect(document.activeElement).toBe(screen.getByRole('textbox'));
    });
  });

  describe('accessibility', () => {
    it('uses aria-label from prop', () => {
      render(<SearchInput value="" onChange={() => {}} aria-label="Search events" />);

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Search events');
    });

    it('uses placeholder as aria-label fallback', () => {
      render(<SearchInput value="" onChange={() => {}} placeholder="Filter items" />);

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Filter items');
    });

    it('clear button has aria-label', () => {
      render(<SearchInput value="test" onChange={() => {}} />);

      const clearButton = screen.getByRole('button');
      expect(clearButton).toHaveAttribute('aria-label', 'Clear search');
    });

    it('clear button is type="button" to prevent form submission', () => {
      render(<SearchInput value="test" onChange={() => {}} />);

      const clearButton = screen.getByRole('button');
      expect(clearButton).toHaveAttribute('type', 'button');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = createRef<HTMLInputElement>();
      render(<SearchInput ref={ref} value="" onChange={() => {}} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current).toBe(screen.getByRole('textbox'));
    });

    it('allows focus via ref', () => {
      const ref = createRef<HTMLInputElement>();
      render(<SearchInput ref={ref} value="" onChange={() => {}} />);

      ref.current?.focus();

      expect(document.activeElement).toBe(screen.getByRole('textbox'));
    });
  });
});
