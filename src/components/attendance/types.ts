export type CalendarCategoryOption = {
  id: string;
  nombre: string;
  color: string;
  diasEntreno: string[] | null;
  horaEntreno: string | null;
  lugarEntreno: string | null;
};

export type CalendarTeamOption = {
  id: string;
  nombre: string;
  categoriaId: string;
  categoria: string;
  color: string;
  entrenadorId: string | null;
  auxiliarId: string | null;
};

export type CalendarSessionItem = {
  id: string;
  tipo: string;
  fecha: string;
  horaInicio: string | null;
  horaFin: string | null;
  lugar: string | null;
  rival: string | null;
  estado: string;
  categoriaId: string | null;
  categoria: string;
  color: string;
  equipoId: string | null;
  equipo: string | null;
};

export type CalendarCell = {
  iso: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
};
