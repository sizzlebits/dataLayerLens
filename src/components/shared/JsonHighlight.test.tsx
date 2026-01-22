import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JsonHighlight } from './JsonHighlight';

describe('JsonHighlight', () => {
  describe('primitive values', () => {
    it('renders null', () => {
      render(<JsonHighlight data={null} />);
      expect(screen.getByText('null')).toBeInTheDocument();
    });

    it('renders boolean true', () => {
      render(<JsonHighlight data={true} />);
      expect(screen.getByText('true')).toBeInTheDocument();
    });

    it('renders boolean false', () => {
      render(<JsonHighlight data={false} />);
      expect(screen.getByText('false')).toBeInTheDocument();
    });

    it('renders numbers', () => {
      render(<JsonHighlight data={42} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders decimal numbers', () => {
      render(<JsonHighlight data={3.14} />);
      expect(screen.getByText('3.14')).toBeInTheDocument();
    });

    it('renders strings with quotes', () => {
      render(<JsonHighlight data="hello" />);
      expect(screen.getByText('"hello"')).toBeInTheDocument();
    });

    it('renders empty string', () => {
      render(<JsonHighlight data="" />);
      expect(screen.getByText('""')).toBeInTheDocument();
    });
  });

  describe('arrays', () => {
    it('renders empty array', () => {
      render(<JsonHighlight data={[]} />);
      expect(screen.getByText('[]')).toBeInTheDocument();
    });

    it('renders array with values', () => {
      render(<JsonHighlight data={[1, 2, 3]} />);
      expect(screen.getByText('[')).toBeInTheDocument();
      expect(screen.getByText(']')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renders array with mixed types', () => {
      render(<JsonHighlight data={[1, 'two', true, null]} />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('"two"')).toBeInTheDocument();
      expect(screen.getByText('true')).toBeInTheDocument();
      expect(screen.getByText('null')).toBeInTheDocument();
    });

    it('renders nested arrays', () => {
      render(<JsonHighlight data={[[1, 2], [3, 4]]} />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('objects', () => {
    it('renders empty object', () => {
      render(<JsonHighlight data={{}} />);
      expect(screen.getByText('{}')).toBeInTheDocument();
    });

    it('renders object with string value', () => {
      render(<JsonHighlight data={{ name: 'test' }} />);
      expect(screen.getByText('"name"')).toBeInTheDocument();
      expect(screen.getByText('"test"')).toBeInTheDocument();
    });

    it('renders object with multiple properties', () => {
      render(<JsonHighlight data={{ a: 1, b: 2, c: 3 }} />);
      expect(screen.getByText('"a"')).toBeInTheDocument();
      expect(screen.getByText('"b"')).toBeInTheDocument();
      expect(screen.getByText('"c"')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renders nested objects', () => {
      render(
        <JsonHighlight
          data={{
            outer: {
              inner: 'value',
            },
          }}
        />
      );
      expect(screen.getByText('"outer"')).toBeInTheDocument();
      expect(screen.getByText('"inner"')).toBeInTheDocument();
      expect(screen.getByText('"value"')).toBeInTheDocument();
    });

    it('renders object with array value', () => {
      render(
        <JsonHighlight
          data={{
            items: [1, 2, 3],
          }}
        />
      );
      expect(screen.getByText('"items"')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('complex data structures', () => {
    it('renders typical dataLayer event data', () => {
      const eventData = {
        event: 'page_view',
        page_title: 'Home',
        page_location: 'https://example.com',
        user: {
          logged_in: true,
          id: '12345',
        },
      };

      render(<JsonHighlight data={eventData} />);

      expect(screen.getByText('"event"')).toBeInTheDocument();
      expect(screen.getByText('"page_view"')).toBeInTheDocument();
      expect(screen.getByText('"page_title"')).toBeInTheDocument();
      expect(screen.getByText('"Home"')).toBeInTheDocument();
      expect(screen.getByText('"user"')).toBeInTheDocument();
      expect(screen.getByText('"logged_in"')).toBeInTheDocument();
      expect(screen.getByText('true')).toBeInTheDocument();
    });

    it('renders ecommerce data structure', () => {
      const ecommerceData = {
        event: 'purchase',
        ecommerce: {
          transaction_id: 'T123',
          value: 99.99,
          items: [
            { item_id: 'SKU1', item_name: 'Product 1', price: 49.99 },
            { item_id: 'SKU2', item_name: 'Product 2', price: 50.0 },
          ],
        },
      };

      render(<JsonHighlight data={ecommerceData} />);

      expect(screen.getByText('"transaction_id"')).toBeInTheDocument();
      expect(screen.getByText('"T123"')).toBeInTheDocument();
      expect(screen.getByText('99.99')).toBeInTheDocument();
      expect(screen.getByText('"items"')).toBeInTheDocument();
      expect(screen.getByText('"SKU1"')).toBeInTheDocument();
      expect(screen.getByText('"SKU2"')).toBeInTheDocument();
    });
  });

  describe('fallback rendering', () => {
    it('renders undefined as string', () => {
      render(<JsonHighlight data={undefined} />);
      expect(screen.getByText('undefined')).toBeInTheDocument();
    });

    it('renders functions as string representation', () => {
      const fn = () => {};
      render(<JsonHighlight data={fn} />);
      // Functions are converted to string
      expect(screen.getByText(/function|=>/)).toBeInTheDocument();
    });
  });
});
