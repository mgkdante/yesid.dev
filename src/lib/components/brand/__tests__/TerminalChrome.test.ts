import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TerminalChromeTest from './TerminalChromeTest.svelte';

describe('TerminalChrome', () => {
  it('renders title', () => {
    render(TerminalChromeTest, { props: { title: 'terminal' } });
    expect(screen.getByText('terminal')).toBeTruthy();
  });

  it('renders body content', () => {
    render(TerminalChromeTest, { props: { title: 'test', bodyText: '$ whoami' } });
    expect(screen.getByText('$ whoami')).toBeTruthy();
  });

  it('renders tag when provided', () => {
    render(TerminalChromeTest, { props: { title: 'test', tag: 'v2.0' } });
    expect(screen.getByText('v2.0')).toBeTruthy();
  });

  it('renders status when provided', () => {
    render(TerminalChromeTest, { props: { title: 'test', status: 'connected' } });
    expect(screen.getByText('connected')).toBeTruthy();
  });

  it('renders footer items when provided', () => {
    const footer = [
      { label: 'ping', value: '12ms' },
      { label: 'uptime', value: '99.9%' },
    ];
    render(TerminalChromeTest, { props: { title: 'test', footer } });
    expect(screen.getByText('ping')).toBeTruthy();
    expect(screen.getByText('12ms')).toBeTruthy();
    expect(screen.getByText('uptime')).toBeTruthy();
    expect(screen.getByText('99.9%')).toBeTruthy();
  });

  it('does not render footer when not provided', () => {
    const { container } = render(TerminalChromeTest, { props: { title: 'test' } });
    expect(container.querySelector('.terminal-footer')).toBeNull();
  });

  it('has terminal wrapper structure', () => {
    const { container } = render(TerminalChromeTest, { props: { title: 'test' } });
    expect(container.querySelector('.terminal')).toBeTruthy();
    expect(container.querySelector('.terminal-titlebar')).toBeTruthy();
    expect(container.querySelector('.terminal-body')).toBeTruthy();
  });
});
