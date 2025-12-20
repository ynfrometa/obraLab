import Head from 'next/head';
import { PropsWithChildren } from 'react';
import styled from 'styled-components';
import { EnvVars } from 'env';
import { media } from 'utils/media';
import Container from './Container';
import SectionTitle from './SectionTitle';

export interface PageProps {
  title: string;
  description?: string;
}

export default function Page({ title, description, children }: PropsWithChildren<PageProps>) {
  return (
    <>
      <Head>
        <title>
          {title} | {EnvVars.SITE_NAME}
        </title>
        <meta name="description" content={description} />
      </Head>
      <Wrapper>
        <HeaderContainer>
          <Container>
            <Title>{title}</Title>
            {description && <Description>{description}</Description>}
          </Container>
        </HeaderContainer>
        <Container>
          <ChildrenWrapper>{children}</ChildrenWrapper>
        </Container>
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  background: rgb(var(--background));
`;

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--secondary));
  min-height: 20rem;
  padding: 3rem 0;

  ${media('<=tablet')} {
    min-height: 15rem;
    padding: 2rem 0;
  }

  ${media('<=phone')} {
    min-height: 12rem;
    padding: 1.5rem 0;
  }
`;

const Title = styled(SectionTitle)`
  color: rgb(var(--textSecondary));
  margin-bottom: 1rem;
`;

const Description = styled.div`
  font-size: 1.6rem;
  color: rgba(var(--textSecondary), 0.8);
  text-align: center;
  max-width: 60%;
  margin: auto;

  ${media('<=tablet')} {
    max-width: 100%;
    font-size: 1.4rem;
  }

  ${media('<=phone')} {
    font-size: 1.3rem;
    padding: 0 1rem;
  }
`;

const ChildrenWrapper = styled.div`
  margin-top: 10rem;
  margin-bottom: 10rem;

  ${media('<=tablet')} {
    margin-top: 6rem;
    margin-bottom: 6rem;
  }

  ${media('<=phone')} {
    margin-top: 4rem;
    margin-bottom: 4rem;
  }
`;
