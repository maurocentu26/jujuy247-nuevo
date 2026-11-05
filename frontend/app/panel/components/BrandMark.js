// Isotipo oficial: las dos versiones existen en el HTML y el tema muestra la que corresponde.
export default function BrandMark({ size = 36 }) {
  const height = Math.round(size * 1.27);
  return (
    <>
      <img className="brand-on-light" src="/isotipo.png" alt="" width={size} height={height} />
      <img className="brand-on-dark" src="/isotipo-white.png" alt="" width={size} height={height} />
    </>
  );
}
