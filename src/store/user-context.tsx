import { Context, createContext, useEffect, useState } from 'react'
// import { useRouter } from 'next/router'
import { getCurrentUser } from '@/util/users'
import { User } from '@/src/types/user'
import { useSession } from 'next-auth/react'

interface UserContextType {
  user: User | any
  setUser: any
  triggerReloadUser: any
}

const UserContext: Context<UserContextType> = createContext({
  user: null,
  setUser: (u: User) => {},
  triggerReloadUser: () => {}
})

export function UserContextProvider (props: any): JSX.Element {
  // const router = useRouter()
  const { data, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [reloadUser, setReloadUser] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (data?.user == null) return setUser(null)
    let isCurrentRenderLoop = true
    void getCurrentUser().then(user => {
      if (isCurrentRenderLoop) setUser(user)
    })
    return () => {
      isCurrentRenderLoop = false
    }
  }, [data, data?.user, status, reloadUser])

  const context = {
    user,
    setUser: setUser as Function,
    triggerReloadUser: () => setReloadUser(!reloadUser)
  }

  return (
    <UserContext.Provider value={context}>
      {props.children}
    </UserContext.Provider>
  )
}

export default UserContext
