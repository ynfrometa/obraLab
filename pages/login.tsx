import { useRouter } from 'next/router';
import { useState } from 'react';
import styled from 'styled-components';
import Button from 'components/Button';
import Input from 'components/Input';
import { useAuthContext } from 'contexts/auth.context';
import { media } from 'utils/media';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const success = login(username, password);
    
    if (success) {
      // Redirigir a la página que intentaba acceder o a la página principal
      const redirectTo = router.query.redirect as string || '/';
      router.push(redirectTo);
    } else {
      setError('Usuario o contraseña incorrectos');
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <LoginCard>
        <Title>Iniciar Sesión</Title>
        <Subtitle>Ingresa tus credenciales para acceder</Subtitle>
        
        <Form onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <InputGroup>
            <Label>Usuario</Label>
            <StyledInput
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="username"
            />
          </InputGroup>

          <InputGroup>
            <Label>Contraseña</Label>
            <StyledInput
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="current-password"
            />
          </InputGroup>

          <StyledButton as="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </StyledButton>
        </Form>
      </LoginCard>
    </Container>
  );
}

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: rgb(var(--background));
`;

const LoginCard = styled.div`
  width: 100%;
  max-width: 450px;
  background: rgb(var(--cardBackground));
  border-radius: 1rem;
  padding: 4rem;
  box-shadow: var(--shadow-lg);

  ${media('<=tablet')} {
    padding: 3rem 2rem;
  }
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 0.5rem;
  color: rgb(var(--text));
`;

const Subtitle = styled.p`
  font-size: 1.4rem;
  text-align: center;
  color: rgb(var(--textSecondary));
  margin-bottom: 3rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const Label = styled.label`
  font-size: 1.4rem;
  font-weight: 600;
  color: rgb(var(--text));
`;

const StyledInput = styled(Input)`
  width: 100%;
  font-size: 1.4rem;
  padding: 1.2rem 1.5rem;
  border: 2px solid rgba(var(--text), 0.1);
  border-radius: 0.6rem;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: rgb(var(--primary));
    box-shadow: 0 0 0 3px rgba(var(--primary), 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StyledButton = styled(Button)`
  width: 100%;
  margin-top: 1rem;
  padding: 1.5rem 2rem;
  font-size: 1.4rem;
  text-align: center;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgb(255, 0, 0);
  color: rgb(255, 0, 0);
  padding: 1rem;
  border-radius: 0.6rem;
  font-size: 1.3rem;
  text-align: center;
`;

