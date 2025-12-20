import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { NavItems } from 'types'
import ClientOnly from './ClientOnly'
import CloseIcon from './CloseIcon'
import OriginalDrawer from './Drawer'

type NavigationDrawerProps = PropsWithChildren<{ items: NavItems }>

export default function NavigationDrawer({ children, items }: NavigationDrawerProps) {
  return (
    <OriginalDrawer.Drawer>
      <Wrapper>
        <ClientOnly>
          <OriginalDrawer.Target openClass="drawer-opened" closedClass="drawer-closed">
            <div className="my-drawer">
              <div className="my-drawer-container">
                <DrawerCloseButton />
                <NavItemsList items={items} />
              </div>
            </div>
          </OriginalDrawer.Target>
        </ClientOnly>
      </Wrapper>
      {children}
    </OriginalDrawer.Drawer>
  )
}

function NavItemsList({ items }: NavigationDrawerProps) {
  const { close } = OriginalDrawer.useDrawer()
  const router = useRouter()
  const [openGroups, setOpenGroups] = useState<Set<number>>(new Set())

  useEffect(() => {
    function handleRouteChangeComplete() {
      close()
    }

    router.events.on('routeChangeComplete', handleRouteChangeComplete)
    return () => router.events.off('routeChangeComplete', handleRouteChangeComplete)
  }, [close, router])

  const toggleGroup = (index: number) => {
    const newOpenGroups = new Set(openGroups)
    if (newOpenGroups.has(index)) {
      newOpenGroups.delete(index)
    } else {
      newOpenGroups.add(index)
    }
    setOpenGroups(newOpenGroups)
  }

  return (
    <ul>
      {items.map((item, idx) => {
        if ('items' in item) {
          const isOpen = openGroups.has(idx)
          return (
            <NavGroupItem key={idx}>
              <GroupHeader onClick={() => toggleGroup(idx)}>
                {item.title}
                <GroupArrow isOpen={isOpen}>▼</GroupArrow>
              </GroupHeader>
              {isOpen && (
                <GroupItems>
                  {item.items.map((subItem, subIdx) => (
                    <NavItem key={subIdx}>
                      <NextLink href={subItem.href}>{subItem.title}</NextLink>
                    </NavItem>
                  ))}
                </GroupItems>
              )}
            </NavGroupItem>
          )
        }
        return (
          <NavItem key={idx}>
            <NextLink href={item.href}>{item.title}</NextLink>
          </NavItem>
        )
      })}
    </ul>
  )
}

function DrawerCloseButton() {
  const ref = useRef(null)
  const a11yProps = OriginalDrawer.useA11yCloseButton(ref)

  return <CloseIcon className="close-icon" _ref={ref} {...a11yProps} />
}

const Wrapper = styled.div`
  .my-drawer {
    width: 100%;
    height: 100%;
    z-index: var(--z-drawer);
    background: rgb(var(--background));
    transition: margin-left 0.3s cubic-bezier(0.82, 0.085, 0.395, 0.895);
    overflow: hidden;
  }

  .my-drawer-container {
    position: relative;
    height: 100%;
    margin: auto;
    max-width: 70rem;
    padding: 0 1.2rem;
  }

  .close-icon {
    position: absolute;
    right: 2rem;
    top: 2rem;
  }

  .drawer-closed {
    margin-left: -100%;
  }

  .drawer-opened {
    margin-left: 0;
  }

  ul {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 0;
    margin: 0;
    list-style: none;

    & > *:not(:last-child) {
      margin-bottom: 3rem;
    }
  }
`

const NavItem = styled.li`
  a {
    font-size: 3rem;
    text-transform: uppercase;
    display: block;
    color: currentColor;
    text-decoration: none;
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    text-align: center;
  }
`

const NavGroupItem = styled.li`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const GroupHeader = styled.button`
  display: flex;
  align-items: center;
  gap: 1rem;
  background: transparent;
  border: none;
  color: currentColor;
  font-size: 3rem;
  text-transform: uppercase;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: background-color 0.2s;
  width: 100%;
  justify-content: center;

  &:hover {
    background-color: rgba(var(--primary), 0.1);
  }
`

const GroupArrow = styled.span<{ isOpen: boolean }>`
  font-size: 1.5rem;
  transition: transform 0.2s;
  transform: ${(p) => (p.isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
`

const GroupItems = styled.ul`
  list-style: none;
  padding: 0;
  margin: 1rem 0 0 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  & > *:not(:last-child) {
    margin-bottom: 1.5rem;
  }

  li a {
    font-size: 2rem;
    opacity: 0.9;
  }
`
