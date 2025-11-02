import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export { z, zodResolver };

// Ví dụ schema dùng lại cho form demo
export const exampleLoginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Tối thiểu 6 ký tự"),
});

export type ExampleLoginInput = z.infer<typeof exampleLoginSchema>;
