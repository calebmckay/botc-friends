import { expect, test } from 'vitest'
import { renderWithProviders } from '../utils/test-utils.jsx'
import { screen } from '@testing-library/react'
import App from '../src/App'

test('renders title', async () => {
  renderWithProviders(<App />)

  expect(screen.getByText('BOTC Friends')).toBeInTheDocument()
})