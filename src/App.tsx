import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router";
import {
  asset,
  cidade,
  criacao,
  npcs,
  personagens,
  fichas,
  findCharacter,
  matches,
  type Section,
} from "./lib/content";

const navigation = [
  ["/", "Visão geral"],
  ["/cidade", "A cidade"],
  ["/personagens", "Personagens"],
  ["/npcs", "NPCs"],
  ["/criacao", "Criação de personagens"],
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
      <Link className="button" to="/">
        Voltar ao início →
      </Link>
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
            <Link className="button" to="/cidade">
              Explorar a cidade <span aria-hidden="true">↗</span>
            </Link>
            <Link className="hero-secondary" to="/personagens">
              Conhecer os personagens <span aria-hidden="true">→</span>
            </Link>
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
        <Link className="text-link" to="/cidade">
          Explorar todos os locais <span aria-hidden="true">↗</span>
        </Link>
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
          <Link className="text-link" to="/npcs">
            Conhecer as figuras da cidade ↗
          </Link>
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
            Encontre os personagens <span aria-hidden="true">↗</span>
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
            Crie seu personagem <span aria-hidden="true">↗</span>
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
      <Link className="text-link" to="/cidade">
        ← A cidade
      </Link>
      <Heading label="Lugares de Greenmond" title={place.title} />
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
            <span className="text-link">Conheça a história →</span>
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
function Character({ sheet = false }: { sheet?: boolean }) {
  const { personagemId } = useParams();
  const p = findCharacter(personagemId);
  if (!p) return <NotFound />;
  const ficha = fichas.find((f) => f.personagemId === p.id);
  return (
    <>
      <Link className="text-link" to={`/personagens${sheet ? "/" + p.id : ""}`}>
        ← {sheet ? "História do personagem" : "Personagens"}
      </Link>
      <Heading label={`${p.cla} · ${p.jogador}`} title={p.nome} />
      <div className="character-banner">
        <div className="character-banner__emblem">
          <img src={asset(p.claImage)} alt={`Símbolo do clã ${p.cla}`} />
        </div>
        <div>
          <p className="eyebrow">
            {sheet ? "Ficha do personagem" : "História do personagem"}
          </p>
          {!sheet && ficha && (
            <Link className="text-link" to={`/fichas/${p.id}`}>
              Consultar ficha ↗
            </Link>
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
              <p>{p.description}</p>
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
export default function App() {
  const [open, setOpen] = useState(false);
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollTop />
      <a className="skip-link" href="#conteudo">
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
          {open ? "Fechar menu" : "Abrir menu"}
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
              <span className="nav-arrow">↗</span>
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
            <Route path="/criacao" element={<Creation />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className="page-footer">
          <span>GREENMOND</span>
          <p>Carolina do Sul · Crônicas da noite</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
