export interface User {
  id: number;
  username: string;
  is_admin: number;
  created_at: string;
}

export interface Booking {
  id: number;
  user_id: number;
  username: string;
  start_time: string;
  end_time: string;
  work_type: string;
  created_at: string;
}
