export default function Doll({ body, eyes, hair, dress, shoes }) {
  return (
    <div className="doll-stage">
      {body && <img className="doll-base" src={body} alt="Body" />}
      {dress && <img className="doll-layer dress-layer" src={dress} alt="Dress" />}
      {shoes && <img className="doll-layer shoes-layer" src={shoes} alt="Shoes" />}
      {eyes && <img className="doll-layer eyes-layer" src={eyes} alt="Eyes" />}
      {hair && <img className="doll-layer hair-layer" src={hair} alt="Hair" />}
    </div>
  );
}
