export interface MentalCue {
  id: string;
  quote: string;
  author: string;
  context: string;
  category: 'frustration' | 'shooting' | 'u21_roce' | 'next_play' | 'resilience';
  tag: string;
  actionableStep?: string;
}

export const MOTIVATIONAL_CUES: MentalCue[] = [
  {
    id: 'cue-1',
    quote: 'El tiro que erraste ya no existe; la siguiente defensa sí. El enojo en la cancha es un regalo que le hacés a tu rival.',
    author: 'Mentalidad de Básquetbol',
    context: 'Enfocate en la posesión que tenés adelante',
    category: 'next_play',
    tag: 'Siguiente Jugada',
    actionableStep: 'Soltá la jugada pasada aplaudiendo una vez y corriendo a balance defensivo.',
  },
  {
    id: 'cue-2',
    quote: 'Si estás entrenando con U21 a los 16 años, tu trabajo no es ganar cada duelo físico hoy, es absorber el ritmo, aguantar el contacto y aprender. El roce de hoy es tu ventaja de mañana.',
    author: 'Formativas Instituto (IACC)',
    context: 'Entrenamientos de mayor nivel',
    category: 'u21_roce',
    tag: 'Roce y Crecimiento',
    actionableStep: 'Si un jugador más grande te gana por físico, fijate cómo usa el cuerpo y copialo.',
  },
  {
    id: 'cue-3',
    quote: 'El enojo consume oxígeno y nubla la lectura de juego. Cuando sientas que te hierve la sangre, respirá 4 segundos por la nariz, bajá el centro de gravedad y meté las piernas.',
    author: 'Control Emocional en Competencia',
    context: 'Autocontrol bajo presión',
    category: 'frustration',
    tag: 'Manejo de la Bronca',
    actionableStep: 'Respiración de rescate: 4 seg inhalar, 4 seg retener, 4 seg soltar.',
  },
  {
    id: 'cue-4',
    quote: 'Kobe Bryant erró más de 14.000 tiros en su carrera. Lo que lo hizo legendario no fue embocar todo, fue no dudar ni un segundo en volver a lanzar con la misma mecánica y convicción.',
    author: 'Mamba Mentality',
    context: 'Confianza en tu tiro',
    category: 'shooting',
    tag: 'Confianza Mecánica',
    actionableStep: 'Si erraste dos seguidos, no cambies la mecánica: mantené el codo alineado y el quiebre de muñeca.',
  },
  {
    id: 'cue-5',
    quote: 'Un mal entrenamiento o una práctica frustrante no definen tu talento. Lo único que te define es si al día siguiente vas a patear el piso o vas a volver a agarrar la pelota.',
    author: 'Manu Ginóbili',
    context: 'Resiliencia ante los días difíciles',
    category: 'resilience',
    tag: 'Carácter',
    actionableStep: 'Anotá qué te dio bronca hoy y convertilo en el objetivo de tu próximo entrenamiento.',
  },
  {
    id: 'cue-6',
    quote: 'Cuando no te salen las cosas en ataque, convertite en el peor problema del rival en defensa: cargá el rebote, presioná el balón y comunicá los bloqueos.',
    author: 'ADN Albirrojo',
    context: 'Impacto total en el partido',
    category: 'frustration',
    tag: 'Impacto Defensivo',
    actionableStep: 'La actitud defensiva no depende de la puntería; depende 100% de tu energía.',
  },
  {
    id: 'cue-7',
    quote: 'El aro en el patio a veces parece chico y la pelota caprichosa. La mecánica se forja en los días donde cuesta. Cada repetición suma milisegundos a tu memoria muscular.',
    author: 'Fundamentos Individuales',
    context: 'Trabajo silencioso en casa',
    category: 'shooting',
    tag: 'Memoria Muscular',
    actionableStep: 'Hacé 10 tiros cortos cerca del aro con una sola mano para recuperar el toque.',
  },
  {
    id: 'cue-8',
    quote: 'Equivocarse rápido es la única forma de mejorar. Si te da miedo equivocarte, vas a jugar contenido. Jugá con decisión, aceptá el error y corregí al instante.',
    author: 'Psicología Deportiva',
    context: 'Superación del bloqueo mental',
    category: 'next_play',
    tag: 'Decisión Sin Miedo',
    actionableStep: 'El error no te hace mal jugador, quedarte pensando en el error sí.',
  },
  {
    id: 'cue-9',
    quote: 'Entrenar con U21 te va a incomodar. Te van a chocar más fuerte y van a llegar antes a las ayudas. Esa incomodidad es exactamente el músculo que estás desarrollando.',
    author: 'Formativas IACC',
    context: 'Desafío U21',
    category: 'u21_roce',
    tag: 'Adaptación al Roce',
    actionableStep: 'Jugá con pase rápido y anticipación; no podés retener la pelota contra defensores más grandes.',
  },
  {
    id: 'cue-10',
    quote: 'Cuando un entrenador de Instituto te corrige fuerte o te exige, es porque ve que tenés techo para llegar. Preocupate el día que dejen de corregirte.',
    author: 'Cultura de Club',
    context: 'Recepción del feedback',
    category: 'resilience',
    tag: 'Madurez Competitiva',
    actionableStep: 'Mirá a los ojos al coach, asentí y corregí en la siguiente jugada.',
  },
];

export function getRandomMentalCue(): MentalCue {
  const idx = Math.floor(Math.random() * MOTIVATIONAL_CUES.length);
  return MOTIVATIONAL_CUES[idx];
}

export function getMentalCuesByCategory(category: MentalCue['category']): MentalCue[] {
  return MOTIVATIONAL_CUES.filter((c) => c.category === category);
}
