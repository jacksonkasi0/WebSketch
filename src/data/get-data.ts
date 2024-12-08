import { DocumentData } from "../types";

import page_data from "./my-example.com.json"

// Function to get JSON data (replace this with actual data fetching logic)
export async function getJSONData(): Promise<DocumentData> {
  return page_data
}
