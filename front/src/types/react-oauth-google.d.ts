declare module '@react-oauth/google' {
  export interface GoogleOAuthProviderProps {
    clientId: string;
    children: React.ReactNode;
  }
  
  export function GoogleOAuthProvider(props: GoogleOAuthProviderProps): JSX.Element;
  export function useGoogleLogin(options: any): { login: () => void };
} 