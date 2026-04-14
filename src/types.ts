export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface Booking {
  id: number;
  user_id: number;
  username: string;
  start_time: string;
  end_time: string;
  created_at: string;
}
