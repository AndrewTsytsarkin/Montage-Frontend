import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    const result = await authLogin(login, password);
    if (result.success) navigate('/dashboard');
    else setError(result.message || 'Ошибка');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
        <h2>Вход</h2>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <input type="text" placeholder="Логин" value={login} onChange={(e) => setLogin(e.target.value)} required />
        <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Войти</button>
      </form>
    </div>
  );
};

export default Login;