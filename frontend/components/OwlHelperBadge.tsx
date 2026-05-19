export default function OwlHelperBadge() {
  return (
    <div className="owl-helper-badge" tabIndex={0} aria-label="Salamax helper">
      <img
        src="/images/salamax-owl-helper.webp"
        alt=""
        aria-hidden="true"
        className="owl-helper-badge__image"
      />
      <span className="owl-helper-badge__tooltip">
        من همراه سلامکس هستم؛ مرحله‌به‌مرحله کمکت می‌کنم.
      </span>
    </div>
  );
}
