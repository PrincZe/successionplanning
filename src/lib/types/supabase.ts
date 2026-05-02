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

export interface OTPVerification {
  id: string
  email: string
  otp_code: string
  expires_at: string
  verified: boolean
  attempts: number
  created_at: string
}

export interface OfficerRemark {
  remark_id: number
  officer_id: string
  remark_date: string
  place: string
  details: string
  created_at: string
  updated_at: string
}

export interface PositionRequiredCompetency {
  position_id: string
  competency_id: number
  required_pl_level: number
  weight: number
}

export interface IncumbentRisk {
  position_id: string
  risk_horizon_months: number
  risk_reason: string | null
  updated_at: string
}

export interface PipelineCriterion {
  criterion_key: string
  value: Json
  description: string | null
  updated_at: string
}

export interface OfficerQualitativeSignals {
  officer_id: string
  endorsement_count: number
  endorsement_specificity_score: number
  endorsement_seniority_score: number
  domain_match_keywords: string[]
  concerns_count: number
  sentiment_trajectory: 'improving' | 'stable' | 'declining' | 'unknown' | null
  qualitative_score: number
  signals: Json
  source_remark_ids: number[]
  generated_at: string
  generation_method: 'mock' | 'ai'
}

export interface PipelineAssessment {
  position_id: string
  overall_score: number
  overall_band: 'green' | 'amber' | 'red'
  sub_scores: Json
  reasons: Json
  ai_narration: string | null
  ai_interventions: Json
  computed_at: string
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
      otp_verifications: {
        Row: OTPVerification
        Insert: Omit<OTPVerification, 'id' | 'created_at'>
        Update: Partial<Omit<OTPVerification, 'id' | 'created_at'>>
      }
      officer_remarks: {
        Row: OfficerRemark
        Insert: Omit<OfficerRemark, 'remark_id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<OfficerRemark, 'remark_id' | 'created_at' | 'updated_at'>>
      }
      position_required_competencies: {
        Row: PositionRequiredCompetency
        Insert: PositionRequiredCompetency
        Update: Partial<PositionRequiredCompetency>
      }
      incumbent_risk: {
        Row: IncumbentRisk
        Insert: Omit<IncumbentRisk, 'updated_at'>
        Update: Partial<Omit<IncumbentRisk, 'updated_at'>>
      }
      pipeline_criteria: {
        Row: PipelineCriterion
        Insert: Omit<PipelineCriterion, 'updated_at'>
        Update: Partial<Omit<PipelineCriterion, 'updated_at'>>
      }
      officer_qualitative_signals: {
        Row: OfficerQualitativeSignals
        Insert: Partial<OfficerQualitativeSignals> & { officer_id: string }
        Update: Partial<OfficerQualitativeSignals>
      }
      pipeline_assessments: {
        Row: PipelineAssessment
        Insert: Omit<PipelineAssessment, 'computed_at'>
        Update: Partial<Omit<PipelineAssessment, 'computed_at'>>
      }
    }
  }
}