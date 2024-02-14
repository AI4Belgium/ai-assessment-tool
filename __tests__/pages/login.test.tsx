import { givenAUser, renderWithThemeAndTranslations, setupMongoDB } from '@/util/test-utils'
import userEvent from '@testing-library/user-event'
import Login from '@/pages/login'
// TODO test API routes
// https://seanconnolly.dev/unit-testing-nextjs-api-routes
// https://www.paigeniedringhaus.com/blog/how-to-unit-test-next-js-api-routes-with-typescript
// import { logRoles } from '@testing-library/dom'
import { screen } from '@testing-library/react'

// need to mock next-auth/react
// https://github.com/nextauthjs/next-auth/issues/775
// jest.mock('next-auth/react')
jest.mock('next/router', () => require('next-router-mock'))
// how to setup jest with next-i18next
// https://stackoverflow.com/questions/66973857/next-i18next-jest-testing-with-usetranslation
// jest.mock('react-i18next', () => ({
//   useTranslation: () => ({ t: (key: any) => key })
// }))

describe('Login page', () => {
  setupMongoDB()

  it('Allow to login', async () => {
    const mockLogin = jest.fn()
    const user = await givenAUser()
    await renderWithThemeAndTranslations(<Login onSubmit={mockLogin} />)
    const emailInput = screen.getByTestId(/email/i)
    await userEvent.type(emailInput, user.email)
    const passwordInput = screen.getByTestId(/password/i)
    await userEvent.type(passwordInput, user.password as string)
    const loginButton = screen.getByRole('button', { name: 'Log in' })
    expect(loginButton).not.toBeDisabled()
    await userEvent.click(loginButton)

    // ASSERT
    expect(mockLogin).toHaveBeenCalled()
    expect(mockLogin).toHaveBeenCalledTimes(1)
    expect(mockLogin).toHaveBeenCalledWith({ email: user.email, password: user.password, redirect: false })
  })
})
