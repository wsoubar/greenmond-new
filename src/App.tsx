import { Icon } from "./components/Icon";
import { ActionLink } from "./components/Actions";
import { useEffect, useState } from "react";
import {
  createHashRouter,
  RouterProvider,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router";
import {
  asset,
  relatedPeople,
  relatedPlaces,
  searchContent,
  cidade,
  criacao,
  npcs,
  personagens,
  fichas,
  findCharacter,
  matches,
  type Section,
} from "./lib/content";

import { AuthProvider } from "./features/diary/Auth";
import { DiaryList, DiaryDetail, MyDiary, DiaryEditor, Login } from "./features/diary/Pages";
import { DiarySearch } from "./features/diary/Search";

const navigation = [
  ["/", "Visão geral"],
  ["/cidade", "A cidade"],
  ["/personagens", "Personagens"],
  ["/npcs", "NPCs"],
  ["/criacao", "Criação de personagens"],
  ["/busca", "Buscar no acervo"],
  ["/diario", "Diário da crônica"],
  ["/meu-diario", "Escrita e revisão"],
];
function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
function Heading({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-heading">
      <p className="eyebrow">{label}</p>
      <h1>{title}</h1>
      {children && <p className="intro">{children}</p>}
    </header>
  );
}
function NotFound() {
  return (
    <>
      <Heading
        label="Arquivo não encontrado"
        title="Este caminho não leva a Greenmond."
      >
        O endereço ou registro solicitado não existe.
      </Heading>
      <ActionLink icon="arrowLeft" className="button" to="/">
        Voltar ao início
      </ActionLink>
    </>
  );
}
function Blocks({ section }: { section: Section }) {
  return (
    <div className="reading">
      {section.blocks.map((block, i) =>
        block.type === "image" ? (
          <figure key={i}>
            <img
              src={asset(block.value)}
              alt={`${section.title} — imagem ${section.blocks.slice(0, i + 1).filter((b) => b.type === "image").length}`}
              loading="lazy"
            />
          </figure>
        ) : block.type === "heading" ? (
          <h3 key={i}>{block.value}</h3>
        ) : (
          <p key={i}>{block.value}</p>
        ),
      )}
    </div>
  );
}
function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">
            <span className="small-line" /> Carolina do Sul · Crônicas da noite
          </p>
          <h1>
            Greenmond<span className="title-period">.</span>
          </h1>
          <p className="hero-subtitle">
            A cidade dorme.
            <br />
            <em>As histórias, não.</em>
          </p>
          <p className="hero-description">
            Entre pelas ruas, conheça seus habitantes e descubra as histórias
            que se escondem sob as luzes da cidade.
          </p>
          <div className="hero-actions">
            <ActionLink icon="compass" className="button" to="/cidade">
              Explorar a cidade
            </ActionLink>
            <ActionLink icon="users" className="hero-secondary" to="/personagens">
              Conhecer os personagens
            </ActionLink>
          </div>
        </div>
        <div className="hero-visual">
          <img
            src={asset("images/cidade/gm-01.jpg")}
            alt="Panorama noturno da cidade de Greenmond"
          />
          <span className="image-corner image-corner-top" aria-hidden="true" />
          <div className="hero-image-label">
            <span>01 / O CENÁRIO</span>
            <p>Bem-vindo à noite.</p>
          </div>
          <span className="image-coordinate">GREENMOND — SOUTH CAROLINA</span>
        </div>
      </section>
      <div className="stats">
        <p className="stats-caption">
          Um cenário.
          <br />
          <em>Inúmeras histórias.</em>
        </p>
        <span>
          <b>{String(cidade.length).padStart(2, "0")}</b>
          <span>Locais para explorar</span>
        </span>
        <span>
          <b>{String(personagens.length).padStart(2, "0")}</b>
          <span>Personagens</span>
        </span>
        <span>
          <b>{npcs.reduce((sum, g) => sum + g.people.length, 0)}</b>
          <span>Figuras da cidade</span>
        </span>
      </div>
      <section className="section-heading">
        <div>
          <p className="eyebrow">01 / Territórios e encontros</p>
          <h2>
            Cada lugar, <em>uma história.</em>
          </h2>
        </div>
        <ActionLink icon="compass" className="text-link" to="/cidade">
          Explorar todos os locais
        </ActionLink>
      </section>
      <div className="place-grid home-places">
        {cidade.slice(1, 4).map((place) => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </div>
      <section className="society-section">
        <div className="society-intro">
          <p className="eyebrow">02 / A sociedade da noite</p>
          <h2>
            Por trás de cada nome,
            <br />
            <em>um legado.</em>
          </h2>
          <p>
            Clãs, alianças e histórias que atravessam a cidade. Conheça aqueles
            que fazem parte de Greenmond.
          </p>
          <ActionLink icon="users" className="text-link" to="/npcs">
            Conhecer as figuras da cidade
          </ActionLink>
        </div>
        <div className="clan-gallery">
          {npcs.map((group) => (
            <Link key={group.id} to="/npcs" className="clan-emblem">
              <div>
                <img
                  src={asset(group.image)}
                  alt={`Símbolo do clã ${group.title}`}
                />
              </div>
              <span>{group.title}</span>
            </Link>
          ))}
        </div>
      </section>
      <div className="bottom-links">
        <Link to="/personagens">
          <span>03 / QUEM HABITA GREENMOND</span>
          <h2>
            Histórias que merecem
            <br />
            ser conhecidas.
          </h2>
          <b>
            Encontre os personagens <Icon name="arrowUpRight" />
          </b>
        </Link>
        <Link to="/criacao">
          <span>04 / SUA PRÓXIMA HISTÓRIA</span>
          <h2>
            A noite também
            <br />
            pode ser sua.
          </h2>
          <b>
            Crie seu personagem <Icon name="arrowUpRight" />
          </b>
        </Link>
      </div>
    </>
  );
}
function PlaceCard({ place }: { place: Section }) {
  const image = place.blocks.find((b) => b.type === "image");
  return (
    <Link className="place-card" to={`/cidade/${place.id}`}>
      {image && (
        <img src={asset(image.value)} alt={place.title} loading="lazy" />
      )}
      <div>
        <p className="eyebrow">Arquivo da cidade</p>
        <h2>
          {place.title} <span>↗</span>
        </h2>
      </div>
    </Link>
  );
}
function City() {
  return (
    <>
      <Heading label="Atlas de Greenmond" title="A cidade">
        Do centro às margens do pântano, descubra os lugares que compõem o
        cenário.
      </Heading>
      <div className="place-grid">
        {cidade.map((place) => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </div>
    </>
  );
}
function Place() {
  const { localId } = useParams();
  const place = cidade.find((p) => p.id === localId);
  return place ? (
    <>
      <ActionLink icon="arrowLeft" className="text-link" to="/cidade">
        A cidade
      </ActionLink>
      <Heading label="Lugares de Greenmond" title={place.title} />
      {relatedPeople(place.id).length > 0 && (
        <section className="related-people" aria-labelledby="related-heading">
          <h2 id="related-heading">Quem se relaciona com este lugar</h2>
          <ul>
            {relatedPeople(place.id).map((person) => (
              <li key={person.href}>
                <Link to={person.href}>
                  <span className="eyebrow">{person.clan}</span>
                  <h3>{person.name} <Icon name="arrowUpRight" /></h3>
                  <p>{person.role}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Blocks section={place} />
    </>
  ) : (
    <NotFound />
  );
}
function Characters() {
  const [query, setQuery] = useState("");
  const [clan, setClan] = useState("");
  const list = personagens.filter(
    (p) => matches(p.nome, query) && (!clan || p.cla === clan),
  );
  return (
    <>
      <Heading label="Habitantes da noite" title="Personagens">
        Nomes, clãs e histórias que dão vida ao cenário.
      </Heading>
      <div className="filters">
        <label>
          Buscar personagem
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite um nome…"
            type="search"
          />
        </label>
        <label>
          Clã
          <select value={clan} onChange={(e) => setClan(e.target.value)}>
            <option value="">Todos os clãs</option>
            {[...new Set(personagens.map((p) => p.cla))].sort().map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="result-count">{list.length} personagem(ns)</p>
      <div className="character-grid">
        {list.map((p) => (
          <Link
            className="character-card"
            key={p.id}
            to={`/personagens/${p.id}`}
          >
            <div className="character-card__emblem">
              <img src={asset(p.claImage)} alt={`Símbolo do clã ${p.cla}`} />
            </div>
            <p className="eyebrow">{p.cla}</p>
            <h2>{p.nome}</h2>
            <p>Jogador: {p.jogador}</p>
            <span className="text-link"><Icon name="book" />Conheça a história</span>
          </Link>
        ))}
      </div>
      {!list.length && (
        <p className="empty">
          Nenhum personagem encontrado. Experimente outro nome ou clã.
        </p>
      )}
    </>
  );
}
function RelatedPlaces({ type, id }: { type: "personagem" | "npc"; id: string }) {
  const places = relatedPlaces(type, id);
  if (!places.length) return null;
  return (
    <section className="related-people" aria-labelledby="places-heading">
      <h2 id="places-heading">Locais relacionados</h2>
      <ul>{places.map((place) => (
        <li key={place.href}><Link to={place.href}>
          <h3>{place.title} <Icon name="arrowUpRight" /></h3>
          <p>{place.role}</p>
        </Link></li>
      ))}</ul>
    </section>
  );
}
function Search() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const results = searchContent(query);
  return (
    <>
      <Heading label="Acervo de Greenmond" title="Buscar no acervo">
        Encontre locais, personagens e NPCs por nome, clã ou palavras de suas histórias.
      </Heading>
      <div className="filters"><label>O que você procura?
        <input type="search" value={query} placeholder="Nome, clã ou trecho da história"
          onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })} />
      </label></div>
      <p role="status">{!query.trim() ? "Digite um termo para explorar o acervo." : `${results.length} resultado(s) encontrado(s) no acervo local.`}</p>
      {query.trim() && !results.length && <p className="empty">Nenhum resultado encontrado no acervo local. Experimente outro termo.</p>}
      <DiarySearch key={query} query={query} />
      {["Locais", "Personagens", "NPCs"].map((category) => {
        const entries = results.filter((r) => r.category === category);
        return entries.length ? <section className="search-results" key={category}>
          <h2>{category} <span>({entries.length})</span></h2>
          <ul>{entries.map((entry) => <li key={entry.href}>
            <Link to={entry.href}><h3>{entry.title} <Icon name="arrowUpRight" /></h3><p>{entry.excerpt}</p></Link>
          </li>)}</ul>
        </section> : null;
      })}
    </>
  );
}
function Character({ sheet = false }: { sheet?: boolean }) {
  const { personagemId } = useParams();
  const p = findCharacter(personagemId);
  if (!p) return <NotFound />;
  const ficha = fichas.find((f) => f.personagemId === p.id);
  return (
    <>
      <ActionLink icon="arrowLeft" className="text-link" to={`/personagens${sheet ? "/" + p.id : ""}`}>
        {sheet ? "História do personagem" : "Personagens"}
      </ActionLink>
      <Heading label={`${p.cla} · ${p.jogador}`} title={p.nome} />
      {!sheet && <RelatedPlaces type="personagem" id={p.id} />}
      <div className="character-banner">
        <div className="character-banner__emblem">
          <img src={asset(p.claImage)} alt={`Símbolo do clã ${p.cla}`} />
        </div>
        <div>
          <p className="eyebrow">
            {sheet ? "Ficha do personagem" : "História do personagem"}
          </p>
          {!sheet && ficha && (
            <ActionLink icon="file" className="text-link" to={`/fichas/${p.id}`}>
              Consultar ficha
            </ActionLink>
          )}
        </div>
      </div>
      <div className="reading">
        <p>
          {sheet
            ? (ficha?.text ?? "Não há ficha disponível para este personagem.")
            : p.historia.replace(/\\n/g, "\n")}
        </p>
      </div>
    </>
  );
}
function Npc() {
  const { npcId } = useParams();
  const group = npcs.find((g) => g.people.some((p) => p.id === npcId));
  const person = group?.people.find((p) => p.id === npcId);
  if (!person || !group) return <NotFound />;
  return (
    <>
      <ActionLink icon="arrowLeft" className="text-link" to="/npcs">Figuras da cidade</ActionLink>
      <Heading label={`NPC · ${group.title}`} title={person.name} />
      <RelatedPlaces type="npc" id={person.id} />
      <div className="reading"><p>{person.description}</p></div>
    </>
  );
}
function Npcs() {
  const [query, setQuery] = useState("");
  const groups = npcs
    .map((g) => ({
      ...g,
      people: g.people.filter((p) => matches(p.name + " " + g.title, query)),
    }))
    .filter((g) => g.people.length);
  return (
    <>
      <Heading label="Sociedade de Greenmond" title="Figuras da cidade">
        Conheça os NPCs e suas relações com a cidade.
      </Heading>
      <div className="filters">
        <label>
          Buscar nome ou clã
          <input
            type="search"
            placeholder="Quem você procura?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      {groups.map((g) => (
        <section className="clan-section" key={g.id}>
          <div className="clan-heading">
            <div className="clan-heading__emblem">
              <img src={asset(g.image)} alt="" />
            </div>
            <h2>{g.title}</h2>
            <span>{g.people.length} figuras</span>
          </div>
          {g.people.map((p) => (
            <details key={p.id}>
              <summary>{p.name}</summary>
              <p>{p.description}<br /><ActionLink icon="book" className="text-link" to={`/npcs/${p.id}`}>Abrir história de {p.name}</ActionLink></p>
            </details>
          ))}
        </section>
      ))}
      {!groups.length && (
        <p className="empty">Nenhuma figura encontrada para esta busca.</p>
      )}
    </>
  );
}
function Creation() {
  return (
    <>
      <Heading label="Uma nova história" title="Criação de personagens">
        Orientações e regras do cenário original.
      </Heading>
      {criacao.map((section) => (
        <section key={section.id} className="rules-section">
          <h2>{section.title}</h2>
          <Blocks section={section} />
        </section>
      ))}
    </>
  );
}
export function AppShell() {
  const [open, setOpen] = useState(false);
  return (
    <AuthProvider>
      <ScrollTop />
      <a className="skip-link" href="#conteudo" onClick={(event) => {
        event.preventDefault();
        document.getElementById("conteudo")?.focus();
      }}>
        Ir para o conteúdo
      </a>
      <aside className="sidebar">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">
            G<span>·</span>
          </span>
          <span>
            GREENMOND<small>CRÔNICAS DA NOITE</small>
          </span>
        </Link>
        <button
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="navigation"
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? "close" : "menu"} />{open ? "Fechar menu" : "Abrir menu"}
        </button>
        <nav
          id="navigation"
          className={open ? "open" : ""}
          aria-label="Principal"
        >
          <p className="nav-label">EXPLORE O CENÁRIO</p>
          {navigation.map(([path, label], i) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              onClick={() => setOpen(false)}
            >
              <span className="nav-number">0{i + 1}</span>
              {label}
              <Icon name="arrowUpRight" className="nav-arrow" />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="status-dot" /> Greenmond, Carolina do Sul
          <p>As histórias permanecem.</p>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>
            O CENÁRIO <span className="separator">/</span> GREENMOND
          </span>
          <span className="topbar-note">Uma cidade. Muitas histórias.</span>
        </header>
        <main id="conteudo" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cidade" element={<City />} />
            <Route path="/cidade/:localId" element={<Place />} />
            <Route path="/personagens" element={<Characters />} />
            <Route path="/personagens/:personagemId" element={<Character />} />
            <Route path="/fichas/:personagemId" element={<Character sheet />} />
            <Route path="/npcs" element={<Npcs />} />
            <Route path="/npcs/:npcId" element={<Npc />} />
            <Route path="/criacao" element={<Creation />} />
            <Route path="/busca" element={<Search />} />
            <Route path="/diario" element={<DiaryList />} />
            <Route path="/diario/:entryId" element={<DiaryDetail />} />
            <Route path="/entrar" element={<Login />} />
            <Route path="/meu-diario" element={<MyDiary />} />
            <Route path="/meu-diario/:entryId" element={<DiaryEditor />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className="page-footer">
          <span>GREENMOND</span>
          <p>Carolina do Sul · Crônicas da noite</p>
        </footer>
      </div>
    </AuthProvider>
  );
}

export function createAppRouter() {
  return createHashRouter([{ path: "*", element: <AppShell /> }]);
}
export default function App({ router }: { router: ReturnType<typeof createAppRouter> }) {
  return <RouterProvider router={router} />;
}
