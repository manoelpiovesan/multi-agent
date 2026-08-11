export interface APIUserCreate {
  google_profile_id: string;
  name: string;
  email: string;
  picture?: string;
  role?: string;
}

export interface APIUser extends APIUserCreate {
  id: string;
}

export interface APIUserRegister {
  name: string;
  email: string;
  password: string;
}

export interface APIUserLogin {
  email: string;
  password: string;
}
