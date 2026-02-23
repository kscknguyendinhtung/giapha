export interface Member {
  id: number;
  name: string;
  gender: 'male' | 'female' | 'other';
  birth_date?: string;
  death_date?: string;
  biography?: string;
  photo_url?: string;
  address?: string;
  phone?: string;
  burial_place?: string;
  father_id?: number | null;
  mother_id?: number | null;
  spouse_id?: number | null;
  generation: number;
  branch_name?: string;
  child_order?: number;
  spouse_order?: number;
}

export interface TitleLine {
  text: string;
  fontSize: number;
}

export interface TreeConfig {
  title: string;
  title_lines?: string; // JSON string of TitleLine[]
  background_url?: string;
  overlay_url?: string;
  overlay_x?: number;
  overlay_y?: number;
  overlay_scale?: number;
  tree_x?: number;
  tree_y?: number;
  tree_scale?: number;
  title_x?: number;
  title_y?: number;
  title_font_size?: number;
  title_font_family?: string;
}

export interface Relationship {
  id: number;
  member_id: number;
  related_member_id: number;
  type: 'parent' | 'spouse' | 'child';
}
