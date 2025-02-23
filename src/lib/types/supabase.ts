export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Position {
  position_id: string
  position_title: string
  agency: string
  jr_grade: string
  incumbent_id: string | null
  created_at: string
  updated_at: string
}

export interface Officer {
  officer_id: string
  name: string
  email?: string
  mx_equivalent_grade: string | null
  grade: string | null
  ihrp_certification: string | null
  hrlp: string | null
  created_at: string
  updated_at: string
}

export interface HRCompetency {
  competency_id: number
  competency_name: string
  description: string | null
  max_pl_level: number
  created_at: string
  updated_at: string
}

export interface PositionSuccessor {
  position_id: string
  successor_id: string
  succession_type: 'immediate' | '1-2_years' | '3-5_years'
  created_at: string
}

export interface OfficerCompetency {
  officer_competency_id: string
  officer_id: string
  competency_id: string
  proficiency_level: number
  created_at: string
  updated_at: string
}

export interface OOAStint {
  stint_id: string
  stint_name: string
  stint_type: string
  year: number
}

export interface OfficerStint {
  officer_stint_id: string
  officer_id: string
  stint_id: string
  created_at: string
  updated_at: string
}

export interface AllowedEmail {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      positions: {
        Row: Position
        Insert: Omit<Position, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Position, 'created_at' | 'updated_at'>>
      }
      officers: {
        Row: Officer
        Insert: Omit<Officer, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Officer, 'created_at' | 'updated_at'>>
      }
      hr_competencies: {
        Row: HRCompetency
        Insert: Omit<HRCompetency, 'competency_id'>
        Update: Partial<Omit<HRCompetency, 'competency_id'>>
      }
      position_successors: {
        Row: PositionSuccessor
        Insert: Omit<PositionSuccessor, 'created_at'>
        Update: Partial<Omit<PositionSuccessor, 'created_at'>>
      }
      officer_competencies: {
        Row: OfficerCompetency
        Insert: OfficerCompetency
        Update: Partial<OfficerCompetency>
      }
      ooa_stints: {
        Row: OOAStint
        Insert: Omit<OOAStint, 'stint_id'>
        Update: Partial<Omit<OOAStint, 'stint_id'>>
      }
      officer_stints: {
        Row: OfficerStint
        Insert: OfficerStint
        Update: Partial<OfficerStint>
      }
      allowed_emails: {
        Row: AllowedEmail
        Insert: Omit<AllowedEmail, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AllowedEmail, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
} 