import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Placeholder } from './Placeholder';

describe('Placeholder', () => {
  it('renders the scaffold heading', () => {
    render(<Placeholder />);
    expect(screen.getByRole('heading', { name: /scaffold/i })).toBeInTheDocument();
  });
});
