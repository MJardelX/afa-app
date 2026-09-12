export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      academias: {
        Row: {
          activa: boolean
          actualizado_en: string
          color_primario: string | null
          color_secundario: string | null
          creado_en: string
          direccion: string | null
          email: string | null
          id: string
          logo_url: string | null
          nombre: string
          nombre_corto: string | null
          prefijo_codigo: string
          telefono: string | null
        }
        Insert: {
          activa?: boolean
          actualizado_en?: string
          color_primario?: string | null
          color_secundario?: string | null
          creado_en?: string
          direccion?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          nombre: string
          nombre_corto?: string | null
          prefijo_codigo?: string
          telefono?: string | null
        }
        Update: {
          activa?: boolean
          actualizado_en?: string
          color_primario?: string | null
          color_secundario?: string | null
          creado_en?: string
          direccion?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          nombre?: string
          nombre_corto?: string | null
          prefijo_codigo?: string
          telefono?: string | null
        }
        Relationships: []
      }
      asistencias: {
        Row: {
          asistencias_gol: number
          estado: Database["public"]["Enums"]["estado_asistencia"]
          goles: number
          id: string
          jugador_id: string
          minutos_jugados: number | null
          observacion: string | null
          registrada_en: string
          registrada_por: string | null
          sesion_id: string
        }
        Insert: {
          asistencias_gol?: number
          estado: Database["public"]["Enums"]["estado_asistencia"]
          goles?: number
          id?: string
          jugador_id: string
          minutos_jugados?: number | null
          observacion?: string | null
          registrada_en?: string
          registrada_por?: string | null
          sesion_id: string
        }
        Update: {
          asistencias_gol?: number
          estado?: Database["public"]["Enums"]["estado_asistencia"]
          goles?: number
          id?: string
          jugador_id?: string
          minutos_jugados?: number | null
          observacion?: string | null
          registrada_en?: string
          registrada_por?: string | null
          sesion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asistencias_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "jugadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencias_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencias_registrada_por_fkey"
            columns: ["registrada_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencias_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "sesiones"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          academia_id: string | null
          accion: string
          datos_nuevos: Json | null
          datos_previos: Json | null
          fecha: string
          id: number
          registro_id: string | null
          tabla: string
          usuario_id: string | null
        }
        Insert: {
          academia_id?: string | null
          accion: string
          datos_nuevos?: Json | null
          datos_previos?: Json | null
          fecha?: string
          id?: number
          registro_id?: string | null
          tabla: string
          usuario_id?: string | null
        }
        Update: {
          academia_id?: string | null
          accion?: string
          datos_nuevos?: Json | null
          datos_previos?: Json | null
          fecha?: string
          id?: number
          registro_id?: string | null
          tabla?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      categorias: {
        Row: {
          academia_id: string
          activa: boolean
          color: string
          creado_en: string
          dias_entreno: string[] | null
          edad_max: number
          edad_min: number
          hora_entreno: string | null
          id: string
          lugar_entreno: string | null
          nombre: string
          orden: number
        }
        Insert: {
          academia_id: string
          activa?: boolean
          color?: string
          creado_en?: string
          dias_entreno?: string[] | null
          edad_max: number
          edad_min: number
          hora_entreno?: string | null
          id?: string
          lugar_entreno?: string | null
          nombre: string
          orden?: number
        }
        Update: {
          academia_id?: string
          activa?: boolean
          color?: string
          creado_en?: string
          dias_entreno?: string[] | null
          edad_max?: number
          edad_min?: number
          hora_entreno?: string | null
          id?: string
          lugar_entreno?: string | null
          nombre?: string
          orden?: number
        }
        Relationships: [
          {
            foreignKeyName: "categorias_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
        ]
      }
      correlativos: {
        Row: {
          academia_id: string
          anio: number
          ultimo: number
        }
        Insert: {
          academia_id: string
          anio: number
          ultimo?: number
        }
        Update: {
          academia_id?: string
          anio?: number
          ultimo?: number
        }
        Relationships: [
          {
            foreignKeyName: "correlativos_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
        ]
      }
      criterios_evaluacion: {
        Row: {
          academia_id: string
          activo: boolean
          descripcion: string | null
          dimension: Database["public"]["Enums"]["dimension_criterio"]
          escala_max: number
          id: string
          nombre: string
          orden: number
          peso: number
          rubrica: Json | null
        }
        Insert: {
          academia_id: string
          activo?: boolean
          descripcion?: string | null
          dimension: Database["public"]["Enums"]["dimension_criterio"]
          escala_max?: number
          id?: string
          nombre: string
          orden?: number
          peso?: number
          rubrica?: Json | null
        }
        Update: {
          academia_id?: string
          activo?: boolean
          descripcion?: string | null
          dimension?: Database["public"]["Enums"]["dimension_criterio"]
          escala_max?: number
          id?: string
          nombre?: string
          orden?: number
          peso?: number
          rubrica?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "criterios_evaluacion_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          academia_id: string
          id: string
          jugador_id: string | null
          mime_type: string | null
          nombre: string
          storage_path: string
          subido_en: string
          subido_por: string | null
          tamano_bytes: number | null
          tipo: Database["public"]["Enums"]["tipo_documento"]
        }
        Insert: {
          academia_id: string
          id?: string
          jugador_id?: string | null
          mime_type?: string | null
          nombre: string
          storage_path: string
          subido_en?: string
          subido_por?: string | null
          tamano_bytes?: number | null
          tipo: Database["public"]["Enums"]["tipo_documento"]
        }
        Update: {
          academia_id?: string
          id?: string
          jugador_id?: string | null
          mime_type?: string | null
          nombre?: string
          storage_path?: string
          subido_en?: string
          subido_por?: string | null
          tamano_bytes?: number | null
          tipo?: Database["public"]["Enums"]["tipo_documento"]
        }
        Relationships: [
          {
            foreignKeyName: "documentos_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "jugadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_subido_por_fkey"
            columns: ["subido_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipos: {
        Row: {
          academia_id: string
          activo: boolean
          auxiliar_id: string | null
          categoria_id: string
          creado_en: string
          entrenador_id: string | null
          id: string
          nombre: string
          temporada_id: string
        }
        Insert: {
          academia_id: string
          activo?: boolean
          auxiliar_id?: string | null
          categoria_id: string
          creado_en?: string
          entrenador_id?: string | null
          id?: string
          nombre: string
          temporada_id: string
        }
        Update: {
          academia_id?: string
          activo?: boolean
          auxiliar_id?: string | null
          categoria_id?: string
          creado_en?: string
          entrenador_id?: string | null
          id?: string
          nombre?: string
          temporada_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipos_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_auxiliar_id_fkey"
            columns: ["auxiliar_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["categoria_id"]
          },
          {
            foreignKeyName: "equipos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["categoria_por_edad_id"]
          },
          {
            foreignKeyName: "equipos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "v_ranking_equipo"
            referencedColumns: ["categoria_id"]
          },
          {
            foreignKeyName: "equipos_entrenador_id_fkey"
            columns: ["entrenador_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "temporadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["temporada_id"]
          },
        ]
      }
      evaluacion_detalle: {
        Row: {
          comentario: string | null
          criterio_id: string
          evaluacion_id: string
          puntaje: number
        }
        Insert: {
          comentario?: string | null
          criterio_id: string
          evaluacion_id: string
          puntaje: number
        }
        Update: {
          comentario?: string | null
          criterio_id?: string
          evaluacion_id?: string
          puntaje?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluacion_detalle_criterio_id_fkey"
            columns: ["criterio_id"]
            isOneToOne: false
            referencedRelation: "criterios_evaluacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluacion_detalle_evaluacion_id_fkey"
            columns: ["evaluacion_id"]
            isOneToOne: false
            referencedRelation: "evaluaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluaciones: {
        Row: {
          actualizado_en: string
          comentario_general: string | null
          creado_en: string
          equipo_id: string | null
          estado: Database["public"]["Enums"]["estado_evaluacion"]
          evaluador_id: string
          fecha: string
          id: string
          jugador_id: string
          periodo_id: string
        }
        Insert: {
          actualizado_en?: string
          comentario_general?: string | null
          creado_en?: string
          equipo_id?: string | null
          estado?: Database["public"]["Enums"]["estado_evaluacion"]
          evaluador_id: string
          fecha?: string
          id?: string
          jugador_id: string
          periodo_id: string
        }
        Update: {
          actualizado_en?: string
          comentario_general?: string | null
          creado_en?: string
          equipo_id?: string | null
          estado?: Database["public"]["Enums"]["estado_evaluacion"]
          evaluador_id?: string
          fecha?: string
          id?: string
          jugador_id?: string
          periodo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["equipo_id"]
          },
          {
            foreignKeyName: "evaluaciones_evaluador_id_fkey"
            columns: ["evaluador_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "jugadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "periodos_evaluacion"
            referencedColumns: ["id"]
          },
        ]
      }
      fichas_medicas: {
        Row: {
          actualizado_en: string
          actualizado_por: string | null
          alergias: string | null
          apto_deportivo: boolean | null
          contacto_emergencia_nombre: string | null
          contacto_emergencia_parentesco: string | null
          contacto_emergencia_telefono: string | null
          enfermedades: string | null
          fecha_apto: string | null
          jugador_id: string
          medicamentos: string | null
          numero_poliza: string | null
          observaciones: string | null
          seguro_medico: string | null
          tipo_sangre: string | null
        }
        Insert: {
          actualizado_en?: string
          actualizado_por?: string | null
          alergias?: string | null
          apto_deportivo?: boolean | null
          contacto_emergencia_nombre?: string | null
          contacto_emergencia_parentesco?: string | null
          contacto_emergencia_telefono?: string | null
          enfermedades?: string | null
          fecha_apto?: string | null
          jugador_id: string
          medicamentos?: string | null
          numero_poliza?: string | null
          observaciones?: string | null
          seguro_medico?: string | null
          tipo_sangre?: string | null
        }
        Update: {
          actualizado_en?: string
          actualizado_por?: string | null
          alergias?: string | null
          apto_deportivo?: boolean | null
          contacto_emergencia_nombre?: string | null
          contacto_emergencia_parentesco?: string | null
          contacto_emergencia_telefono?: string | null
          enfermedades?: string | null
          fecha_apto?: string | null
          jugador_id?: string
          medicamentos?: string | null
          numero_poliza?: string | null
          observaciones?: string | null
          seguro_medico?: string | null
          tipo_sangre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fichas_medicas_actualizado_por_fkey"
            columns: ["actualizado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_medicas_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: true
            referencedRelation: "jugadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fichas_medicas_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: true
            referencedRelation: "v_jugadores"
            referencedColumns: ["id"]
          },
        ]
      }
      inscripciones: {
        Row: {
          actualizado_en: string
          categoria_id: string | null
          creado_en: string
          creado_por: string | null
          equipo_id: string | null
          es_principal: boolean
          estado: Database["public"]["Enums"]["estado_inscripcion"]
          fecha_alta: string
          fecha_baja: string | null
          id: string
          jugador_id: string
          motivo_excepcion: string | null
          numero_camiseta: number | null
          posicion: string | null
          temporada_id: string
        }
        Insert: {
          actualizado_en?: string
          categoria_id?: string | null
          creado_en?: string
          creado_por?: string | null
          equipo_id?: string | null
          es_principal?: boolean
          estado?: Database["public"]["Enums"]["estado_inscripcion"]
          fecha_alta: string
          fecha_baja?: string | null
          id?: string
          jugador_id: string
          motivo_excepcion?: string | null
          numero_camiseta?: number | null
          posicion?: string | null
          temporada_id: string
        }
        Update: {
          actualizado_en?: string
          categoria_id?: string | null
          creado_en?: string
          creado_por?: string | null
          equipo_id?: string | null
          es_principal?: boolean
          estado?: Database["public"]["Enums"]["estado_inscripcion"]
          fecha_alta?: string
          fecha_baja?: string | null
          id?: string
          jugador_id?: string
          motivo_excepcion?: string | null
          numero_camiseta?: number | null
          posicion?: string | null
          temporada_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscripciones_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["categoria_id"]
          },
          {
            foreignKeyName: "inscripciones_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["categoria_por_edad_id"]
          },
          {
            foreignKeyName: "inscripciones_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "v_ranking_equipo"
            referencedColumns: ["categoria_id"]
          },
          {
            foreignKeyName: "inscripciones_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_equipo_id_temporada_id_fkey"
            columns: ["equipo_id", "temporada_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id", "temporada_id"]
          },
          {
            foreignKeyName: "inscripciones_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "jugadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "temporadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["temporada_id"]
          },
        ]
      }
      jugador_tutor: {
        Row: {
          autoriza_retiro: boolean
          es_contacto_principal: boolean
          jugador_id: string
          parentesco: Database["public"]["Enums"]["parentesco"]
          tutor_id: string
        }
        Insert: {
          autoriza_retiro?: boolean
          es_contacto_principal?: boolean
          jugador_id: string
          parentesco: Database["public"]["Enums"]["parentesco"]
          tutor_id: string
        }
        Update: {
          autoriza_retiro?: boolean
          es_contacto_principal?: boolean
          jugador_id?: string
          parentesco?: Database["public"]["Enums"]["parentesco"]
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jugador_tutor_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "jugadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jugador_tutor_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jugador_tutor_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutores"
            referencedColumns: ["id"]
          },
        ]
      }
      jugadores: {
        Row: {
          academia_id: string
          actualizado_en: string
          apellidos: string
          autoriza_uso_imagen: boolean
          codigo: string
          colegio: string | null
          creado_en: string
          creado_por: string | null
          direccion: string | null
          estado: Database["public"]["Enums"]["estado_jugador"]
          fecha_autorizacion: string | null
          fecha_ingreso: string
          fecha_nacimiento: string
          foto_url: string | null
          grado_escolar: string | null
          id: string
          lugar_nacimiento: string | null
          nombres: string
          observaciones: string | null
        }
        Insert: {
          academia_id: string
          actualizado_en?: string
          apellidos: string
          autoriza_uso_imagen?: boolean
          codigo: string
          colegio?: string | null
          creado_en?: string
          creado_por?: string | null
          direccion?: string | null
          estado?: Database["public"]["Enums"]["estado_jugador"]
          fecha_autorizacion?: string | null
          fecha_ingreso?: string
          fecha_nacimiento: string
          foto_url?: string | null
          grado_escolar?: string | null
          id?: string
          lugar_nacimiento?: string | null
          nombres: string
          observaciones?: string | null
        }
        Update: {
          academia_id?: string
          actualizado_en?: string
          apellidos?: string
          autoriza_uso_imagen?: boolean
          codigo?: string
          colegio?: string | null
          creado_en?: string
          creado_por?: string | null
          direccion?: string | null
          estado?: Database["public"]["Enums"]["estado_jugador"]
          fecha_autorizacion?: string | null
          fecha_ingreso?: string
          fecha_nacimiento?: string
          foto_url?: string | null
          grado_escolar?: string | null
          id?: string
          lugar_nacimiento?: string | null
          nombres?: string
          observaciones?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jugadores_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jugadores_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          academia_id: string
          activo: boolean
          actualizado_en: string
          creado_en: string
          foto_url: string | null
          id: string
          nombre_completo: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          telefono: string | null
        }
        Insert: {
          academia_id: string
          activo?: boolean
          actualizado_en?: string
          creado_en?: string
          foto_url?: string | null
          id: string
          nombre_completo: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          telefono?: string | null
        }
        Update: {
          academia_id?: string
          activo?: boolean
          actualizado_en?: string
          creado_en?: string
          foto_url?: string | null
          id?: string
          nombre_completo?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
        ]
      }
      periodos_evaluacion: {
        Row: {
          cerrado: boolean
          fecha_fin: string
          fecha_inicio: string
          id: string
          nombre: string
          orden: number
          temporada_id: string
        }
        Insert: {
          cerrado?: boolean
          fecha_fin: string
          fecha_inicio: string
          id?: string
          nombre: string
          orden?: number
          temporada_id: string
        }
        Update: {
          cerrado?: boolean
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          nombre?: string
          orden?: number
          temporada_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "periodos_evaluacion_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "temporadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodos_evaluacion_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["temporada_id"]
          },
        ]
      }
      sesiones: {
        Row: {
          academia_id: string
          actualizado_en: string
          categoria_id: string | null
          creado_en: string
          equipo_id: string | null
          estado: Database["public"]["Enums"]["estado_sesion"]
          fecha: string
          goles_contra: number | null
          goles_favor: number | null
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          lugar: string | null
          notas: string | null
          registrada_por: string | null
          rival: string | null
          temporada_id: string
          tipo: Database["public"]["Enums"]["tipo_sesion"]
        }
        Insert: {
          academia_id: string
          actualizado_en?: string
          categoria_id?: string | null
          creado_en?: string
          equipo_id?: string | null
          estado?: Database["public"]["Enums"]["estado_sesion"]
          fecha: string
          goles_contra?: number | null
          goles_favor?: number | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          lugar?: string | null
          notas?: string | null
          registrada_por?: string | null
          rival?: string | null
          temporada_id: string
          tipo?: Database["public"]["Enums"]["tipo_sesion"]
        }
        Update: {
          academia_id?: string
          actualizado_en?: string
          categoria_id?: string | null
          creado_en?: string
          equipo_id?: string | null
          estado?: Database["public"]["Enums"]["estado_sesion"]
          fecha?: string
          goles_contra?: number | null
          goles_favor?: number | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          lugar?: string | null
          notas?: string | null
          registrada_por?: string | null
          rival?: string | null
          temporada_id?: string
          tipo?: Database["public"]["Enums"]["tipo_sesion"]
        }
        Relationships: [
          {
            foreignKeyName: "sesiones_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesiones_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesiones_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["categoria_id"]
          },
          {
            foreignKeyName: "sesiones_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["categoria_por_edad_id"]
          },
          {
            foreignKeyName: "sesiones_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "v_ranking_equipo"
            referencedColumns: ["categoria_id"]
          },
          {
            foreignKeyName: "sesiones_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesiones_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["equipo_id"]
          },
          {
            foreignKeyName: "sesiones_registrada_por_fkey"
            columns: ["registrada_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesiones_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "temporadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesiones_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["temporada_id"]
          },
        ]
      }
      temporadas: {
        Row: {
          academia_id: string
          activa: boolean
          anio: number
          cerrada: boolean
          creado_en: string
          fecha_fin: string
          fecha_inicio: string
          id: string
          nombre: string
        }
        Insert: {
          academia_id: string
          activa?: boolean
          anio: number
          cerrada?: boolean
          creado_en?: string
          fecha_fin: string
          fecha_inicio: string
          id?: string
          nombre: string
        }
        Update: {
          academia_id?: string
          activa?: boolean
          anio?: number
          cerrada?: boolean
          creado_en?: string
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "temporadas_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
        ]
      }
      tutores: {
        Row: {
          academia_id: string
          actualizado_en: string
          apellidos: string
          creado_en: string
          direccion: string | null
          dpi: string | null
          email: string | null
          id: string
          lugar_trabajo: string | null
          nombres: string
          ocupacion: string | null
          perfil_id: string | null
          telefono: string | null
          telefono_alt: string | null
        }
        Insert: {
          academia_id: string
          actualizado_en?: string
          apellidos: string
          creado_en?: string
          direccion?: string | null
          dpi?: string | null
          email?: string | null
          id?: string
          lugar_trabajo?: string | null
          nombres: string
          ocupacion?: string | null
          perfil_id?: string | null
          telefono?: string | null
          telefono_alt?: string | null
        }
        Update: {
          academia_id?: string
          actualizado_en?: string
          apellidos?: string
          creado_en?: string
          direccion?: string | null
          dpi?: string | null
          email?: string | null
          id?: string
          lugar_trabajo?: string | null
          nombres?: string
          ocupacion?: string | null
          perfil_id?: string | null
          telefono?: string | null
          telefono_alt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tutores_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutores_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_asistencia_jugador: {
        Row: {
          ausentes: number | null
          entrenamientos: number | null
          equipo_id: string | null
          goles: number | null
          jugador_id: string | null
          justificados: number | null
          minutos: number | null
          partidos: number | null
          porcentaje: number | null
          presentes: number | null
          sesiones_convocadas: number | null
          tardes: number | null
          temporada_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inscripciones_equipo_id_temporada_id_fkey"
            columns: ["equipo_id", "temporada_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id", "temporada_id"]
          },
          {
            foreignKeyName: "inscripciones_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "jugadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "temporadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["temporada_id"]
          },
        ]
      }
      v_evaluacion_dimension: {
        Row: {
          criterios_evaluados: number | null
          dimension: Database["public"]["Enums"]["dimension_criterio"] | null
          jugador_id: string | null
          periodo: string | null
          periodo_id: string | null
          promedio: number | null
          temporada_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "jugadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "periodos_evaluacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodos_evaluacion_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "temporadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodos_evaluacion_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["temporada_id"]
          },
        ]
      }
      v_jugadores: {
        Row: {
          academia_id: string | null
          anio: number | null
          apellidos: string | null
          autoriza_uso_imagen: boolean | null
          categoria: string | null
          categoria_id: string | null
          categoria_por_edad: string | null
          categoria_por_edad_id: string | null
          codigo: string | null
          colegio: string | null
          direccion: string | null
          edad_deportiva: number | null
          edad_real: number | null
          entrenador_id: string | null
          equipo: string | null
          equipo_categoria: string | null
          equipo_categoria_distinta: boolean | null
          equipo_id: string | null
          estado: Database["public"]["Enums"]["estado_jugador"] | null
          fecha_ingreso: string | null
          fecha_nacimiento: string | null
          foto_url: string | null
          fuera_de_categoria: boolean | null
          id: string | null
          inscripcion_id: string | null
          motivo_excepcion: string | null
          nombre_completo: string | null
          nombres: string | null
          numero_camiseta: number | null
          posicion: string | null
          sin_equipo: boolean | null
          sin_inscribir: boolean | null
          temporada: string | null
          temporada_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipos_entrenador_id_fkey"
            columns: ["entrenador_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jugadores_academia_id_fkey"
            columns: ["academia_id"]
            isOneToOne: false
            referencedRelation: "academias"
            referencedColumns: ["id"]
          },
        ]
      }
      v_ranking_equipo: {
        Row: {
          ausentes: number | null
          categoria: string | null
          categoria_color: string | null
          categoria_id: string | null
          codigo: string | null
          entrenamientos: number | null
          equipo: string | null
          equipo_id: string | null
          foto_url: string | null
          goles: number | null
          jugador_id: string | null
          justificados: number | null
          minutos: number | null
          nivel_asistencia: string | null
          nombre_completo: string | null
          partidos: number | null
          porcentaje: number | null
          presentes: number | null
          puesto_categoria: number | null
          puesto_equipo: number | null
          sesiones_convocadas: number | null
          tardes: number | null
          temporada_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inscripciones_equipo_id_temporada_id_fkey"
            columns: ["equipo_id", "temporada_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id", "temporada_id"]
          },
          {
            foreignKeyName: "inscripciones_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "jugadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_jugador_id_fkey"
            columns: ["jugador_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "temporadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inscripciones_temporada_id_fkey"
            columns: ["temporada_id"]
            isOneToOne: false
            referencedRelation: "v_jugadores"
            referencedColumns: ["temporada_id"]
          },
        ]
      }
    }
    Functions: {
      edad_deportiva: {
        Args: { anio_temporada: number; fecha_nac: string }
        Returns: number
      }
      edad_real: { Args: { fecha_nac: string }; Returns: number }
      es_admin: { Args: never; Returns: boolean }
      es_director: { Args: never; Returns: boolean }
      es_mi_categoria: { Args: { p_categoria: string }; Returns: boolean }
      es_mi_equipo: { Args: { p_equipo: string }; Returns: boolean }
      es_mi_hijo: { Args: { p_jugador: string }; Returns: boolean }
      es_mi_jugador: { Args: { p_jugador: string }; Returns: boolean }
      mi_academia: { Args: never; Returns: string }
      mi_rol: {
        Args: never
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
      preview_renovacion: {
        Args: { p_temporada_destino: string }
        Returns: {
          categoria_anterior: string
          categoria_sugerida: string
          categoria_sugerida_id: string
          codigo: string
          edad_deportiva_nueva: number
          egresa: boolean
          equipo_anterior: string
          estaba_fuera_categoria: boolean
          jugador_id: string
          nombre_completo: string
        }[]
      }
      siguiente_codigo_jugador: {
        Args: { p_academia: string }
        Returns: string
      }
    }
    Enums: {
      dimension_criterio: "tecnica" | "tactica" | "fisica" | "actitudinal"
      estado_asistencia: "presente" | "tarde" | "justificado" | "ausente"
      estado_evaluacion: "borrador" | "finalizada"
      estado_inscripcion: "activa" | "baja" | "trasladado"
      estado_jugador: "activo" | "inactivo" | "retirado" | "egresado"
      estado_sesion: "programada" | "realizada" | "suspendida" | "cancelada"
      parentesco: "padre" | "madre" | "encargado" | "otro"
      rol_usuario: "director" | "coordinador" | "entrenador" | "tutor"
      tipo_documento:
        | "partida_nacimiento"
        | "dpi_tutor"
        | "ficha_medica"
        | "autorizacion"
        | "fotografia"
        | "otro"
      tipo_sesion: "entrenamiento" | "partido" | "amistoso" | "torneo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      dimension_criterio: ["tecnica", "tactica", "fisica", "actitudinal"],
      estado_asistencia: ["presente", "tarde", "justificado", "ausente"],
      estado_evaluacion: ["borrador", "finalizada"],
      estado_inscripcion: ["activa", "baja", "trasladado"],
      estado_jugador: ["activo", "inactivo", "retirado", "egresado"],
      estado_sesion: ["programada", "realizada", "suspendida", "cancelada"],
      parentesco: ["padre", "madre", "encargado", "otro"],
      rol_usuario: ["director", "coordinador", "entrenador", "tutor"],
      tipo_documento: [
        "partida_nacimiento",
        "dpi_tutor",
        "ficha_medica",
        "autorizacion",
        "fotografia",
        "otro",
      ],
      tipo_sesion: ["entrenamiento", "partido", "amistoso", "torneo"],
    },
  },
} as const
