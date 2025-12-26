import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useAuthContext } from 'contexts/auth.context';
import { useNewsletterModalContext } from 'contexts/newsletter-modal.context';
import { ScrollPositionEffectProps, useScrollPosition } from 'hooks/useScrollPosition';
import { type NavGroup, NavItems, SingleNavItem } from 'types';
import { media } from 'utils/media';
import Button from './Button';
import Container from './Container';
import Drawer from './Drawer';
import { HamburgerIcon } from './HamburgerIcon';
import Logo from './Logo';

const ColorSwitcher = dynamic(() => import('../components/ColorSwitcher'), { ssr: false });

type NavbarProps = { items: NavItems };
type ScrollingDirections = 'up' | 'down' | 'none';
type NavbarContainerProps = { hidden: boolean; transparent: boolean };

export default function Navbar({ items }: NavbarProps) {
  const router = useRouter();
  const { toggle } = Drawer.useDrawer();
  const { isAuthenticated, logout } = useAuthContext();
  const [scrollingDirection, setScrollingDirection] = useState<ScrollingDirections>('none');

  let lastScrollY = useRef(0);
  const lastRoute = useRef('');
  const stepSize = useRef(50);

  useScrollPosition(scrollPositionCallback, [router.asPath], undefined, undefined, 50);

  function scrollPositionCallback({ currPos }: ScrollPositionEffectProps) {
    const routerPath = router.asPath;
    const hasRouteChanged = routerPath !== lastRoute.current;

    if (hasRouteChanged) {
      lastRoute.current = routerPath;
      setScrollingDirection('none');
      return;
    }

    const currentScrollY = currPos.y;
    const isScrollingUp = currentScrollY > lastScrollY.current;
    const scrollDifference = Math.abs(lastScrollY.current - currentScrollY);
    const hasScrolledWholeStep = scrollDifference >= stepSize.current;
    const isInNonCollapsibleArea = lastScrollY.current > -50;

    if (isInNonCollapsibleArea) {
      setScrollingDirection('none');
      lastScrollY.current = currentScrollY;
      return;
    }

    if (!hasScrolledWholeStep) {
      lastScrollY.current = currentScrollY;
      return;
    }

    setScrollingDirection(isScrollingUp ? 'up' : 'down');
    lastScrollY.current = currentScrollY;
  }

  const isNavbarHidden = scrollingDirection === 'down';
  const isTransparent = scrollingDirection === 'none';

  return (
    <NavbarContainer hidden={isNavbarHidden} transparent={isTransparent}>
      <Content>
        <NextLink href="/" passHref>
          <LogoWrapper>
            <Logo />
          </LogoWrapper>
        </NextLink>
        {isAuthenticated && (
          <NavItemList>
            {items.map((item, index) => {
              if ('items' in item) {
                return <NavGroupComponent key={index} group={item} />;
              }
              return <NavItem key={item.href} {...item} />;
            })}
          </NavItemList>
        )}
        <ColorSwitcherContainer>
          <ColorSwitcher />
        </ColorSwitcherContainer>
        {isAuthenticated && (
          <LogoutButton onClick={() => { 
            logout(); 
            router.push('/login');
          }}>
            Cerrar Sesión
          </LogoutButton>
        )}
        <HamburgerMenuWrapper>
          <HamburgerIcon aria-label="Toggle menu" onClick={toggle} />
        </HamburgerMenuWrapper>
      </Content>
    </NavbarContainer>
  );
}

const DropdownContainer = styled.div`
  position: relative;
  margin-right: 2rem;
`;

const DropdownButton = styled.button<{ isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: rgb(var(--text), 0.75);
  font-size: 1.3rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: rgba(var(--primary), 0.1);
    color: rgb(var(--text));
  }
`;

const DropdownArrow = styled.span`
  font-size: 0.8rem;
  transition: transform 0.2s;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 0.5rem;
  background: rgb(var(--cardBackground));
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 15rem;
  z-index: 1000;
  overflow: hidden;
  border: 1px solid rgba(var(--text), 0.1);
`;

const DropdownItem = styled.div`
  a {
    display: block;
    padding: 0.75rem 1.5rem;
    color: rgb(var(--text), 0.75);
    text-decoration: none;
    font-size: 1.3rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    transition: background-color 0.2s, color 0.2s;

    &:hover {
      background-color: rgba(var(--primary), 0.1);
      color: rgb(var(--text));
    }
  }

  &:not(:last-child) {
    border-bottom: 1px solid rgba(var(--text), 0.1);
  }
`;

function NavItem({ href, title, outlined }: SingleNavItem) {
  const { setIsModalOpened } = useNewsletterModalContext();

  function showNewsletterModal() {
    setIsModalOpened(true);
  }

  if (outlined) {
    return <CustomButton onClick={showNewsletterModal}>{title}</CustomButton>;
  }

  return (
    <NavItemWrapper outlined={outlined}>
      <NextLink href={href} passHref>
        <a>{title}</a>
      </NextLink>
    </NavItemWrapper>
  );
}

function NavGroupComponent({ group }: { group: NavGroup }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown cuando se cambia de ruta
  useEffect(() => {
    const handleRouteChange = () => {
      setIsOpen(false);
    };
    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <DropdownContainer ref={dropdownRef}>
      <DropdownButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen}>
        {group.title}
        <DropdownArrow>▼</DropdownArrow>
      </DropdownButton>
      {isOpen && (
        <DropdownMenu>
          {group.items.map((item) => (
            <DropdownItem key={item.href}>
              <NextLink href={item.href} passHref>
                <a>{item.title}</a>
              </NextLink>
            </DropdownItem>
          ))}
        </DropdownMenu>
      )}
    </DropdownContainer>
  );
}

const CustomButton = styled(Button)`
  padding: 0.75rem 1.5rem;
  line-height: 1.8;
`;

const NavItemList = styled.div`
  display: flex;
  list-style: none;

  ${media('<desktop')} {
    display: none;
  }
`;

const HamburgerMenuWrapper = styled.div`
  ${media('>=desktop')} {
    display: none;
  }
`;

const LogoWrapper = styled.a`
  display: flex;
  margin-right: auto;
  text-decoration: none;

  color: rgb(var(--logoColor));
`;

const NavItemWrapper = styled.li<Partial<SingleNavItem>>`
  background-color: ${(p) => (p.outlined ? 'rgb(var(--primary))' : 'transparent')};
  border-radius: 0.5rem;
  font-size: 1.3rem;
  text-transform: uppercase;
  line-height: 2;

  &:hover {
    background-color: ${(p) => (p.outlined ? 'rgb(var(--primary), 0.8)' : 'transparent')};
    transition: background-color 0.2s;
  }

  a {
    display: flex;
    color: ${(p) => (p.outlined ? 'rgb(var(--textSecondary))' : 'rgb(var(--text), 0.75)')};
    letter-spacing: 0.025em;
    text-decoration: none;
    padding: 0.75rem 1.5rem;
    font-weight: 700;
  }

  &:not(:last-child) {
    margin-right: 2rem;
  }
`;

const NavbarContainer = styled.div<NavbarContainerProps>`
  display: flex;
  position: sticky;
  top: 0;
  padding: 1.5rem 0;
  width: 100%;
  height: 8rem;
  z-index: var(--z-navbar);

  background-color: rgb(var(--navbarBackground));
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 5%);
  visibility: ${(p) => (p.hidden ? 'hidden' : 'visible')};
  transform: ${(p) => (p.hidden ? `translateY(-8rem) translateZ(0) scale(1)` : 'translateY(0) translateZ(0) scale(1)')};

  transition-property: transform, visibility, height, box-shadow, background-color;
  transition-duration: 0.15s;
  transition-timing-function: ease-in-out;

  ${media('<=phone')} {
    height: 7rem;
    padding: 1rem 0;
    transform: ${(p) => (p.hidden ? `translateY(-7rem) translateZ(0) scale(1)` : 'translateY(0) translateZ(0) scale(1)')};
  }
`;

const Content = styled(Container)`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

const ColorSwitcherContainer = styled.div`
  width: 4rem;
  margin: 0 1rem;
`;

const LogoutButton = styled.button`
  background: transparent;
  border: 2px solid rgb(var(--primary));
  color: rgb(var(--primary));
  font-size: 1.2rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
  margin-right: 1rem;

  &:hover {
    background-color: rgb(var(--primary));
    color: rgb(var(--textSecondary));
  }

  ${media('<desktop')} {
    display: none;
  }
`;
