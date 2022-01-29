import axios from "axios";

export interface Properties {
  name: string;
}

export interface Crs {
  type: string;
  properties: Properties;
}

export interface Properties2 {
  area_id: number;
  name: string;
  pin_code: number;
  users: User[];
}

export interface Geometry {
  type: string;
  coordinates: number[][][];
}

export interface Feature {
  type: string;
  properties: Properties2;
  geometry: Geometry;
}

export interface IGeoJson {
  type: string;
  crs: Crs;
  features: Feature[];
}

const getGeographicData = async () => {
  try {
    const response = await axios.get<IGeoJson>(
      "https://kyupid-api.vercel.app/api/areas"
    );
    return response.data;
  } catch (error) {
    console.log("Error getting GeoJson data");
  }
};

export interface IUser {
  users: User[];
}

export interface User {
  user_id: string;
  area_id: number;
  age: number;
  gender: string;
  is_pro_user: boolean;
  total_matches: number;
}

const getUsersData = async () => {
  try {
    const response = await axios.get<IUser>(
      "https://kyupid-api.vercel.app/api/users"
    );
    return response.data;
  } catch (error) {
    console.log("Error getting GeoJson data");
  }
};

export const API = {
  getGeographicData,
  getUsersData,
};
