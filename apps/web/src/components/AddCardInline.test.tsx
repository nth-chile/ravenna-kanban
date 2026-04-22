import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test/utils.js';
import { AddCardInline } from './AddCardInline.js';

describe('AddCardInline', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('disables submit until a non-empty title is entered, then posts to /api/cards', async () => {
    const mockFetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            id: 'new-card',
            columnId: 'col-a',
            title: 'Real title',
            description: '',
            position: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        ),
    );
    vi.stubGlobal('fetch', mockFetch);

    const user = userEvent.setup();
    renderWithProviders(<AddCardInline columnId="col-a" />);

    // Collapsed state: clicking "Add card" reveals the form.
    await user.click(screen.getByRole('button', { name: /add card/i }));

    const input = await screen.findByPlaceholderText('Card title');
    const submit = screen.getByRole('button', { name: /^add$/i });

    // Initially disabled with no input.
    expect(submit).toBeDisabled();

    // Whitespace-only is still disabled.
    await user.type(input, '   ');
    expect(submit).toBeDisabled();

    // Real title enables the button.
    await user.clear(input);
    await user.type(input, 'Real title');
    expect(submit).toBeEnabled();

    // Submitting posts to /api/cards with the expected body.
    await user.click(submit);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const [url, init] = mockFetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/cards');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      columnId: 'col-a',
      title: 'Real title',
    });
  });
});
