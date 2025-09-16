import AuthForms from '../AuthForms'

export default function AuthFormsExample() {
  return (
    <AuthForms 
      onLogin={(username, role, tenantId) => {
        console.log('Login:', { username, role, tenantId });
      }}
      onRegister={(userData) => {
        console.log('Register:', userData);
      }}
    />
  )
}