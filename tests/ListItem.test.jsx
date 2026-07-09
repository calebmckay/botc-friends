import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../utils/test-utils.jsx'
import ListItem from '../src/components/ListItem'

describe('ListItem Join button', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('encodes special characters in the session name before opening the join URL', () => {
    const userStatus = {
      status: 'Playing',
      session: { name: 'Foo?' },
    }

    renderWithProviders(
      <ListItem listIndex={0} itemIndex={0} name="Alice" id={1} userStatus={userStatus} />
    )

    fireEvent.click(screen.getByText('Join'))

    expect(window.confirm).toHaveBeenCalledWith('Join session "Foo?"?')
    expect(window.open).toHaveBeenCalledWith('https://botc.app/join/Foo%3F', '_blank')
  })
})
