import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { Link } from "react-router";
import { supabase } from "./client";
import { errorMessage, getProfile, type Profile } from "./api";
type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string;
  reload: () => void;
};
const AuthContext = createContext<AuthState>({
  session: null,
  profile: null,
  loading: false,
  error: "",
  reload: () => {},
});
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [loadedUser, setLoadedUser] = useState<string | null>(null);
  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (!supabase) return;
    let live = true;
    let eventReceived = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      eventReceived = true;
      if (live) {
        setSession(next);
        setReady(true);
      }
    });
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!live || eventReceived) return;
        setSession(data.session);
        setReady(true);
        if (error) setError(errorMessage(error));
      })
      .catch((err) => {
        if (live) {
          setError(errorMessage(err));
          setReady(true);
        }
      });
    return () => {
      live = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    let live = true;
    if (!userId) {
      setProfile(null);
      setProfileLoading(false);
      setLoadedUser(null);
      setError("");
      return;
    }
    setProfileLoading(true);
    setError("");
    getProfile(userId)
      .then((p) => {
        if (live) setProfile(p);
      })
      .catch((err) => {
        if (live) {
          setProfile(null);
          setError(errorMessage(err));
        }
      })
      .finally(() => {
        if (live) {
          setProfileLoading(false);
          setLoadedUser(userId);
        }
      });
    return () => {
      live = false;
    };
  }, [userId, retry]);
  return (
    <AuthContext.Provider
      value={{
        session,
        profile: profile?.user_id === userId ? profile : null,
        loading:
          !ready || profileLoading || (!!userId && loadedUser !== userId),
        error,
        reload: () => setRetry((v) => v + 1),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}
export function Unavailable() {
  return (
    <div className="diary-notice" role="status">
      <h1>Diário indisponível</h1>
      <p>
        A conexão do diário ainda não foi configurada. O restante do acervo
        continua disponível.
      </p>
      <Link className="text-link" to="/">
        Explorar Greenmond →
      </Link>
    </div>
  );
}
export function PrivateDiary({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (!supabase) return <Unavailable />;
  if (auth.loading) return <p role="status">Verificando acesso…</p>;
  if (auth.error)
    return (
      <div role="alert">
        <p>{auth.error}</p>
        <button className="button" onClick={auth.reload}>
          Tentar novamente
        </button>
      </div>
    );
  if (!auth.session)
    return (
      <div className="diary-notice">
        <h1>Entre para escrever</h1>
        <p>O diário recebe contribuições dos participantes autorizados.</p>
        <Link className="button" to="/entrar">
          Entrar
        </Link>
      </div>
    );
  if (!auth.profile)
    return (
      <div className="diary-notice">
        <h1>Acesso não autorizado</h1>
        <p>
          Sua conta não está habilitada para o Greenmond. Solicite acesso ao
          narrador.
        </p>
        <AccountLink />
      </div>
    );
  return <>{children}</>;
}
export function AccountLink() {
  const auth = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="diary-account">
      <Link className="text-link" to={auth.session ? "/meu-diario" : "/entrar"}>
        {auth.session ? "Meu diário" : "Entrar para escrever"}
      </Link>
      {auth.session && (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const result = await supabase?.auth.signOut({ scope: "local" });
              if (result?.error) throw result.error;
            } catch (err) {
              setError(errorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          Sair da conta
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
