import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button component', () => {
  it('renders with given text', () => {
    // Arrange & Act
    render(<Button>Click me</Button>);
    // Assert
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
}); 