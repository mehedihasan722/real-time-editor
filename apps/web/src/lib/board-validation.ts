import { z } from "zod";

export const boardTitleSchema = z.string().trim().min(1, "Title is required").max(60, "Title cannot be longer than 60 characters");
