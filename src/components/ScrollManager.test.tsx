import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ScrollManager } from './ScrollManager';

// A tiny harness exposing buttons that drive navigation through the router, so
// the tests exercise real PUSH/POP navigation types around <ScrollManager />.
function Harness() {
  const navigate = useNavigate();
  return (
    <>
      <ScrollManager />
      <div id="about" />
      <button onClick={() => navigate('/page')}>push</button>
      <button onClick={() => navigate('/#about')}>push-about</button>
      <button onClick={() => navigate('/#missing')}>push-missing</button>
      <button onClick={() => navigate(-1)}>back</button>
    </>
  );
}

function renderHarness() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Harness />
    </MemoryRouter>,
  );
}

let scrollY = 0;

beforeEach(() => {
  scrollY = 0;
  // jsdom implements neither of these; mock them so the component can drive and
  // observe scrolling. scrollY is a getter so tests can simulate a scrolled page.
  Object.defineProperty(window, 'scrollY', { configurable: true, get: () => scrollY });
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ScrollManager', () => {
  it('scrolls to the top on a new navigation', () => {
    renderHarness();
    vi.mocked(window.scrollTo).mockClear(); // ignore the on-mount reset
    fireEvent.click(screen.getByText('push'));
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('scrolls a hash target into view on a new navigation', () => {
    renderHarness();
    fireEvent.click(screen.getByText('push-about'));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('falls back to the top when the hash target is missing', () => {
    renderHarness();
    vi.mocked(window.scrollTo).mockClear();
    fireEvent.click(screen.getByText('push-missing'));
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('re-scrolls to the same hash when navigated to twice', () => {
    renderHarness();
    fireEvent.click(screen.getByText('push-about'));
    fireEvent.click(screen.getByText('push-about'));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it('restores the saved offset on Back/Forward (POP)', () => {
    renderHarness();
    // User scrolls the initial entry; the live listener records the offset.
    scrollY = 500;
    fireEvent.scroll(window);
    // Away (PUSH) then back (POP) — the original entry's offset is restored.
    fireEvent.click(screen.getByText('push'));
    vi.mocked(window.scrollTo).mockClear();
    fireEvent.click(screen.getByText('back'));
    expect(window.scrollTo).toHaveBeenCalledWith(0, 500);
  });
});
