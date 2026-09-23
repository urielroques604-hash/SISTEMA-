// Servicio de Autenticación de Google Workspace (Gmail) sin Firebase
// Utiliza Google Identity Services (GIS) oficial y flujos directos de tokens OAuth 2.0 en cliente

export interface GoogleUser {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export const GMAIL_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing'
];

import firebaseConfig from '../../firebase-applet-config.json';

export const GOOGLE_CLIENT_ID = firebaseConfig.oAuthClientId || '954602134723-llp7b9dcr1jbthcbefprjidkpgirpg2e.apps.googleusercontent.com';

// Almacenamiento exclusivamente en memoria para cumplir la directiva de seguridad de tokens
let cachedAccessToken: string | null = null;
let cachedUser: GoogleUser | null = null;
let listeners: Array<(user: GoogleUser, token: string) => void> = [];

export const initAuth = (
  onAuthSuccess?: (user: GoogleUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (onAuthSuccess) {
    listeners.push(onAuthSuccess);
  }

  if (cachedUser && cachedAccessToken) {
    if (onAuthSuccess) onAuthSuccess(cachedUser, cachedAccessToken);
  } else {
    if (onAuthFailure) onAuthFailure();
  }

  return () => {
    if (onAuthSuccess) {
      listeners = listeners.filter(l => l !== onAuthSuccess);
    }
  };
};

export const googleSignIn = async (): Promise<{ user: GoogleUser; accessToken: string } | null> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('La autenticación de Google solo está disponible en el navegador.'));
    }

    const startOAuthFlow = () => {
      try {
        const google = (window as any).google;
        if (!google?.accounts?.oauth2) {
          return reject(new Error('La biblioteca Google Identity Services no está disponible.'));
        }

        const client = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: GMAIL_SCOPES.join(' '),
          prompt: 'select_account',
          callback: async (response: any) => {
            if (response.error) {
              if (response.error === 'popup_closed_by_user') {
                return resolve(null);
              }
              return reject(new Error(response.error_description || response.error));
            }

            if (!response.access_token) {
              return reject(new Error('No se recibió el token de acceso OAuth para Gmail.'));
            }

            const token = response.access_token;
            cachedAccessToken = token;

            // Obtener perfil del usuario desde Google userinfo
            let user: GoogleUser = {
              email: 'variedadescs.online@gmail.com',
              displayName: 'VARIEDADES CS',
              photoURL: null
            };

            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (res.ok) {
                const info = await res.json();
                user = {
                  email: info.email || user.email,
                  displayName: info.name || user.displayName,
                  photoURL: info.picture || null
                };
              }
            } catch {
              // Si falla userinfo, usamos los datos por defecto
            }

            cachedUser = user;
            listeners.forEach(cb => cb(user, token));
            resolve({ user, accessToken: token });
          },
          error_callback: (err: any) => {
            if (err?.type === 'popup_closed') {
              resolve(null);
            } else {
              reject(new Error(err?.message || 'Error en la ventana emergente de Google.'));
            }
          }
        });

        client.requestAccessToken();
      } catch (err: any) {
        reject(err);
      }
    };

    const google = (window as any).google;
    if (google?.accounts?.oauth2) {
      startOAuthFlow();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => startOAuthFlow();
      script.onerror = () => reject(new Error('No se pudo cargar la librería oficial de Google Identity Services.'));
      document.head.appendChild(script);
    }
  });
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getCurrentGoogleUser = (): GoogleUser | null => {
  return cachedUser;
};

export const googleSignOut = async () => {
  cachedAccessToken = null;
  cachedUser = null;
};
