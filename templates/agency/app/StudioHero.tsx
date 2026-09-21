export function StudioHero() {
  return (
    <header className="agency-masthead">
      <div className="agency-masthead-bar">
        <span className="agency-wordmark">Signal Form</span>
        <nav aria-label="Primary">
          <a href="#work">Work</a>
          <a href="#capabilities">Capabilities</a>
          <a href="#contact">Contact</a>
        </nav>
      </div>
      <div className="agency-masthead-lead">
        <h1>Brand and product work that earns its keep</h1>
        <p>A small studio for identity, product design, and the film work that ties them together.</p>
        <a className="agency-masthead-cta" href="#work">See our work</a>
      </div>
    </header>
  );
}
